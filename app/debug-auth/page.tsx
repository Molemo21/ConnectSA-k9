'use client';

import { useState } from 'react';

export default function DebugAuthPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testJWT = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-jwt');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: 'Failed to test JWT', details: error });
    }
    setLoading(false);
  };

  const clearCookies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/clear-cookies', { method: 'POST' });
      const data = await response.json();
      setResults(data);
      // Also clear client-side cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    } catch (error) {
      setResults({ error: 'Failed to clear cookies', details: error });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={testJWT}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test JWT Functionality'}
        </button>
        
        <button
          onClick={clearCookies}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Clearing...' : 'Clear All Auth Cookies'}
        </button>
      </div>

      {results && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Results:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting Steps:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Clear All Auth Cookies" to remove any invalid tokens</li>
          <li>Click "Test JWT Functionality" to verify JWT is working</li>
          <li>If JWT test fails, check the console for detailed error messages</li>
          <li>Clear your browser cache and cookies for localhost:3000</li>
          <li>Restart the development server</li>
        </ol>
      </div>
    </div>
  );
}