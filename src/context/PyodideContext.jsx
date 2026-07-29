import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const PyodideContext = createContext(null);

export const usePyodide = () => {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }
  return context;
};

export const PyodideProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const pendingResolveRef = useRef(null);

  // 创建 Worker
  const createWorker = useCallback(() => {
    // 如果已有 Worker，先终止
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setIsLoading(true);
    setError(null);

    const worker = new Worker('/pyodide.worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, success, output: workerOutput, error: workerError, prompt } = e.data;

      if (type === 'ready') {
        setIsLoading(false);
        console.log('Pyodide Worker 加载成功');
      } else if (type === 'result') {
        // 解决待处理的 Promise
        if (pendingResolveRef.current) {
          pendingResolveRef.current({ success, output: workerOutput, error: workerError });
          pendingResolveRef.current = null;
        }
      } else if (type === 'input_request') {
        // Worker 请求用户输入
        const userInput = window.prompt(prompt || '请输入：');
        // 将用户输入发送回 Worker
        worker.postMessage({ 
          type: 'input_response', 
          inputValue: userInput !== null ? userInput : '' 
        });
      }
    };

    worker.onerror = (err) => {
      console.error('Worker 错误:', err);
      setError(err.message || 'Worker 加载失败');
      setIsLoading(false);
    };
  }, []);

  // 初始化 Worker
  useEffect(() => {
    createWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [createWorker]);

  // 运行 Python 代码
  const runPython = useCallback(async (code) => {
    if (!workerRef.current) {
      return {
        success: false,
        output: '',
        error: 'Python 运行环境未加载'
      };
    }

    if (isLoading) {
      return {
        success: false,
        output: '',
        error: 'Python 运行环境正在加载中，请稍候...'
      };
    }

    return new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      workerRef.current.postMessage({ type: 'run', code });
    });
  }, [isLoading]);

  // 停止运行 - 终止 Worker 并重新创建
  const stopPython = useCallback(() => {
    if (workerRef.current) {
      // 终止 Worker（这会立即停止所有执行）
      workerRef.current.terminate();
      workerRef.current = null;

      // 解决待处理的 Promise
      if (pendingResolveRef.current) {
        pendingResolveRef.current({
          success: false,
          output: '',
          error: '用户停止执行'
        });
        pendingResolveRef.current = null;
      }

      // 重新创建 Worker
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
