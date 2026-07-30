import React, { useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { usePyodide } from '../context/PyodideContext';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

// 从 React children 中提取纯文本
const extractTextFromChildren = (children) => {
  if (children === null || children === undefined) {
    return '';
  }
  if (typeof children === 'string') {
    return children;
  }
  if (typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  // React 元素对象
  if (children.$$typeof) {
    return extractTextFromChildren(children.props?.children);
  }
  // 普通对象但有 children 属性
  if (children.props) {
    return extractTextFromChildren(children.props.children);
  }
  return String(children);
};

// ANSI 颜色代码解析器
const parseAnsiColors = (text) => {
  if (!text) return '';
  
  // ANSI 颜色映射
  const ansiColors = {
    '30': '#000000', // 黑色
    '31': '#ff0000', // 红色
    '32': '#00ff00', // 绿色
    '33': '#ffff00', // 黄色
    '34': '#0000ff', // 蓝色
    '35': '#ff00ff', // 紫色
    '36': '#00ffff', // 青色
    '37': '#ffffff', // 白色
    '90': '#808080', // 亮黑色（灰色）
    '91': '#ff5555', // 亮红色
    '92': '#55ff55', // 亮绿色
    '93': '#ffff55', // 亮黄色
    '94': '#5555ff', // 亮蓝色
    '95': '#ff55ff', // 亮紫色
    '96': '#55ffff', // 亮青色
    '97': '#ffffff', // 亮白色
  };
  
  // 转义 HTML 特殊字符
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // 解析 ANSI 转义序列
  // 匹配多种格式：\x1b[...m, \033[...m, ESC[...m, \e[...m
  const ansiRegex = /(?:\x1b|\033|\\033|\\e|ESC)\[([0-9;]*)m/g;
  
  html = html.replace(ansiRegex, (match, codes) => {
    if (!codes || codes === '0' || codes === '') {
      return '</span>'; // 重置
    }
    
    const codeList = codes.split(';');
    let result = '';
    
    for (const code of codeList) {
      const color = ansiColors[code];
      if (color) {
        result += `<span style="color: ${color}">`;
      }
    }
    
    return result || '';
  });
  
  // 确保所有 span 都闭合
  const openCount = (html.match(/<span/g) || []).length;
  const closeCount = (html.match(/<\/span>/g) || []).length;
  for (let i = closeCount; i < openCount; i++) {
    html += '</span>';
  }
  
  return html;
};

// 生成唯一 ID
let blockIdCounter = 0;

// 可交互的代码块组件
const InteractiveCodeBlock = ({ code, language }) => {
  const blockIdRef = useRef(`block-${blockIdCounter++}`);
  const pyodide = usePyodide();
  const { 
    isLoading: pyodideLoading, 
    error: pyodideError, 
    runPython, 
    stopPython,
    inputPrompt,
    inputValue,
    setInputValue,
    handleInputSubmit,
    activeBlockId
  } = pyodide || {};
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const blockId = blockIdRef.current;

  // 运行代码
  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setExecutionTime(0);
    setShowTimeoutWarning(false);
    
    // 启动计时器
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setExecutionTime(elapsed);
      
      if (elapsed > 5000) {
        setShowTimeoutWarning(true);
      }
    }, 100);

    try {
      // 实时输出回调 - 使用 flushSync 强制立即更新 DOM
      const onOutput = (text) => {
        flushSync(() => {
          setOutput(prev => prev + text);
        });
      };

      const result = await runPython(editCode, onOutput, blockId);
      
      // 如果有一次性输出（非实时模式），设置输出
      if (result.output && !output) {
        setOutput(result.output);
      }
      
      if (!result.success && result.error) {
        setOutput(result.error);
      }
    } catch (error) {
      setOutput(`错误: ${error.message}`);
    } finally {
      setIsRunning(false);
      clearInterval(timerRef.current);
      setShowTimeoutWarning(false);
    }
  };

  // 停止运行 - 终止 Worker 并重新创建
  const handleStop = () => {
    if (stopPython) {
      stopPython();
    }
    setIsRunning(false);
    clearInterval(timerRef.current);
    setShowTimeoutWarning(false);
    setOutput('已停止执行');
  };

  // 复制代码
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editCode);
      alert('代码已复制');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 重置代码
  const handleReset = () => {
    setEditCode(code);
    setOutput('');
    setIsModified(false);
  };

  // 处理键盘事件，支持 Tab 键输入
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (e.shiftKey) {
        // Shift+Tab: 减少缩进
        const lineStart = editCode.lastIndexOf('\n', start - 1) + 1;
        const line = editCode.substring(lineStart, end);
        
        if (line.startsWith('\t')) {
          // 移除行首的制表符
          const newValue = editCode.substring(0, lineStart) + line.substring(1) + editCode.substring(end);
          setEditCode(newValue);
          setIsModified(true);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 1;
          }, 0);
        } else if (line.startsWith('    ')) {
          // 移除4个空格
          const newValue = editCode.substring(0, lineStart) + line.substring(4) + editCode.substring(end);
          setEditCode(newValue);
          setIsModified(true);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 4;
          }, 0);
        }
      } else {
        // Tab: 增加缩进
        const newValue = editCode.substring(0, start) + '\t' + editCode.substring(end);
        setEditCode(newValue);
        setIsModified(true);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
    }
  };

  return (
    <div style={{
      margin: '16px 0',
      border: '1px solid #e1e4e8',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: '#f6f8fa',
        borderBottom: '1px solid #e1e4e8'
      }}>
        <span style={{
          fontSize: '12px',
          color: '#586069',
          fontFamily: 'monospace'
        }}>
          {language || 'code'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: '#fff',
              color: '#586069',
              border: '1px solid #e1e4e8',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            复制
          </button>
          {language === 'python' && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  backgroundColor: isEditing ? '#0366d6' : '#fff',
                  color: isEditing ? '#fff' : '#586069',
                  border: '1px solid #e1e4e8',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {isEditing ? '查看' : '编辑'}
              </button>
              {isEditing && (
                <button
                  onClick={handleReset}
                  disabled={!isModified}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    backgroundColor: isModified ? '#fff' : '#f6f8fa',
                    color: isModified ? '#d73a49' : '#959da5',
                    border: `1px solid ${isModified ? '#d73a49' : '#e1e4e8'}`,
                    borderRadius: '4px',
                    cursor: isModified ? 'pointer' : 'not-allowed',
                    opacity: isModified ? 1 : 0.6
                  }}
                  title="恢复为原始代码"
                >
                  恢复
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(true)}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  color: '#586069',
                  border: '1px solid #e1e4e8',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                全屏
              </button>
              <button
                onClick={handleRun}
                disabled={isRunning || pyodideLoading}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isRunning || pyodideLoading ? 'not-allowed' : 'pointer',
                  opacity: isRunning || pyodideLoading ? 0.6 : 1
                }}
              >
                {isRunning ? '运行中...' : pyodideLoading ? '加载中...' : '运行'}
              </button>
              {isRunning && (
                <button
                  onClick={handleStop}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    backgroundColor: '#d73a49',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="停止运行"
                >
                  停止
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 代码区域 */}
      {isEditing ? (
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={editCode}
            onChange={(e) => {
              setEditCode(e.target.value);
              setIsModified(true);
              // 自动调整高度
              e.target.style.height = 'auto';
              e.target.style.height = Math.max(200, e.target.scrollHeight) + 'px';
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '16px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              backgroundColor: '#282c34',
              color: '#abb2bf',
              tabSize: 4,
              boxSizing: 'border-box'
            }}
            spellCheck={false}
          />
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px'
          }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#abb2bf',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isExpanded ? '收起' : '展开'}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#abb2bf',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重置
            </button>
          </div>
        </div>
      ) : (
        <pre style={{
          margin: 0,
          padding: '16px',
          backgroundColor: '#282c34',
          overflowX: 'auto',
          maxHeight: isExpanded ? 'none' : '400px'
        }}>
          <code style={{
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#abb2bf'
          }}>
            {editCode}
          </code>
        </pre>
      )}

      {/* 超时警告 */}
      {showTimeoutWarning && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          fontSize: '12px',
          borderBottom: '1px solid #ffeaa7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ 代码执行时间较长，可能存在无限循环</span>
          <button
            onClick={handleStop}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              backgroundColor: '#d73a49',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            停止
          </button>
        </div>
      )}

      {/* 输出区域 */}
      {language === 'python' && output && (
        <div style={{
          borderTop: '1px solid #e1e4e8',
          padding: '12px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{
              fontSize: '12px',
              color: '#586069',
              fontWeight: '500'
            }}>
              输出:
            </span>
            {executionTime > 0 && (
              <span style={{
                fontSize: '11px',
                color: '#586069'
              }}>
                执行时间: {(executionTime / 1000).toFixed(1)}秒
              </span>
            )}
          </div>
          <pre style={{
            margin: 0,
            padding: '8px',
            backgroundColor: '#f6f8fa',
            borderRadius: '4px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '1.4',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
          dangerouslySetInnerHTML={{ __html: parseAnsiColors(output) }}
          />
        </div>
      )}

      {/* 输入框区域 - 只在当前活跃的代码块显示 */}
      {inputPrompt !== null && activeBlockId === blockId && (
        <div style={{
          borderTop: '1px solid #1976d2',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '13px',
            color: '#1976d2',
            fontWeight: '500'
          }}>
            {inputPrompt}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputSubmit();
              }
            }}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '13px',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              outline: 'none'
            }}
            autoFocus
          />
          <button
            onClick={handleInputSubmit}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            确定
          </button>
        </div>
      )}

      {/* 全屏编辑模式 */}
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#1e1e1e',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 全屏工具栏 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: '#252526',
            borderBottom: '1px solid #3c3c3c'
          }}>
            <span style={{
              color: '#cccccc',
              fontSize: '14px'
            }}>
              Python 代码编辑器 - 全屏模式
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleRun}
                disabled={isRunning || pyodideLoading}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isRunning || pyodideLoading ? 'not-allowed' : 'pointer',
                  opacity: isRunning || pyodideLoading ? 0.6 : 1
                }}
              >
                {isRunning ? '运行中...' : pyodideLoading ? '加载中...' : '运行代码'}
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  backgroundColor: '#586069',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                重置
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  backgroundColor: '#d73a49',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                退出全屏
              </button>
            </div>
          </div>

          {/* 全屏编辑区域 */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <textarea
              value={editCode}
              onChange={(e) => {
                setEditCode(e.target.value);
                setIsModified(true);
              }}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                width: '100%',
                padding: '20px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '16px',
                lineHeight: '1.6',
                border: 'none',
                outline: 'none',
                resize: 'none',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                tabSize: 4,
                boxSizing: 'border-box'
              }}
              spellCheck={false}
              autoFocus
            />

            {/* 输出区域 */}
            {output && (
              <div style={{
                borderTop: '1px solid #3c3c3c',
                padding: '16px 20px',
                backgroundColor: '#1e1e1e',
                maxHeight: '30%',
                overflow: 'auto'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#888',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  输出:
                </div>
                <pre style={{
                  margin: 0,
                  padding: '12px',
                  backgroundColor: '#2d2d2d',
                  borderRadius: '4px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#d4d4d4',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {output}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MarkdownRenderer = ({ content }) => {
  // 图片放大状态
  const [enlargedImage, setEnlargedImage] = useState(null);

  const handleImageClick = useCallback((src) => {
    setEnlargedImage(src);
  }, []);

  const handleCloseImage = useCallback(() => {
    setEnlargedImage(null);
  }, []);

  return (
    <div className="markdown-content" style={{
      lineHeight: '1.8',
      fontSize: '16px'
    }}>
      {/* 图片放大遮罩 */}
      {enlargedImage && (
        <div
          onClick={handleCloseImage}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <img
            src={enlargedImage}
            alt="放大图片"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />
          <button
            onClick={handleCloseImage}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 style={{
              fontSize: '2em',
              borderBottom: '2px solid #eee',
              paddingBottom: '10px',
              marginBottom: '20px',
              marginTop: '40px'
            }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{
              fontSize: '1.5em',
              borderBottom: '1px solid #eee',
              paddingBottom: '8px',
              marginTop: '30px',
              marginBottom: '15px'
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{
              fontSize: '1.3em',
              marginTop: '25px',
              marginBottom: '10px'
            }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{
              marginBottom: '16px'
            }}>
              {children}
            </p>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = extractTextFromChildren(children).replace(/\n$/, '');
            
            // 判断是否为行内代码：
            // 1. 明确标记为 inline
            // 2. 没有 language- 类名且内容不含换行符
            // 3. 内容较短（通常行内代码不会很长）
            const isInline = inline || 
                            (!match && !codeText.includes('\n')) ||
                            (!match && codeText.length < 50 && !codeText.includes('\n'));

            // 内联代码
            if (isInline) {
              return (
                <code style={{
                  backgroundColor: '#f6f8fa',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.9em',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                }} {...props}>
                  {children}
                </code>
              );
            }

            // Python 代码块 - 使用可交互组件
            if (match && match[1] === 'python') {
              return <InteractiveCodeBlock code={codeText} language="python" />;
            }

            // 其他语言代码块
            return (
              <div style={{
                position: 'relative',
                backgroundColor: '#f6f8fa',
                borderRadius: '6px',
                marginBottom: '16px',
                overflowX: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderBottom: '1px solid #e1e4e8',
                  backgroundColor: '#fafbfc'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#586069',
                    fontFamily: 'monospace'
                  }}>
                    {match ? match[1] : 'code'}
                  </span>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  overflowX: 'auto'
                }}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid #1976d2',
              paddingLeft: '16px',
              marginLeft: '0',
              marginBottom: '16px',
              color: '#555',
              backgroundColor: '#f9f9f9',
              padding: '12px 16px',
              borderRadius: '0 4px 4px 0'
            }}>
              {children}
            </blockquote>
          ),
          img: ({ src, alt, ...props }) => (
            <div style={{ margin: '16px 0', textAlign: 'center' }}>
              <img
                src={src}
                alt={alt}
                onClick={() => handleImageClick(src)}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                loading="lazy"
                onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                {...props}
              />
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '4px'
              }}>
                点击图片可放大查看
              </div>
            </div>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={{
                borderCollapse: 'collapse',
                width: '100%'
              }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{
              border: '1px solid #ddd',
              padding: '8px 12px',
              backgroundColor: '#f6f8fa',
              fontWeight: '600',
              textAlign: 'left'
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              border: '1px solid #ddd',
              padding: '8px 12px'
            }}>
              {children}
            </td>
          ),
          ul: ({ children }) => (
            <ul style={{
              marginBottom: '16px',
              paddingLeft: '24px'
            }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{
              marginBottom: '16px',
              paddingLeft: '24px'
            }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{
              marginBottom: '4px'
            }}>
              {children}
            </li>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
