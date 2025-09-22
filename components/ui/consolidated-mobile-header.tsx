"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  User, 
  Settings, 
  HelpCircle, 
  Bell, 
  LogOut, 
  Search, 
  Plus,
  ChevronRight,
  Shield,
  Banknote,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  Globe,
  Loader2
} from "lucide-react"
import { useLogout } from "@/hooks/use-logout"

interface ConsolidatedMobileHeaderProps {
  user: {
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

export function ConsolidatedMobileHeader({ 
  user, 
  activeSection = "overview",
  setActiveSection,
  totalBookings = 0,
  pendingBookings = 0,
  hasNotifications = false,
  className = "" 
}: ConsolidatedMobileHeaderProps) {
  const router = useRouter()
  const { logout, isLoggingOut } = useLogout()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)
  const lastFocusableRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLDivElement>(null)


  // Close menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMenuOpen) {
        closeMenu()
      }
    }

    // Close menu on any navigation
    return () => {
      handleRouteChange()
    }
  }, [isMenuOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
      // Focus first focusable element
      setTimeout(() => {
        firstFocusableRef.current?.focus()
      }, 100)
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMenuOpen])

  // Handle focus trap
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (!isMenuOpen) return

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault()
            lastFocusableRef.current?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault()
            firstFocusableRef.current?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isMenuOpen])

  // Handle logout confirmation dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLogoutConfirm) {
        cancelLogout()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        cancelLogout()
      }
    }

    if (showLogoutConfirm) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLogoutConfirm])

  const closeMenu = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsMenuOpen(false)
      setIsClosing(false)
    }, 200)
  }

  const openMenu = () => {
    setIsMenuOpen(true)
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
      
      // Perform logout
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      // Error handling is already done in the useLogout hook
    }
  }

  const cancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return "U"
  }

  // Navigation items
  const dashboardNavItems = [
    { id: "overview", label: "Overview", icon: Home, href: "/dashboard" },
    { id: "bookings", label: "Bookings", icon: Calendar, href: "/dashboard?section=bookings", badge: totalBookings > 0 ? totalBookings : null },
    { id: "services", label: "Services", icon: TrendingUp, href: "/dashboard?section=services" },
    { id: "payments", label: "Payments", icon: CreditCard, href: "/dashboard?section=payments" },
    { id: "profile", label: "Profile", icon: User, href: "/dashboard?section=profile" },
    { id: "support", label: "Support", icon: HelpCircle, href: "/dashboard?section=support" },
  ]

  const mainNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/services", label: "Browse Services", icon: Search },
    { href: "/book-service", label: "Book Service", icon: Plus },
    { href: "/about", label: "About Us", icon: User },
  ]

  const accountNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/bookings", label: "My Bookings", icon: Calendar },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/support", label: "Support", icon: HelpCircle },
  ]

  const handleNavigationClick = (href: string, sectionId?: string) => {
    if (sectionId && setActiveSection) {
      setActiveSection(sectionId)
    } else {
      router.push(href)
    }
    closeMenu()
  }

  return (
    <>
      {/* Mobile Header */}
      <header className={`bg-black/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40 ${className}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <img 
                src="/handshake.png" 
                alt="ProLiink Connect Logo" 
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
              />
              <div className="flex flex-col">
                <span className="text-base xs:text-lg sm:text-xl font-bold text-white leading-tight">ProL<span className="text-blue-400">ii</span>nk</span>
                <span className="text-xs text-white/80 leading-tight hidden xs:block">Connect</span>
              </div>
            </Link>

            {/* Right side - Notifications and Menu */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {hasNotifications && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </Button>

              {/* Hamburger Menu Button */}
              <Button
                ref={firstFocusableRef}
                variant="ghost"
                size="sm"
                onClick={openMenu}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
                aria-label="Open navigation menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation-menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div 
          className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-200 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={closeMenu}
          aria-hidden="true"
        >
          {/* Mobile Navigation Panel */}
          <div 
            ref={menuRef}
            id="mobile-navigation-menu"
            className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black/90 backdrop-blur-sm shadow-2xl transform transition-transform duration-200 ease-out flex flex-col ${
              isClosing ? 'translate-x-full' : 'translate-x-0'
            }`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img 
                  src="/handshake.png" 
                  alt="ProLiink Connect Logo" 
                  className="w-10 h-10 rounded-xl object-cover shadow-lg"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-tight">ProL<span className="text-blue-400">ii</span>nk</span>
                  <span className="text-xs text-white/80 leading-tight">Connect</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Quick Logout Button - Always visible at top */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="px-3 py-2 text-xs font-bold"
                  aria-label="Quick logout"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
                <Button
                  ref={lastFocusableRef}
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                  className="p-2 min-h-[44px] min-w-[44px]"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* User Info Section */}
            {user && (
              <div className="p-4 border-b border-white/20 bg-white/10">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {user.name || 'User'}
                    </div>
                    <div className="text-xs text-white/80 truncate">
                      {user.email}
                    </div>
                    {user.role && (
                      <div className="mt-1">
                        <Badge className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {user.role}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Dashboard Sections (if on dashboard) */}
              {setActiveSection && (
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Dashboard
                  </div>
                  <nav className="space-y-1">
                    {dashboardNavItems.map((item) => {
                      const Icon = item.icon
                      const isActive = activeSection === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigationClick(item.href, item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors duration-200 min-h-[44px] ${
                            isActive
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="w-5 h-5 text-white/60" />
                          <span className="font-medium flex-1">{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              {item.badge}
                            </Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-white/40" />
                        </button>
                      )
                    })}
                  </nav>
                </div>
              )}

              {/* Main Navigation */}
              <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Main Menu
                </div>
                <nav className="space-y-1">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-3 text-white/80 rounded-lg hover:bg-white/10 transition-colors duration-200 min-h-[44px]"
                        onClick={closeMenu}
                      >
                        <Icon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium flex-1">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* User Account Section */}
              {user && (
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    My Account
                  </div>
                  <nav className="space-y-1">
                    {accountNavItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-3 px-3 py-3 text-white/80 rounded-lg hover:bg-white/10 transition-colors duration-200 min-h-[44px]"
                          onClick={closeMenu}
                        >
                          <Icon className="w-5 h-5 text-white/60" />
                          <span className="font-medium flex-1">{item.label}</span>
                          <ChevronRight className="w-4 h-4 text-white/40" />
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              )}

              {/* Support Section */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Support
                </div>
                <nav className="space-y-1">
                  <Link
                    href="/help"
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 min-h-[44px]"
                    onClick={closeMenu}
                  >
                    <HelpCircle className="w-5 h-5 text-gray-500" />
                    <span className="font-medium flex-1">Help & Support</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 min-h-[44px]"
                    onClick={closeMenu}
                  >
                    <MessageCircle className="w-5 h-5 text-gray-500" />
                    <span className="font-medium flex-1">Contact Us</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div 
            ref={confirmRef}
            className="bg-black/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100 border border-white/20"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
          >
            {/* Header */}
            <div className="flex items-center justify-center p-6 border-b border-white/20">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <h3 
                id="logout-dialog-title"
                className="text-lg font-semibold text-white mb-2"
              >
                Sign Out
              </h3>
              <p 
                id="logout-dialog-description"
                className="text-white/80 mb-6"
              >
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelLogout}
                  className="flex-1 min-h-[44px] font-medium border-white/30 text-white/80 hover:bg-white/10"
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