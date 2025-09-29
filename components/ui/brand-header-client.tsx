"use client"

import { useEffect, useState } from "react"
import { BrandHeader } from "./brand-header"

interface BrandHeaderClientProps {
  showAuth?: boolean
  showUserMenu?: boolean
  className?: string
  userStats?: {
    totalBookings?: number
    pendingBookings?: number
    completedBookings?: number
    rating?: number
  }
  // Loading states
  servicesLoading?: boolean
  signInLoading?: boolean
  onServicesClick?: () => void
  onSignInClick?: () => void
}

export function BrandHeaderClient({ 
  showAuth = true, 
  showUserMenu = false, 
  className = "",
  userStats,
  servicesLoading = false,
  signInLoading = false,
  onServicesClick,
  onSignInClick
}: BrandHeaderClientProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.log("User not authenticated")
      } finally {
        setLoading(false)
      }
    }

    // Always check authentication status
    fetchUser()
  }, [])

  // Don't render until we've checked authentication
  if (loading) {
    return (
      <header className={`border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
      </header>
    )
  }

  return (
    <BrandHeader 
      showAuth={showAuth} 
      showUserMenu={user ? true : showUserMenu} 
      className={className}
      user={user}
      userStats={userStats}
      servicesLoading={servicesLoading}
      signInLoading={signInLoading}
      onServicesClick={onServicesClick}
      onSignInClick={onSignInClick}
    />
  )
} 