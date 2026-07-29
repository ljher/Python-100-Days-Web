import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PyodideContext = createContext(null);

export const usePyodide = () => {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }
  return context;
};

export const PyodideProvider = ({ children }) => {
  const [pyodide, setPyodide] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const loadPyodideInstance = useCallback(async () => {
    if (pyodide || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      // 检查 window.loadPyodide 是否存在
      if (!window.loadPyodide) {
        throw new Error('Pyodide 脚本未加载，请检查网络连接');
      }

      setLoadingProgress(10);
      
      const pyodideInstance = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
        stdout: (text) => {
          // 可以在这里处理 stdout
        },
        stderr: (text) => {
          console.warn('Pyodide stderr:', text);
        }
      });

      setLoadingProgress(90);
      setPyodide(pyodideInstance);
      setLoadingProgress(100);
      console.log('Pyodide 加载成功');
    } catch (err) {
      console.error('加载 Pyodide 失败:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pyodide, isLoading]);

  // 自动加载 Pyodide
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPyodideInstance();
    }, 500); // 延迟 500ms 加载，避免阻塞页面渲染

    return () => clearTimeout(timer);
  }, [loadPyodideInstance]);

  // 运行 Python 代码
  const runPython = useCallback(async (code) => {
    if (!pyodide) {
      return {
        success: false,
        output: '',
        error: 'Python 运行环境正在加载中，请稍候...'
      };
    }

    try {
      // 重定向 stdout 并设置 input 函数
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()

# 重定义 input 函数，使用 JavaScript 的 prompt
import js
def custom_input(prompt=''):
    # 显示提示信息
    if prompt:
        js.console.log(str(prompt))
    # 使用 JavaScript 的 prompt 获取输入
    result = js.prompt(str(prompt) if prompt else '')
    if result is None:
        # 用户点击取消
        raise EOFError('用户取消输入')
    return result

# 替换内置的 input 函数
import builtins
builtins.input = custom_input
`);

      // 运行用户代码（使用异步执行以支持 input）
      const result = await pyodide.runPythonAsync(code);

      // 获取输出
      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      
      // 恢复 stdout
      pyodide.runPython('sys.stdout = sys.__stdout__');

      return {
        success: true,
        output: stdout || (result !== undefined ? String(result) : ''),
        error: null
      };
    } catch (error) {
      // 确保恢复 stdout
      try {
        pyodide.runPython('sys.stdout = sys.__stdout__');
      } catch (e) {
        // 忽略恢复的错误
      }
      
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }, [pyodide]);

  const value = {
    pyodide,
    isLoading,
    error,
    loadingProgress,
    loadPyodide: loadPyodideInstance,
    runPython
  };

  return (
    <PyodideContext.Provider value={value}>
      {children}
    </PyodideContext.Provider>
  );
};
