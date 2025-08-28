'use client';

import { useState, useEffect } from 'react';

export default function HydrationTestPage() {
  const [hydrated, setHydrated] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    console.log('🟢 HYDRATION SUCCESS: useEffect is running!');
    console.log('🟢 Client-side JavaScript is working!');
    
    setHydrated(true);

    // Send success log to server
    fetch('/api/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'info',
        message: 'HYDRATION SUCCESS',
        data: { page: 'hydration-test', timestamp: new Date().toISOString() }
      })
    }).catch(console.error);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hydration Test</h1>
      
      <div style={{ 
        padding: '10px', 
        marginBottom: '20px',
        backgroundColor: hydrated ? '#d4edda' : '#f8d7da',
        color: hydrated ? '#155724' : '#721c24',
        border: `1px solid ${hydrated ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px'
      }}>
        <strong>Hydration Status:</strong> {hydrated ? '✅ SUCCESS' : '❌ NOT HYDRATED'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p><strong>Click Count:</strong> {clickCount}</p>
        <button 
          onClick={() => {
            console.log('🟢 Button clicked, incrementing count');
            setClickCount(prev => prev + 1);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Click me ({clickCount})
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>If you see "SUCCESS" above, React hydration is working!</p>
        <p>If you see "NOT HYDRATED", there's still a client-side issue.</p>
        <p>Check the browser console for additional logs.</p>
      </div>
    </div>
  );
}
