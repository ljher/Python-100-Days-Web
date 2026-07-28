import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavigationTree = ({ data }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const location = useLocation();

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderTreeItem = (item, level = 0) => {
    const isExpanded = expandedItems[item.id];
    const hasChildren = item.children && item.children.length > 0;
    const isActive = location.pathname === `/chapter/${item.id}`;

    return (
      <div key={item.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className={`tree-item ${isActive ? 'active' : ''}`}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: isActive ? '#e3f2fd' : 'transparent',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => {
            if (hasChildren) {
              toggleItem(item.id);
            }
          }}
        >
          {hasChildren && (
            <span style={{ fontSize: '12px' }}>
              {isExpanded ? '▼' : '►'}
            </span>
          )}
          {!hasChildren && <span style={{ width: '12px' }}></span>}
          <Link
            to={`/chapter/${item.id}`}
            style={{
              textDecoration: 'none',
              color: isActive ? '#1976d2' : '#333',
              fontWeight: isActive ? '600' : '400'
            }}
          >
            {item.title}
          </Link>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="navigation-tree" style={{
      width: '280px',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      borderRight: '1px solid #ddd',
      overflowY: 'auto',
      padding: '16px 0'
    }}>
      <div style={{
        padding: '0 16px 16px',
        borderBottom: '1px solid #ddd',
        marginBottom: '16px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          color: '#333'
        }}>
          Python-100-Days
        </h2>
        <p style={{
          margin: '8px 0 0',
          fontSize: '14px',
          color: '#666'
        }}>
          互动学习平台
        </p>
      </div>
      <div style={{ padding: '0 8px' }}>
        {data.map(item => renderTreeItem(item))}
      </div>
    </div>
  );
};

export default NavigationTree;