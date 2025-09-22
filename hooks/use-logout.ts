"use client"

import { useState } from "react"
import { showToast } from "@/lib/toast"

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      console.log('Starting logout process...')
      
      // Make logout request with credentials
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log('Logout response:', response.status, response.statusText)

      if (response.ok) {
        showToast.success("Logged out successfully")
        console.log('Logout successful, clearing client state...')
        
        // Clear all possible client-side storage
        try {
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear any possible auth-related items
          const keysToRemove = ['user', 'auth', 'token', 'session', 'login']
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })
          
          // Clear any cookies that might be accessible client-side
          if (typeof window !== 'undefined') {
            const cookieNames = [
              'auth-token', 'user-session', 'auth-session', 'session', 'token', 
              'jwt', 'user', 'auth', 'login', 'sessionid', 'session_id'
            ]
            
            cookieNames.forEach(cookieName => {
              // Clear with different domain and path combinations
              const domains = ['', '.proliinkconnect.co.za', 'app.proliinkconnect.co.za', '.app.proliinkconnect.co.za']
              const paths = ['/', '/api', '/dashboard', '/provider']
              
              domains.forEach(domain => {
                paths.forEach(path => {
                  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? `;domain=${domain}` : ''}`
                })
              })
            })
          }
        } catch (storageError) {
          console.error('Error clearing client storage:', storageError)
        }
        
        console.log('Client state cleared, redirecting...')
        
        // Force a complete page reload to ensure all state is cleared
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
        
      } else {
        const error = await response.json()
        console.error('Logout failed:', error)
        showToast.error(error.error || "Failed to logout")
      }
    } catch (error) {
      console.error("Logout error:", error)
      showToast.error("Network error. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { logout, isLoggingOut }
} 