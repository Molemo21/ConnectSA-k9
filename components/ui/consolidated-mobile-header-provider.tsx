"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Calendar,
  Star,
  Clock,
  DollarSign,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useLogout } from "@/hooks/use-logout"
import Link from "next/link"

interface ConsolidatedMobileHeaderProviderProps {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
    avatar?: string | null
  } | null
  activeSection?: string
  setActiveSection?: (section: string) => void
  totalBookings?: number
  pendingBookings?: number
  hasNotifications?: boolean
  className?: string
}

export function ConsolidatedMobileHeaderProvider({ 
  user, 
  activeSection = "overview",
  setActiveSection,
  totalBookings = 0,
  pendingBookings = 0,
  hasNotifications = false,
  className = "" 
}: ConsolidatedMobileHeaderProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()
  const { logout, isLoggingOut } = useLogout()

  // Close menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (isOpen) {
        closeMenu()
      }
    }

    return () => {
      // Cleanup function
    }
  }, [isOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const closeMenu = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 200)
  }


  const openMenu = () => {
    setIsOpen(true)
  }

  const handleLogout = async () => {
    try {
      // Show custom confirmation dialog
      setShowLogoutConfirm(true)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const confirmLogout = async () => {
    try {
      // Close confirmation dialog
      setShowLogoutConfirm(false)
      
      // Close menu first for better UX
      closeMenu()
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Perform logout using the comprehensive logout hook
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      // Error handling is already done in the useLogout hook
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "CLIENT":
        return { label: "Client", color: "bg-blue-100 text-blue-800" }
      case "PROVIDER":
        return { label: "Provider", color: "bg-green-100 text-green-800" }
      case "ADMIN":
        return { label: "Admin", color: "bg-purple-100 text-purple-800" }
      default:
        return { label: role, color: "bg-gray-100 text-gray-800" }
    }
  }

  const roleDisplay = user?.role ? getRoleDisplay(user.role) : null

  const userNavigationItems = [
    { href: "/provider/dashboard", label: "Dashboard", icon: Home },
    { href: "/provider/bookings", label: "My Bookings", icon: Calendar },
    { href: "/provider/earnings", label: "Earnings", icon: DollarSign },
    { href: "/provider/reviews", label: "Reviews", icon: Star },
    { href: "/provider/settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile Header */}
      <header className={`sticky top-0 z-40 bg-black/70 backdrop-blur-sm border-b border-white/20 ${className}`}>
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <img 
              src="/handshake.png" 
              alt="ProLiink Connect Logo" 
              className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-tight">ProL<span className="text-blue-400">ii</span>nk</span>
              <span className="text-xs text-white/80 leading-tight">Connect</span>
            </div>
          </Link>

          {/* Right side - User Menu or Auth */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Bell className="w-5 h-5" />
              {hasNotifications && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Stats */}
                <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{totalBookings}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{pendingBookings}</span>
                  </div>
                </div>

                {/* User Avatar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openMenu}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || 'P'}
                    </span>
                  </div>
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-[60] bg-black bg-opacity-50 transition-opacity duration-200 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={closeMenu}
        >
          {/* Mobile Menu Panel */}
          <div 
            className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black/95 backdrop-blur-xl shadow-2xl border-l border-blue-400/20 transform transition-transform duration-200 ease-in-out flex flex-col ${
              isClosing ? 'translate-x-full' : 'translate-x-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-400/20">
              <div className="flex items-center space-x-3">
                <img 
                  src="/handshake.png" 
                  alt="ProLiink Connect Logo" 
                  className="w-10 h-10 rounded-xl object-cover shadow-lg"
                />
                <div>
                  <div className="text-lg font-bold text-white">ProL<span className="text-blue-400">ii</span>nk Connect</div>
                  <div className="text-xs text-gray-300">Provider Dashboard</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMenu}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800/50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation Content */}
            <div className="flex flex-col h-full overflow-y-auto">
              {/* User Info Section */}
              {user && (
                <div className="px-6 py-4 bg-gradient-to-r from-blue-400/10 to-purple-500/10 border-b border-blue-400/20">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.name || 'Provider'}
                      </p>
                      <p className="text-xs text-gray-300 truncate">
                        {user.email}
                      </p>
                      {roleDisplay && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleDisplay.color}`}>
                            {roleDisplay.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="text-lg font-bold text-white">{totalBookings}</div>
                      <div className="text-xs text-gray-400">Total Bookings</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="text-lg font-bold text-amber-400">{pendingBookings}</div>
                      <div className="text-xs text-gray-400">Pending</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Navigation */}
              <div className="flex-1 px-6 py-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">
                    Navigation
                  </div>
                  {userNavigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-2 text-gray-200 hover:bg-blue-500/20 hover:text-white rounded-lg transition-colors duration-200"
                        onClick={closeMenu}
                      >
                        <Icon className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

              </div>

              {/* Footer - Sticky at bottom */}
              <div className="mt-auto px-6 py-4 border-t border-blue-400/20 bg-black/50">
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center text-red-400 border-red-500/30 hover:bg-red-600/20 hover:border-red-500/50 hover:text-red-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full text-gray-200 border-gray-600 hover:bg-gray-800/50 hover:text-white">
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 mx-4 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">
                Sign Out
              </h3>
              
              <p className="text-gray-300 text-sm mb-6">
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 min-h-[44px] font-medium border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  disabled={isLoggingOut}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmLogout}
                  className="flex-1 min-h-[44px] font-medium bg-red-600 hover:bg-red-700"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
