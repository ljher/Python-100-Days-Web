import React from 'react';
import { Link } from 'react-router-dom';
import { courseData, getAllChapters } from '../data/courseData';
import { getProgressStats, getNextRecommendedChapter } from '../utils/progressStorage';

const HomePage = () => {
  const stats = getProgressStats();
  const allChapters = getAllChapters();
  const nextChapter = getNextRecommendedChapter(allChapters);
  const totalChapters = allChapters.length;
  const progressPercent = totalChapters > 0 ? Math.round((stats.completedCount / totalChapters) * 100) : 0;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px'
    }}>
      {/* 欢迎区域 */}
      <section style={{
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <h1 style={{
          fontSize: '48px',
          color: '#1976d2',
          marginBottom: '20px'
        }}>
          Python-100-Days 互动学习平台
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#666',
          maxWidth: '800px',
          margin: '0 auto 30px'
        }}>
          从零开始，100天掌握Python编程。通过互动式学习，在线编码和实时反馈，轻松入门Python世界。
        </p>
        
        {/* 学习进度卡片 */}
        {stats.completedCount > 0 && (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            margin: '0 auto 30px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>
                学习进度
              </span>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {stats.completedCount}/{totalChapters} 章节已完成
              </span>
            </div>
            <div style={{
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              height: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: '#4caf50',
                borderRadius: '8px',
                height: '100%',
                width: `${progressPercent}%`,
                transition: 'width 0.3s'
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {progressPercent}% 完成
              </span>
              {nextChapter && (
                <Link
                  to={`/chapter/${nextChapter.id}`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'background-color 0.3s'
                  }}
                >
                  继续学习
                </Link>
              )}
            </div>
          </div>
        )}
        
        <Link
          to={nextChapter ? `/chapter/${nextChapter.id}` : '/chapter/day01'}
          style={{
            display: 'inline-block',
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: '500',
            boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)',
            transition: 'background-color 0.3s'
          }}
        >
          {stats.completedCount > 0 ? '继续学习' : '开始学习'}
        </Link>
      </section>
      
      {/* 课程概览 */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{
          fontSize: '36px',
          textAlign: 'center',
          marginBottom: '40px',
          color: '#333'
        }}>
          课程概览
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px'
        }}>
          {courseData.map((section, index) => (
            <div key={section.id} style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #eee'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#1976d2',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                第{index + 1}部分
              </div>
              <h3 style={{
                fontSize: '24px',
                marginBottom: '16px',
                color: '#333'
              }}>
                {section.title}
              </h3>
              <p style={{
                color: '#666',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                {section.children ? `包含${section.children.length}个章节` : '即将开放'}
              </p>
              <Link
                to={`/chapter/${section.children ? section.children[0].id : section.id}`}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f5f5f5',
                  color: '#1976d2',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
              >
                开始学习
              </Link>
            </div>
          ))}
        </div>
      </section>
      
      {/* 特性介绍 */}
      <section style={{
        backgroundColor: '#f5f5f5',
        padding: '60px 24px',
        borderRadius: '12px',
        marginBottom: '60px'
      }}>
        <h2 style={{
          fontSize: '36px',
          textAlign: 'center',
          marginBottom: '40px',
          color: '#333'
        }}>
          平台特性
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              📚
            </div>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>
              系统化课程
            </h3>
            <p style={{ color: '#666' }}>
              从基础到进阶，100天系统学习Python编程
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              💻
            </div>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>
              在线编码
            </h3>
            <p style={{ color: '#666' }}>
              无需安装环境，浏览器内直接编写和运行Python代码
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              🎯
            </div>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>
              实时反馈
            </h3>
            <p style={{ color: '#666' }}>
              自动判题系统，即时检查代码输出是否正确
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              🚀
            </div>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>
              轻量部署
            </h3>
            <p style={{ color: '#666' }}>
              纯前端方案，可轻松部署到GitHub Pages或Vercel
            </p>
          </div>
        </div>
      </section>
      
      {/* 开始学习 */}
      <section style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#1976d2',
        borderRadius: '12px',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: '36px',
          marginBottom: '20px'
        }}>
          准备好开始学习了吗？
        </h2>
        <p style={{
          fontSize: '18px',
          marginBottom: '30px',
          opacity: 0.9
        }}>
          立即开始你的Python学习之旅！
        </p>
        <Link
          to="/chapter/day01"
          style={{
            display: 'inline-block',
            backgroundColor: 'white',
            color: '#1976d2',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: '600',
            transition: 'transform 0.2s'
          }}
        >
          立即开始
        </Link>
      </section>
    </div>
  );
};

export default HomePage;