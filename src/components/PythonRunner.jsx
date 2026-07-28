import React, { useState, useEffect, useRef } from 'react';

const PythonRunner = ({ code, onRun }) => {
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pyodide, setPyodide] = useState(null);
  const [error, setError] = useState(null);
  const outputRef = useRef(null);

  // 加载Pyodide
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 动态加载Pyodide
        const pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
        });
        
        setPyodide(pyodide);
        setOutput('Pyodide加载成功！\n');
      } catch (err) {
        setError(`加载Pyodide失败: ${err.message}`);
        console.error('Pyodide加载错误:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // 检查是否已经加载
    if (window.loadPyodide) {
      loadPyodide();
    } else {
      // 动态加载Pyodide脚本
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
      script.onload = loadPyodide;
      script.onerror = () => setError('加载Pyodide脚本失败');
      document.head.appendChild(script);
    }
  }, []);

  const runCode = async () => {
    if (!pyodide) {
      setError('Pyodide尚未加载完成');
      return;
    }

    if (!code || code.trim() === '') {
      setError('请输入Python代码');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutput('');

    try {
      // 设置标准输出捕获
      pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
`);

      // 执行用户代码
      pyodide.runPython(code);

      // 获取输出
      const output = pyodide.runPython('sys.stdout.getvalue()');
      
      // 恢复标准输出
      pyodide.runPython('sys.stdout = sys.__stdout__');

      setOutput(output);
      
      if (onRun) {
        onRun(output);
      }
    } catch (err) {
      setError(`代码执行错误: ${err.message}`);
      console.error('代码执行错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
    setError(null);
  };

  return (
    <div className="python-runner" style={{
      border: '1px solid #ddd',
      borderRadius: '6px',
      overflow: 'hidden',
      marginBottom: '16px'
    }}>
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '8px 12px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: '500' }}>Python 执行环境</span>
        <div>
          <button
            onClick={runCode}
            disabled={isLoading || !pyodide}
            style={{
              backgroundColor: isLoading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginRight: '8px',
              fontSize: '14px'
            }}
          >
            {isLoading ? '执行中...' : '运行代码'}
          </button>
          <button
            onClick={clearOutput}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            清除输出
          </button>
        </div>
      </div>
      
      <div
        ref={outputRef}
        style={{
          backgroundColor: '#1e1e1e',
          color: '#fff',
          padding: '12px',
          minHeight: '100px',
          maxHeight: '300px',
          overflowY: 'auto',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      >
        {error ? (
          <div style={{ color: '#ff6b6b' }}>{error}</div>
        ) : (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
        )}
      </div>
      
      {!pyodide && !error && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '8px 12px',
          fontSize: '14px',
          color: '#856404'
        }}>
          正在加载Python执行环境...
        </div>
      )}
    </div>
  );
};

export default PythonRunner;