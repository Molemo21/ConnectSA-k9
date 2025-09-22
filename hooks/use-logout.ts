"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { showToast } from "@/lib/toast"

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        showToast.success("Logged out successfully")
        
        // Clear any client-side state
        localStorage.removeItem("user")
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear any cached data
        if (typeof window !== 'undefined') {
          // Force clear all cookies that might be accessible client-side
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=")
            const name = eqPos > -1 ? c.substr(0, eqPos) : c
            document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.proliinkconnect.co.za`
            document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=app.proliinkconnect.co.za`
            document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          })
        }
        
        // Force a hard reload to ensure all state is cleared
        window.location.href = "/"
      } else {
        const error = await response.json()
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