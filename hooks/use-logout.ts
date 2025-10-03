"use client"

import { useState, useContext } from "react"
import { showToast } from "@/lib/toast"
import { AuthContext } from "@/contexts/AuthContext"

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const authContext = useContext(AuthContext)

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      console.log('=== CLIENT LOGOUT START ===')
      
      // Make logout request with comprehensive headers and mobile-specific handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for mobile
      
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "User-Agent": typeof window !== 'undefined' ? navigator.userAgent : 'Server' // Include user agent for mobile detection
        },
      })
      
      clearTimeout(timeoutId)

      console.log('Logout response status:', response.status)
      console.log('Logout response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Logout result:', result)
        
        showToast.success("Logged out successfully")
        console.log('Logout successful, clearing ALL client state...')
        
        // Clear AuthContext state first (with safety check)
        if (authContext) {
          authContext.logout()
          console.log('AuthContext cleared')
        } else {
          console.warn('AuthContext not available - this might indicate a provider issue')
        }
        
        // Nuclear option: Clear EVERYTHING
        try {
          // Clear all storage
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear indexedDB if available
          if (typeof window !== 'undefined' && 'indexedDB' in window) {
            try {
              indexedDB.databases().then(databases => {
                databases.forEach(db => {
                  if (db.name) {
                    indexedDB.deleteDatabase(db.name)
                  }
                })
              })
            } catch (e) {
              console.log('IndexedDB clear failed:', e)
            }
          }
          
          // Clear service worker cache if available
          if (typeof window !== 'undefined' && 'caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name)
              })
            })
          }
          
          // Clear all possible auth-related items
          const keysToRemove = [
            'user', 'auth', 'token', 'session', 'login', 'jwt',
            'auth-token', 'user-session', 'auth-session', 'sessionid',
            'next-auth.session-token', 'next-auth.csrf-token'
          ]
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })
          
          // Nuclear cookie clearing
          if (typeof window !== 'undefined') {
            const cookieNames = [
              'auth-token', 'user-session', 'auth-session', 'session', 'token', 
              'jwt', 'user', 'auth', 'login', 'sessionid', 'session_id',
              'connect.sid', 'express:sess', 'next-auth.session-token',
              'next-auth.csrf-token', 'next-auth.callback-url'
            ]
            
            const domains = [
              '', 
              window.location.hostname,
              '.' + window.location.hostname,
              '.proliinkconnect.co.za', 
              'app.proliinkconnect.co.za', 
              '.app.proliinkconnect.co.za'
            ]
            
            const paths = ['/', '/api', '/dashboard', '/provider', '/admin']
            
            cookieNames.forEach(cookieName => {
              domains.forEach(domain => {
                paths.forEach(path => {
                  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? `;domain=${domain}` : ''}`
                  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? `;domain=${domain}` : ''};secure`
                  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? `;domain=${domain}` : ''};samesite=lax`
                })
              })
            })
            
            // Clear all cookies by iterating through document.cookie
            document.cookie.split(";").forEach(cookie => {
              const eqPos = cookie.indexOf("=")
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
              if (name) {
                domains.forEach(domain => {
                  paths.forEach(path => {
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? `;domain=${domain}` : ''}`
                  })
                })
              }
            })
          }
        } catch (storageError) {
          console.error('Error clearing client storage:', storageError)
        }
        
        console.log('ALL client state cleared, forcing complete reload...')
        
        // Force complete page reload with cache busting
        if (typeof window !== 'undefined') {
          const timestamp = Date.now()
          window.location.href = `/?_t=${timestamp}`
        }
        
      } else {
        const error = await response.json()
        console.error('Logout failed:', error)
        showToast.error(error.error || "Failed to logout")
      }
    } catch (error) {
      console.error("=== CLIENT LOGOUT ERROR ===", error)
      showToast.error("Network error. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { logout, isLoggingOut }
} 