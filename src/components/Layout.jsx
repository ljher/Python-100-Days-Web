import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationTree from './NavigationTree';
import { courseData } from '../data/courseData';

const Layout = () => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 左侧导航 */}
      <NavigationTree data={courseData} />
      
      {/* 主内容区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#fff'
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;