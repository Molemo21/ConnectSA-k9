import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN'
  emailVerified: boolean
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Global auth state to prevent duplicate API calls
let globalAuthState: AuthState = {
  user: null,
  loading: false,
  error: null
}

let authPromise: Promise<AuthState> | null = null

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(globalAuthState)

  const fetchUser = useCallback(async (): Promise<AuthState> => {
    // If already loading, return the existing promise
    if (authPromise) {
      return authPromise
    }

    // If we already have user data, return it
    if (globalAuthState.user && !globalAuthState.loading) {
      return globalAuthState
    }

    // Create new promise
    authPromise = (async () => {
      try {
        globalAuthState = { ...globalAuthState, loading: true, error: null }
        setAuthState(globalAuthState)

        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          globalAuthState = {
            user: data.user,
            loading: false,
            error: null
          }
        } else {
          // Don't treat 401 as an error - it's expected for unauthenticated users
          globalAuthState = {
            user: null,
            loading: false,
            error: response.status === 401 ? null : `Authentication failed: ${response.status}`
          }
        }
      } catch (error) {
        globalAuthState = {
          user: null,
          loading: false,
          error: 'Network error'
        }
      } finally {
        authPromise = null
        setAuthState(globalAuthState)
      }

      return globalAuthState
    })()

    return authPromise
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const refreshAuth = useCallback(() => {
    globalAuthState = { user: null, loading: false, error: null }
    authPromise = null
    fetchUser()
  }, [fetchUser])

  const logout = useCallback(() => {
    globalAuthState = { user: null, loading: false, error: null }
    authPromise = null
    setAuthState(globalAuthState)
  }, [])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    refreshAuth,
    logout,
    isAuthenticated: !!authState.user
  }
}
