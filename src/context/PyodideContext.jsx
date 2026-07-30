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
let mainPyodideReady = null;
let inputResolveRef = null;
let currentBlockIdRef = null; // 当前请求输入的代码块 ID

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

// 预处理代码
function preprocessCode(code) {
  const lines = code.split('\n');
  const processedLines = lines.map(line => {
    return line
      .replace(/\binput\s*\(/g, 'await __async_input__(')
      .replace(/\bpip_install\s*\(/g, 'await pip_install(');
  });
  const indentedCode = processedLines.map(line => '    ' + line).join('\n');
  return `\n${indentedCode}\n`;
}

// 等待用户输入
function waitForInput(promptText) {
  return new Promise((resolve) => {
    inputResolveRef = resolve;
    if (window.__showInput__) {
      window.__showInput__(promptText, currentBlockIdRef);
    }
  });
}

// 在主线程运行代码
async function runOnMainThread(code, onOutput, onInputRequest, blockId) {
  if (!mainPyodideReady) {
    await loadMainPyodide();
  }
  
  if (!mainPyodide) {
    return { success: false, output: '', error: 'Python 运行环境加载失败' };
  }

  currentBlockIdRef = blockId;

  try {
    window.__onPythonOutput__ = onOutput || (() => {});
    window.__showInput__ = onInputRequest || (() => {});

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

    // 导入 micropip 用于安装包
    await mainPyodide.loadPackage('micropip');

    mainPyodide.registerJsModule('__input__', {
      request_input: waitForInput
    });

    // 预安装常用包
    await mainPyodide.runPythonAsync(`
import micropip
import __input__

async def __async_input__(prompt=''):
    prompt_str = str(prompt) if prompt else ''
    return await __input__.request_input(prompt_str)

# 提供 pip_install 函数供用户使用
async def pip_install(package_name):
    """安装 Python 包"""
    await micropip.install(package_name)
    print(f'已安装: {package_name}')

# 预安装 rich 包
await micropip.install('rich')
print('环境初始化完成，已预安装: rich')
`);

    const processedCode = preprocessCode(code);
    await mainPyodide.runPythonAsync(processedCode);

    mainPyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');
    
    delete window.__onPythonOutput__;
    delete window.__showInput__;
    currentBlockIdRef = null;

    return { success: true, output: '', error: null };
  } catch (error) {
    try {
      mainPyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');
    } catch (e) {}
    
    delete window.__onPythonOutput__;
    delete window.__showInput__;
    currentBlockIdRef = null;
    
    return { success: false, output: '', error: error.message };
  }
}

export const PyodideProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputPrompt, setInputPrompt] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [activeBlockId, setActiveBlockId] = useState(null);
  const workerRef = useRef(null);
  const pendingResolveRef = useRef(null);

  // 错误边界
  if (error) {
    console.error('PyodideProvider 错误:', error);
  }

  const createWorker = useCallback(() => {
    try {
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      // Worker 路径 - 使用相对路径
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
    } catch (err) {
      console.error('创建 Worker 失败:', err);
      setError('创建 Worker 失败: ' + err.message);
      setIsLoading(false);
    }
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

  // 显示输入框（带代码块 ID）
  const handleInputRequest = useCallback((prompt, blockId) => {
    setInputPrompt(prompt);
    setInputValue('');
    setActiveBlockId(blockId);
  }, []);

  // 提交输入
  const handleInputSubmit = useCallback(() => {
    if (inputResolveRef) {
      inputResolveRef(inputValue);
      inputResolveRef = null;
    }
    setInputPrompt(null);
    setInputValue('');
    setActiveBlockId(null);
  }, [inputValue]);

  // 运行 Python 代码
  const runPython = useCallback(async (code, onOutput, blockId) => {
    const hasInput = /\binput\s*\(/.test(code);
    
    if (hasInput) {
      return await runOnMainThread(code, onOutput, handleInputRequest, blockId);
    } else {
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

      setInputPrompt(null);
      setInputValue('');
      setActiveBlockId(null);
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
    handleInputSubmit,
    activeBlockId
  };

  return (
    <PyodideContext.Provider value={value}>
      {children}
    </PyodideContext.Provider>
  );
};
