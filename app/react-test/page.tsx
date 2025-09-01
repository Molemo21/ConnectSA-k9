'use client';

import React, { useState, useEffect } from 'react';

export default function ReactTestPage() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('🟢 ReactTest: useEffect running!');
    console.log('🟢 ReactTest: Component mounted successfully');
    setMounted(true);
  }, []);

  const handleClick = () => {
    console.log('🟢 ReactTest: Button clicked!');
    setCount(prev => prev + 1);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>React 18 Hydration Test</h1>
      
      <div style={{ 
        padding: '15px', 
        margin: '20px 0',
        backgroundColor: mounted ? '#d4edda' : '#f8d7da',
        color: mounted ? '#155724' : '#721c24',
        border: `2px solid ${mounted ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '8px',
        fontWeight: 'bold'
      }}>
        Status: {mounted ? '✅ HYDRATED' : '❌ NOT HYDRATED'}
      </div>

      <div style={{ margin: '20px 0' }}>
        <p>Count: {count}</p>
        <button 
          onClick={handleClick}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Click Me ({count})
        </button>
      </div>

      <div style={{ fontSize: '14px', color: '#666', marginTop: '30px' }}>
        <h3>Debug Info:</h3>
        <ul>
          <li>React Version: {React.version}</li>
          <li>Mounted State: {mounted.toString()}</li>
          <li>Count State: {count}</li>
          <li>Timestamp: {new Date().toISOString()}</li>
        </ul>
      </div>
    </div>
  );
}
