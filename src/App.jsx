import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PyodideProvider } from './context/PyodideContext';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ChapterPage from './components/ChapterPage';
import './App.css';

function App() {
  return (
    <PyodideProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="chapter/:chapterId" element={<ChapterPage />} />
          <Route path="*" element={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h2>页面未找到</h2>
                <p>请检查URL或返回首页</p>
              </div>
            </div>
          } />
        </Route>
      </Routes>
    </PyodideProvider>
  );
}

export default App;
