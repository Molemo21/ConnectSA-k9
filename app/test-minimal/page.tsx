'use client';

import React, { useState, useEffect } from 'react';

export default function TestMinimalPage() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('🔍 TestMinimal: Component mounted');
    setMounted(true);
    
    // Test if we can make a simple API call
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        console.log('🔍 TestMinimal: Health API response:', data);
      })
      .catch(err => {
        console.error('🔍 TestMinimal: Health API error:', err);
      });
  }, []);

  const handleClick = () => {
    console.log('🔍 TestMinimal: Button clicked, count:', count);
    setCount(prev => prev + 1);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">Loading minimal test...</p>
          <p className="text-sm text-gray-500 mt-2">
            If this takes too long, there's a fundamental hydration issue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Minimal Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic React Functionality Test</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-lg">Count: <span className="font-bold text-blue-600">{count}</span></p>
            </div>
            
            <button 
              onClick={handleClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Increment Count
            </button>
            
            <div className="text-sm text-gray-600">
              <p>✓ Component mounted successfully</p>
              <p>✓ useState is working</p>
              <p>✓ useEffect executed</p>
              <p>✓ Event handlers are working</p>
            </div>
          </div>
        </div>

        <div className="bg-green-100 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
          <p className="text-green-700">
            If you can see this page and interact with the button, React hydration is working correctly.
          </p>
        </div>

        <div className="mt-6">
          <a 
            href="/book-service" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Test Book Service Page
          </a>
        </div>
      </div>
    </div>
  );
}
