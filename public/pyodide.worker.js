/* Pyodide Web Worker
 * 将 Python 执行移到后台线程，避免无限循环阻塞主线程
 * 只处理不含 input() 的代码
 */

let pyodideReady = false;
let pyodideInstance = null;

// 加载 Pyodide
async function loadPyodideEngine() {
  try {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
    
    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
    });
    
    // 加载 micropip 用于安装包
    await pyodideInstance.loadPackage('micropip');
    
    // 提供 pip_install 函数
    pyodideInstance.runPython(`
import micropip

def pip_install(package_name):
    """安装 Python 包（同步版本）"""
    import asyncio
    loop = asyncio.new_event_loop()
    loop.run_until_complete(micropip.install(package_name))
    print(f'已安装: {package_name}')
`);
    
    pyodideReady = true;
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
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
  const { type, code } = e.data;
  
  switch (type) {
    case 'load':
      await loadPyodideEngine();
      break;
    case 'run':
      await runPythonCode(code);
      break;
  }
};

// 自动开始加载
loadPyodideEngine();
