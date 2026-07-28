import React, { useState } from 'react';

const AutoGrader = ({ expectedOutput, userOutput, onGrade }) => {
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const gradeCode = () => {
    if (!expectedOutput || !userOutput) {
      setResult({
        passed: false,
        message: '缺少预期输出或用户输出',
        details: null
      });
      return;
    }

    // 标准化输出（去除首尾空白，标准化换行符）
    const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, '\n');
    const normalizedUser = userOutput.trim().replace(/\r\n/g, '\n');

    // 比较输出
    const passed = normalizedExpected === normalizedUser;
    
    // 计算差异
    let details = null;
    if (!passed) {
      const expectedLines = normalizedExpected.split('\n');
      const userLines = normalizedUser.split('\n');
      
      details = {
        expectedLineCount: expectedLines.length,
        userLineCount: userLines.length,
        differences: []
      };
      
      // 找出差异行
      const maxLines = Math.max(expectedLines.length, userLines.length);
      for (let i = 0; i < maxLines; i++) {
        const expectedLine = expectedLines[i] || '';
        const userLine = userLines[i] || '';
        
        if (expectedLine !== userLine) {
          details.differences.push({
            line: i + 1,
            expected: expectedLine,
            user: userLine
          });
        }
      }
    }

    const gradeResult = {
      passed,
      message: passed ? '恭喜！代码输出正确！' : '代码输出不正确，请检查。',
      details,
      timestamp: new Date().toLocaleTimeString()
    };

    setResult(gradeResult);
    
    if (onGrade) {
      onGrade(gradeResult);
    }
  };

  const resetGrade = () => {
    setResult(null);
    setShowDetails(false);
  };

  return (
    <div className="auto-grader" style={{
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
        <span style={{ fontWeight: '500' }}>自动判题</span>
        <div>
          <button
            onClick={gradeCode}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '14px'
            }}
          >
            判题
          </button>
          <button
            onClick={resetGrade}
            style={{
              backgroundColor: '#9e9e9e',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            重置
          </button>
        </div>
      </div>
      
      <div style={{
        padding: '12px',
        backgroundColor: result ? (result.passed ? '#e8f5e9' : '#ffebee') : '#fff'
      }}>
        {result ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '20px',
                marginRight: '8px'
              }}>
                {result.passed ? '✅' : '❌'}
              </span>
              <span style={{
                fontWeight: '500',
                color: result.passed ? '#2e7d32' : '#c62828'
              }}>
                {result.message}
              </span>
            </div>
            
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '8px'
            }}>
              判题时间: {result.timestamp}
            </div>
            
            {!result.passed && result.details && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}
                >
                  {showDetails ? '隐藏详情' : '显示详情'}
                </button>
                
                {showDetails && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>预期行数:</strong> {result.details.expectedLineCount}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>实际行数:</strong> {result.details.userLineCount}
                    </div>
                    <div>
                      <strong>差异行:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {result.details.differences.map((diff, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>
                            第{diff.line}行: 
                            <span style={{ color: '#c62828' }}> "{diff.expected}"</span>
                            {' → '}
                            <span style={{ color: '#2e7d32' }}> "{diff.user}"</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            color: '#666',
            fontStyle: 'italic'
          }}>
            点击"判题"按钮检查你的代码输出是否正确
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoGrader;