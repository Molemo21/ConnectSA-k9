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
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        showToast.success("Logged out successfully")
        // Clear any client-side state
        localStorage.removeItem("user")
        sessionStorage.clear()
        
        // Redirect to home page
        router.push("/")
        router.refresh() // Refresh to update server-side state
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