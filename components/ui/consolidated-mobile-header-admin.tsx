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
  Loader2,
  Users,
  Briefcase,
  BarChart3,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import { useLogout } from "@/hooks/use-logout"

interface ConsolidatedMobileHeaderAdminProps {
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

export function ConsolidatedMobileHeaderAdmin({ 
  user, 
  activeSection = "overview",
  setActiveSection,
  totalBookings = 0,
  pendingBookings = 0,
  hasNotifications = false,
  className = "" 
}: ConsolidatedMobileHeaderAdminProps) {
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
      if (e.key === 'Escape') {
        if (showLogoutConfirm) {
          setShowLogoutConfirm(false)
        } else if (isMenuOpen) {
          closeMenu()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMenuOpen, showLogoutConfirm])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isMenuOpen) {
          closeMenu()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const closeMenu = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsMenuOpen(false)
      setIsClosing(false)
    }, 150)
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    closeMenu()
    await logout()
  }

  const handleSectionChange = (section: string) => {
    setActiveSection?.(section)
    closeMenu()
  }

  const menuItems = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      href: "/admin/dashboard"
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      href: "/admin/users"
    },
    {
      id: "providers",
      label: "Providers",
      icon: Briefcase,
      href: "/admin/providers"
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      href: "/admin/bookings"
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      href: "/admin/payments"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      href: "/admin/analytics"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/admin/settings"
    }
  ]

  return (
    <>
      {/* Header */}
      <header className={`bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 py-4 ${className}`}>
        <div className="flex items-center justify-between">
          {/* Left side - Menu button and title */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2"
              ref={firstFocusableRef}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-gray-400">Platform Management</p>
              </div>
            </div>
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-gray-400 hover:text-white hover:bg-gray-800/50 p-2"
            >
              <Bell className="w-5 h-5" />
              {hasNotifications && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </Button>

            {/* User Avatar */}
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => setIsMenuOpen(true)}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || ''} />
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div 
            ref={menuRef}
            className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-black/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-200 ease-in-out ${
              isClosing ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                  <p className="text-sm text-gray-400">Platform Management</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMenu}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2"
                ref={lastFocusableRef}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user?.avatar || ''} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    {user?.email || 'admin@example.com'}
                  </p>
                  <Badge className="mt-1 bg-blue-900/50 text-blue-400 border-blue-800/50 text-xs">
                    {user?.role || 'ADMIN'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 border-b border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-white font-bold text-lg">{totalBookings}</p>
                  <p className="text-gray-400 text-xs">Total Bookings</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-white font-bold text-lg">{pendingBookings}</p>
                  <p className="text-gray-400 text-xs">Pending</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => handleSectionChange(item.id)}
                      className={`w-full justify-start h-12 px-3 text-left ${
                        isActive 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-400/30' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )
                })}
              </div>
            </nav>

            {/* System Status */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">System Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-800/50 rounded">
                  <Database className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">DB</p>
                </div>
                <div className="p-2 bg-gray-800/50 rounded">
                  <Server className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">API</p>
                </div>
                <div className="p-2 bg-gray-800/50 rounded">
                  <Bell className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Notif</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full justify-start h-12 px-3 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div 
            ref={confirmRef}
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 mx-4 max-w-sm w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-900/20 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Sign Out</h3>
                <p className="text-sm text-gray-400">Are you sure you want to sign out?</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing Out...
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
      )}
    </>
  )
}