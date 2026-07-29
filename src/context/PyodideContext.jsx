import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const PyodideContext = createContext(null);

export const usePyodide = () => {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }
  return context;
};

// 加载主线程 Pyodide
let mainPyodide = null;
let mainPyodideLoading = false;
let mainPyodideReady = false;
let inputResolveRef = null; // 用于等待用户输入

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

// 预处理代码：将 input() 替换为 await __async_input__()
function preprocessCode(code) {
  const lines = code.split('\n');
  const processedLines = lines.map(line => {
    // 替换 input(...) 为 await __async_input__(...)
    // 但要避免替换字符串中的 input
    return line.replace(/\binput\s*\(/g, 'await __async_input__(');
  });
  
  // 将所有行缩进4个空格
  const indentedCode = processedLines.map(line => '    ' + line).join('\n');
  
  // 包装成异步函数
  return `
${indentedCode}
`;
}

// 等待用户输入（从 React UI）
function waitForInput(promptText) {
  return new Promise((resolve) => {
    inputResolveRef = resolve;
    // 通知 React 显示输入框
    if (window.__showInput__) {
      window.__showInput__(promptText);
    }
  });
}

// 在主线程运行代码（支持异步 input 和实时输出）
async function runOnMainThread(code, onOutput, onInputRequest, onInputComplete) {
  if (!mainPyodideReady) {
    await loadMainPyodide();
  }
  
  if (!mainPyodide) {
    return { success: false, output: '', error: 'Python 运行环境加载失败' };
  }

  try {
    // 注册回调到全局
    window.__onPythonOutput__ = onOutput || (() => {});
    window.__showInput__ = onInputRequest || (() => {});

    // 设置自定义 stdout 和 input
    mainPyodide.runPython(`
import sys
import js

class RealtimeStdout:
    def write(self, text):
        if text:
            js.__onPythonOutput__(text)
    def flush(self):
        pass

sys.stdout = RealtimeStdout()
sys.stderr = RealtimeStdout()
`);

    // 注册异步 input 函数
    mainPyodide.registerJsModule('__input__', {
      request_input: waitForInput
    });

    mainPyodide.runPython(`
import __input__

async def __async_input__(prompt=''):
    prompt_str = str(prompt) if prompt else ''
    return await __input__.request_input(prompt_str)
`);

    // 预处理代码并运行
    const processedCode = preprocessCode(code);
    await mainPyodide.runPythonAsync(processedCode);

    // 恢复 stdout
    mainPyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');
    
    // 清理回调
    delete window.__onPythonOutput__;
    delete window.__showInput__;

    return { success: true, output: '', error: null };
  } catch (error) {
    try {
      mainPyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');
    } catch (e) {
      // 忽略
    }
    
    delete window.__onPythonOutput__;
    delete window.__showInput__;
    
    return { success: false, output: '', error: error.message };
  }
}

export const PyodideProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputPrompt, setInputPrompt] = useState(null); // 当前输入提示
  const [inputValue, setInputValue] = useState(''); // 输入值
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

  // 显示输入框
  const handleInputRequest = useCallback((prompt) => {
    setInputPrompt(prompt);
    setInputValue('');
  }, []);

  // 提交输入
  const handleInputSubmit = useCallback(() => {
    if (inputResolveRef) {
      inputResolveRef(inputValue);
      inputResolveRef = null;
    }
    setInputPrompt(null);
    setInputValue('');
  }, [inputValue]);

  // 运行 Python 代码
  const runPython = useCallback(async (code, onOutput) => {
    const hasInput = /\binput\s*\(/.test(code);
    
    if (hasInput) {
      // 包含 input()，在主线程运行（支持异步输入和实时输出）
      return await runOnMainThread(code, onOutput, handleInputRequest);
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
  }, [isLoading, handleInputRequest]);

  // 停止运行
  const stopPython = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;

      if (pendingResolveRef.current) {
        pendingResolveRef.current({ success: false, output: '', error: '用户停止执行' });
        pendingResolveRef.current = null;
      }

      // 清理输入状态
      setInputPrompt(null);
      setInputValue('');
      if (inputResolveRef) {
        inputResolveRef = null;
      }

      createWorker();
    }
  }, [createWorker]);

  const value = {
    isLoading,
    error,
    runPython,
    stopPython,
    reloadPyodide: createWorker,
    inputPrompt,
    inputValue,
    setInputValue,
    handleInputSubmit
  };

  return (
    <PyodideContext.Provider value={value}>
      {children}
    </PyodideContext.Provider>
  );
};
