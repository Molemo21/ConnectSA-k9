"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/ui/user-menu'
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  HelpCircle,
  CreditCard,
  Shield,
  Clock,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MobileNavigationProps {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
    avatar?: string | null
  } | null
  showAuth?: boolean
  showUserMenu?: boolean
}

export function MobileNavigation({ user, showAuth = true, showUserMenu = false }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const router = useRouter()

  // Close menu when route changes - using pathname for Next.js 13+
  useEffect(() => {
    const handleRouteChange = () => {
      if (isOpen) {
        closeMenu()
      }
    }

    // For Next.js 13+, we'll close menu on any navigation
    // This is a simpler approach that works reliably
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
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
      router.refresh()
      closeMenu()
    } catch (error) {
      console.error("Logout failed:", error)
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

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "#services", label: "Services", icon: Briefcase },
    { href: "#how-it-works", label: "How it Works", icon: Clock },
    { href: "/provider/onboarding", label: "Become a Provider", icon: User },
  ]

  const userNavigationItems = user?.role === "CLIENT" ? [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/bookings", label: "My Bookings", icon: Calendar },
    { href: "/services", label: "Browse Services", icon: Search },
    { href: "/profile", label: "Profile", icon: User },
  ] : user?.role === "PROVIDER" ? [
    { href: "/provider/dashboard", label: "Dashboard", icon: Home },
    { href: "/provider/bookings", label: "My Jobs", icon: Calendar },
    { href: "/provider/profile", label: "Profile", icon: User },
    { href: "/provider/bank-details", label: "Bank Details", icon: CreditCard },
  ] : user?.role === "ADMIN" ? [
    { href: "/admin", label: "Admin Panel", icon: Shield },
    { href: "/admin/providers", label: "Providers", icon: Users },
    { href: "/admin/bookings", label: "All Bookings", icon: Calendar },
  ] : []

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden p-2"
        onClick={openMenu}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-200 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={closeMenu}
        >
          {/* Mobile Navigation Panel */}
          <div 
            className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-200 ease-in-out ${
              isClosing ? 'translate-x-full' : 'translate-x-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">ProLiink Connect</div>
                  <div className="text-xs text-gray-500">Trusted Services</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMenu}
                className="p-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation Content */}
            <div className="flex flex-col h-full">
              {/* User Info Section */}
              {user && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user.name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                      {roleDisplay && (
                        <div className={`inline-block px-2 py-1 text-xs rounded-full ${roleDisplay.color} mt-1`}>
                          {roleDisplay.label}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Navigation */}
              <div className="flex-1 overflow-y-auto">
                {/* Primary Navigation */}
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Main Menu
                  </div>
                  <nav className="space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          onClick={closeMenu}
                        >
                          <Icon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* User-specific Navigation */}
                {user && userNavigationItems.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      My Account
                    </div>
                    <nav className="space-y-1">
                      {userNavigationItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            onClick={closeMenu}
                          >
                            <Icon className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">{item.label}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                          </Link>
                        )
                      })}
                    </nav>
                  </div>
                )}

                {/* Help & Support */}
                <div className="p-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Support
                  </div>
                  <nav className="space-y-1">
                    <Link
                      href="/help"
                      className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      onClick={closeMenu}
                    >
                      <HelpCircle className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Help & Support</span>
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      onClick={closeMenu}
                    >
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Contact Us</span>
                    </Link>
                  </nav>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                {user ? (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      onClick={() => {
                        handleLogout()
                        closeMenu()
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      asChild
                      onClick={closeMenu}
                    >
                      <Link href="/login">
                        Sign In
                      </Link>
                    </Button>
                    <Button
                      className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      asChild
                      onClick={closeMenu}
                    >
                      <Link href="/signup">
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
