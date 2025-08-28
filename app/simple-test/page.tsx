'use client';

import { useState, useEffect } from 'react';

export default function SimpleTestPage() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('🟢 useEffect running! Component has hydrated.');
    setMounted(true);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p className="mb-4">
        Mounted: <span className={mounted ? 'text-green-600' : 'text-red-600'}>
          {mounted ? 'YES' : 'NO'}
        </span>
      </p>
      <p className="mb-4">Count: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
}
