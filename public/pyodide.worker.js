/* Pyodide Web Worker
 * 将 Python 执行移到后台线程，避免无限循环阻塞主线程
 * 支持 input() 函数，通过消息通信获取用户输入
 */

let pyodideReady = false;
let pyodideInstance = null;
let inputResolve = null; // 用于等待用户输入的 Promise resolve

// 加载 Pyodide
async function loadPyodideEngine() {
  try {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
    
    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
    });
    
    pyodideReady = true;
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
}

// 等待用户输入
function waitForInput(promptText) {
  return new Promise((resolve) => {
    inputResolve = resolve;
    self.postMessage({ type: 'input_request', prompt: promptText });
  });
}

// 运行 Python 代码
async function runPythonCode(code) {
  if (!pyodideReady || !pyodideInstance) {
    self.postMessage({ 
      type: 'result', 
      success: false, 
      output: '', 
      error: 'Python 运行环境尚未加载完成' 
    });
    return;
  }

  try {
    // 重定向 stdout
    pyodideInstance.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);

    // 设置 input 函数，通过消息通信获取用户输入
    // 使用 pyodide.registerJsModule 注册输入函数
    pyodideInstance.registerJsModule('__input_module__', {
      request_input: waitForInput
    });

    // 使用异步方式运行代码，支持 input 函数
    pyodideInstance.runPython(`
import __input_module__
import asyncio

# 创建一个事件循环来处理异步输入
_loop = asyncio.new_event_loop()
asyncio.set_event_loop(_loop)

def custom_input(prompt=''):
    # 将 prompt 转为字符串
    prompt_str = str(prompt) if prompt else ''
    # 使用事件循环运行异步函数
    try:
        result = _loop.run_until_complete(__input_module__.request_input(prompt_str))
        return result
    except Exception as e:
        return ''

import builtins
builtins.input = custom_input
`);

    // 运行用户代码
    const result = pyodideInstance.runPython(code);

    // 获取输出
    const stdout = pyodideInstance.runPython('sys.stdout.getvalue()');
    
    // 恢复 stdout
    pyodideInstance.runPython('sys.stdout = sys.__stdout__');

    self.postMessage({ 
      type: 'result', 
      success: true, 
      output: stdout || (result !== undefined ? String(result) : ''), 
      error: null 
    });
  } catch (error) {
    // 确保恢复 stdout
    try {
      pyodideInstance.runPython('sys.stdout = sys.__stdout__');
    } catch (e) {
      // 忽略
    }
    
    self.postMessage({ 
      type: 'result', 
      success: false, 
      output: '', 
      error: error.message 
    });
  }
}

// 监听主线程消息
self.onmessage = async function(e) {
  const { type, code, inputValue } = e.data;
  
  switch (type) {
    case 'load':
      await loadPyodideEngine();
      break;
    case 'run':
      await runPythonCode(code);
      break;
    case 'input_response':
      // 用户输入响应
      if (inputResolve) {
        inputResolve(inputValue);
        inputResolve = null;
      }
      break;
  }
};

// 自动开始加载
loadPyodideEngine();
