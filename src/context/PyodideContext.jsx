import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const PyodideContext = createContext(null);

export const usePyodide = () => {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }
  return context;
};

// 加载主线程 Pyodide（用于包含 input() 的代码）
let mainPyodide = null;
let mainPyodideLoading = false;
let mainPyodideReady = false;

async function loadMainPyodide() {
  if (mainPyodideReady || mainPyodideLoading) return;
  mainPyodideLoading = true;
  
  try {
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    mainPyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
    });
    
    mainPyodideReady = true;
    console.log('主线程 Pyodide 加载成功');
  } catch (err) {
    console.error('主线程 Pyodide 加载失败:', err);
  } finally {
    mainPyodideLoading = false;
  }
}

// 预处理代码：将 input() 替换为 await input()
function preprocessCode(code) {
  // 将 input(...) 替换为 await input(...)
  // 但要避免替换字符串中的 input
  let processed = code;
  
  // 替换所有 input() 调用为 await input()
  // 使用正则匹配不在字符串中的 input(
  processed = processed.replace(/\binput\s*\(/g, 'await input(');
  
  // 包装成异步函数
  return `
async def __main__():
    __code__ = """${processed.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}"""
    exec(compile(__code__, '<input>', 'exec'), globals())
await __main__()
`;
}

// 在主线程运行代码（支持 input 和实时输出）
async function runOnMainThread(code, onOutput) {
  if (!mainPyodideReady) {
    await loadMainPyodide();
  }
  
  if (!mainPyodide) {
    return { success: false, output: '', error: 'Python 运行环境加载失败' };
  }

  try {
    // 创建自定义 stdout，支持实时输出
    mainPyodide.runPython(`
import sys
import js

class RealtimeStdout:
    def __init__(self):
        self.buffer = ''
    
    def write(self, text):
        if text:
            self.buffer += text
            # 调用 JavaScript 回调
            js.__onPythonOutput__(text)
    
    def flush(self):
        pass

sys.stdout = RealtimeStdout()
`);

    // 设置全局输出回调
    window.__onPythonOutput__ = (text) => {
      if (onOutput) {
        onOutput(text);
      }
    };

    // 设置 input 函数（异步版本，支持实时输出）
    mainPyodide.runPython(`
import js
import asyncio

async def custom_input(prompt=''):
    prompt_str = str(prompt) if prompt else ''
    # 使用 await 让出控制权，允许 UI 更新
    await asyncio.sleep(0)
    # 使用 JavaScript 的 prompt
    result = js.prompt(prompt_str)
    if result is None:
        raise EOFError('用户取消输入')
    return result

import builtins
builtins.input = custom_input
`);

    // 预处理代码并运行
    const processedCode = preprocessCode(code);
    await mainPyodide.runPythonAsync(processedCode);
    
    // 获取缓冲区中的输出
    const bufferOutput = mainPyodide.runPython('sys.stdout.buffer');
    
    // 恢复 stdout
    mainPyodide.runPython('sys.stdout = sys.__stdout__');
    
    // 清理回调
    delete window.__onPythonOutput__;

    return {
      success: true,
      output: bufferOutput || '',
      error: null
    };
  } catch (error) {
    try {
      mainPyodide.runPython('sys.stdout = sys.__stdout__');
    } catch (e) {
      // 忽略
    }
    
    delete window.__onPythonOutput__;
    
    return {
      success: false,
      output: '',
      error: error.message
    };
  }
}

export const PyodideProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const pendingResolveRef = useRef(null);

  // 创建 Worker（用于不含 input 的代码）
  const createWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker('/pyodide.worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, success, output: workerOutput, error: workerError } = e.data;

      if (type === 'ready') {
        setIsLoading(false);
        console.log('Pyodide Worker 加载成功');
      } else if (type === 'result') {
        if (pendingResolveRef.current) {
          pendingResolveRef.current({ success, output: workerOutput, error: workerError });
          pendingResolveRef.current = null;
        }
      }
    };

    worker.onerror = (err) => {
      console.error('Worker 错误:', err);
      setError(err.message || 'Worker 加载失败');
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    createWorker();
    loadMainPyodide();
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [createWorker]);

  // 运行 Python 代码
  // onOutput: 实时输出回调函数
  const runPython = useCallback(async (code, onOutput) => {
    const hasInput = /\binput\s*\(/.test(code);
    
    if (hasInput) {
      // 包含 input()，在主线程运行（支持实时输出）
      return await runOnMainThread(code, onOutput);
    } else {
      // 不含 input()，在 Worker 中运行
      if (!workerRef.current) {
        return { success: false, output: '', error: 'Python 运行环境未加载' };
      }

      if (isLoading) {
        return { success: false, output: '', error: 'Python 运行环境正在加载中，请稍候...' };
      }

      return new Promise((resolve) => {
        pendingResolveRef.current = resolve;
        workerRef.current.postMessage({ type: 'run', code });
      });
    }
  }, [isLoading]);

  // 停止运行
  const stopPython = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;

      if (pendingResolveRef.current) {
        pendingResolveRef.current({
          success: false,
          output: '',
          error: '用户停止执行'
        });
        pendingResolveRef.current = null;
      }

      createWorker();
    }
  }, [createWorker]);

  const value = {
    isLoading,
    error,
    runPython,
    stopPython,
    reloadPyodide: createWorker
  };

  return (
    <PyodideContext.Provider value={value}>
      {children}
    </PyodideContext.Provider>
  );
};
