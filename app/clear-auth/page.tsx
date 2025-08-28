'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, RefreshCw } from 'lucide-react';

export default function ClearAuthPage() {
  const [cleared, setCleared] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearAllAuthData = async () => {
    setLoading(true);
    
    try {
      // Clear server-side cookies
      await fetch('/api/auth/clear-cookies', { method: 'POST' });
      
      // Clear client-side cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      setCleared(true);
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Auto-clear on page load
    clearAllAuthData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {cleared ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Authentication Cleared
              </>
            ) : (
              <>
                <RefreshCw className={`h-6 w-6 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                Clearing Authentication
              </>
            )}
          </CardTitle>
          <CardDescription>
            {cleared 
              ? "All authentication data has been cleared. Redirecting to home page..."
              : "Clearing old authentication tokens and cookies..."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cleared ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-green-600">✅ Server cookies cleared</p>
              <p className="text-sm text-green-600">✅ Browser cookies cleared</p>
              <p className="text-sm text-green-600">✅ Local storage cleared</p>
              <p className="text-sm text-green-600">✅ Session storage cleared</p>
              
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Home Page
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600">Please wait while we clear your authentication data...</p>
              
              <Button 
                onClick={clearAllAuthData} 
                disabled={loading}
                variant="outline"
                className="mt-4"
              >
                {loading ? 'Clearing...' : 'Clear Manually'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}