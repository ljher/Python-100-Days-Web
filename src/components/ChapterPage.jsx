import { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarkdownRenderer from './MarkdownRenderer';
import { getChapterById, getAllChapters } from '../data/courseData';
import { updateCurrentChapter, isChapterCompleted } from '../utils/progressStorage';

const ChapterPage = () => {
  const { chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  const [prevChapter, setPrevChapter] = useState(null);
  const [nextChapter, setNextChapter] = useState(null);

  // 使用 useLayoutEffect 确保在 DOM 更新后立即滚动到顶部
  useLayoutEffect(() => {
    // 滚动到页面顶部
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // 滚动父容器到顶部（针对 Layout 组件中的滚动容器）
    const scrollContainer = document.querySelector('[style*="overflow: auto"]') || 
                           document.querySelector('[style*="overflow:auto"]');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    
    // 使用 requestAnimationFrame 确保在下一帧也滚动到顶部
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    });
    
    // 延迟执行，确保在所有内容加载完成后滚动
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [chapterId]);

  useEffect(() => {
    const chapterData = getChapterById(chapterId);
    setChapter(chapterData);
    
    const chapters = getAllChapters();
    setAllChapters(chapters);
    
    // 查找上一章和下一章
    const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
    if (currentIndex > 0) {
      setPrevChapter(chapters[currentIndex - 1]);
    } else {
      setPrevChapter(null);
    }
    
    if (currentIndex < chapters.length - 1) {
      setNextChapter(chapters[currentIndex + 1]);
    } else {
      setNextChapter(null);
    }
    
    // 更新当前学习章节
    if (chapterId) {
      updateCurrentChapter(chapterId);
    }
  }, [chapterId]);

  const isCompleted = isChapterCompleted(chapterId);

  if (!chapter) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>章节未找到</h2>
          <p>请检查URL或返回首页</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fff'
    }}>
      {/* 头部 */}
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              opacity: 0.9
            }}>
              ← 返回目录
            </Link>
            <h1 style={{ margin: 0, fontSize: '20px' }}>
              {chapter.title}
            </h1>
          </div>
          {isCompleted && (
            <span style={{
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ✓ 已完成
            </span>
          )}
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <MarkdownRenderer content={chapter.content} />
        
        {/* 章节导航 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          {prevChapter ? (
            <Link
              to={`/chapter/${prevChapter.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              ← {prevChapter.title}
            </Link>
          ) : <div></div>}
          
          {nextChapter ? (
            <Link
              to={`/chapter/${nextChapter.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {nextChapter.title} →
            </Link>
          ) : <div></div>}
        </div>
      </main>
    </div>
  );
};

export default ChapterPage;
