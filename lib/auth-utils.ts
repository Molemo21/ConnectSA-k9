// Client-side authentication utilities
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    avatar?: string;
  } | null;
  error?: string;
}

export async function checkAuth(): Promise<AuthResponse> {
  try {
    console.log("Making auth check request...");
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Auth response status:", response.status);

    if (response.status === 401) {
      console.log("Token expired, attempting refresh...");
      // Try to refresh the token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Refresh response status:", refreshResponse.status);

      if (refreshResponse.ok) {
        console.log("Token refreshed successfully, retrying auth check...");
        // Token refreshed, try auth check again
        const retryResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log("Retry response status:", retryResponse.status);

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          console.log("Auth successful after refresh:", data);
          return { user: data.user };
        } else {
          console.log("Auth failed after refresh, status:", retryResponse.status);
          const errorData = await retryResponse.json().catch(() => ({}));
          console.log("Error data:", errorData);
          return { user: null, error: 'Authentication failed after refresh' };
        }
      } else {
        console.log("Token refresh failed, status:", refreshResponse.status);
        const errorData = await refreshResponse.json().catch(() => ({}));
        console.log("Refresh error data:", errorData);
        return { user: null, error: 'Authentication required' };
      }
    }

    if (response.ok) {
      const data = await response.json();
      console.log("Auth successful:", data);
      return { user: data.user };
    }

    console.log("Auth failed with status:", response.status);
    const errorData = await response.json().catch(() => ({}));
    console.log("Error data:", errorData);
    return { user: null, error: 'Authentication failed' };
  } catch (error) {
    console.error('Auth check error:', error);
    return { user: null, error: 'Network error' };
  }
}

// New function to check if user is authenticated without token refresh
export async function checkAuthSimple(): Promise<AuthResponse> {
  try {
    console.log("Making simple auth check request...");
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Simple auth response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("Simple auth successful:", data);
      return { user: data.user };
    }

    console.log("Simple auth failed with status:", response.status);
    return { user: null, error: 'Authentication failed' };
  } catch (error) {
    console.error('Simple auth check error:', error);
    return { user: null, error: 'Network error' };
  }
}

// Utility function to debug authentication issues
export async function debugAuth(): Promise<any> {
  try {
    console.log("Debugging authentication...");
    
    // Try health endpoint first
    try {
      const healthResponse = await fetch('/api/health', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log("Health check successful:", healthData);
        return {
          method: 'health',
          success: true,
          data: healthData
        };
      } else {
        console.log("Health check failed:", healthResponse.status);
      }
    } catch (healthError) {
      console.log("Health check error:", healthError);
    }
    
    // Try debug endpoint as fallback
    try {
      const debugResponse = await fetch('/api/auth/debug', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log("Debug check successful:", debugData);
        return {
          method: 'debug',
          success: true,
          data: debugData
        };
      } else {
        console.log("Debug check failed:", debugResponse.status);
      }
    } catch (debugError) {
      console.log("Debug check error:", debugError);
    }
    
    // Try simple auth check
    const simpleAuth = await checkAuthSimple();
    console.log("Simple auth check:", simpleAuth);
    
    return {
      method: 'simple',
      success: !!simpleAuth.user,
      data: simpleAuth
    };
    
  } catch (error) {
    console.error('Debug auth error:', error);
    return {
      method: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to proactively refresh tokens
export async function refreshTokensIfNeeded(): Promise<boolean> {
  try {
    console.log("Checking if token refresh is needed...");
    
    // Try to refresh the token
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (refreshResponse.ok) {
      console.log("Tokens refreshed successfully");
      return true;
    } else {
      console.log("Token refresh not needed or failed");
      return false;
    }
  } catch (error) {
    console.log("Token refresh error:", error);
    return false;
  }
}

// Function to check if user is authenticated with automatic token refresh
export async function checkAuthWithRefresh(): Promise<AuthResponse> {
  try {
    // First try simple auth check
    const authResult = await checkAuthSimple();
    
    if (authResult.user) {
      return authResult;
    }
    
    // If simple check fails, try to refresh tokens
    console.log("Simple auth failed, attempting token refresh...");
    const refreshSuccess = await refreshTokensIfNeeded();
    
    if (refreshSuccess) {
      // Try auth check again after refresh
      const retryResult = await checkAuthSimple();
      return retryResult;
    }
    
    // If refresh failed, try full auth check
    return await checkAuth();
  } catch (error) {
    console.error('Auth check with refresh error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export function isAuthenticated(): boolean {
  // Since auth tokens are httpOnly cookies, we can't check them client-side
  // This function is deprecated - use checkAuth() instead for proper authentication checks
  return false;
} 