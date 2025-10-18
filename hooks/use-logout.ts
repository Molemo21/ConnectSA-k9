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
      
      // Make logout request
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      })

      if (response.ok) {
        // Clear AuthContext state
        if (authContext) {
          authContext.logout()
        }
        
        // Clear all storage
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear cookies
        const cookieNames = [
          'auth-token', 
          'user-session', 
          'auth-session', 
          'session', 
          'token'
        ]
        
        cookieNames.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        })
        
        showToast.success("Logged out successfully")
        
        // Redirect to home page with cache busting
        window.location.href = `/?t=${Date.now()}`
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