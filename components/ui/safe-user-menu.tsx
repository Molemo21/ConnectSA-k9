"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  LogOut, 
  Settings, 
  Bell, 
  Calendar,
  ChevronDown,
  Activity,
  Star,
  Home,
  Clock
} from "lucide-react"
import { useLogout } from "@/hooks/use-logout"
import { useRouter } from "next/navigation"

interface SafeUserMenuProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    role?: string | null
    avatar?: string | null
  } | null
  showNotifications?: boolean
  userStats?: {
    totalBookings?: number
    pendingBookings?: number
    completedBookings?: number
    rating?: number
  }
}

// Safe renderer utility
const safeRender = (value: any, fallback: string = ""): string => {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toString()
  if (typeof value === "boolean") return value.toString()
  return fallback
}

// Safe number renderer
const safeNumber = (value: any, fallback: number = 0): number => {
  if (typeof value === "number" && !isNaN(value)) return value
  if (typeof value === "string") {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

export function SafeUserMenu({ user, showNotifications = true, userStats }: SafeUserMenuProps) {
  const { logout, isLoggingOut } = useLogout()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only running on client
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      setIsOpen(false)
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [logout])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  // Safe navigation handlers
  const handleNavigation = useCallback((path: string) => {
    try {
      setIsOpen(false)
      router.push(path)
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }, [router])

  // Safe user data
  const safeUser = {
    id: safeRender(user?.id, ""),
    name: safeRender(user?.name, "User"),
    email: safeRender(user?.email, ""),
    role: safeRender(user?.role, ""),
    avatar: user?.avatar || undefined
  }

  // Safe user stats - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const safeStats = useMemo(() => ({
    totalBookings: safeNumber(userStats?.totalBookings, 0),
    pendingBookings: safeNumber(userStats?.pendingBookings, 0),
    completedBookings: safeNumber(userStats?.completedBookings, 0),
    rating: safeNumber(userStats?.rating, 0)
  }), [userStats])

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This ensures hooks are called in the same order on every render

  // Conditional rendering AFTER all hooks have been called
  if (!user || !user.id) {
    return null
  }

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return (
      <div className="flex items-center space-x-3">
        <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
        <div className="hidden lg:block">
          <div className="animate-pulse bg-gray-200 h-4 w-24 rounded mb-1"></div>
          <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
        </div>
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive" className="text-xs">Admin</Badge>
      case "PROVIDER":
        return <Badge variant="default" className="text-xs">Provider</Badge>
      case "CLIENT":
        return <Badge variant="secondary" className="text-xs">Client</Badge>
      default:
        return null
    }
  }

  const getInitials = () => {
    if (safeUser.name && safeUser.name !== "User") {
      return safeUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (safeUser.email) {
      return safeUser.email[0].toUpperCase()
    }
    return "U"
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "CLIENT":
        return "Client"
      case "PROVIDER":
        return "Service Provider"
      case "ADMIN":
        return "Admin"
      default:
        return "User"
    }
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Quick Stats Display - Desktop Only */}
      {safeStats.totalBookings > 0 && (
        <div className="hidden lg:flex items-center space-x-4 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex items-center space-x-1 text-sm text-white/90">
            <Activity className="w-4 h-4" />
            <span className="font-medium">{safeStats.totalBookings}</span>
            <span className="text-white/60">bookings</span>
          </div>
          {safeStats.pendingBookings > 0 && (
            <div className="flex items-center space-x-1 text-sm text-amber-300">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{safeStats.pendingBookings}</span>
              <span className="text-amber-300/60">pending</span>
            </div>
          )}
          {safeStats.rating > 0 && (
            <div className="flex items-center space-x-1 text-sm text-yellow-300">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium">{safeStats.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {showNotifications && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => handleNavigation("/notifications")}
        >
          <Bell className="w-4 h-4" />
          {safeStats.pendingBookings > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
          )}
        </Button>
      )}

      {/* Enhanced User Menu */}
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 group">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-200">
                <AvatarImage src={safeUser.avatar} alt={safeUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white leading-none">
                  {safeUser.name}
                </p>
                <p className="text-xs text-white/70 leading-none mt-1">
                  {getRoleDisplay(safeUser.role)}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white transition-colors duration-200" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80 p-0 bg-black/95 border border-blue-400/20 shadow-2xl max-h-[70vh] overflow-y-auto z-50" align="end" forceMount>
          {/* User Info Section */}
          <div className="px-4 py-4 bg-gradient-to-r from-blue-400/10 to-purple-500/10 border-b border-blue-400/20">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-12 w-12 ring-2 ring-blue-400/30">
                <AvatarImage src={safeUser.avatar} alt={safeUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate">
                  {safeUser.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {safeUser.email}
                </p>
                {safeUser.role && (
                  <div className="flex items-center space-x-2 mt-1">
                    {getRoleBadge(safeUser.role)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200"
                onClick={() => handleNavigation("/notifications")}
              >
                <Bell className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-50 transition-colors duration-200" />
                Notifications
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200"
                onClick={() => handleNavigation("/settings")}
              >
                <Settings className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-50 transition-colors duration-200" />
                Settings
              </Button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="py-4">
            <div className="px-4 mb-3">
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                My Account
              </div>
            </div>
            <nav className="space-y-1 px-2">
              <DropdownMenuItem asChild className="!p-0">
                <button 
                  onClick={() => handleNavigation("/provider/dashboard")}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-200 hover:!bg-blue-500/30 hover:!text-blue-50 group transition-all duration-200 rounded-lg border border-transparent hover:!border-blue-400/30"
                >
                  <div className="p-1.5 rounded-md bg-gray-700/50 group-hover:!bg-blue-500/20 transition-colors duration-200">
                    <Home className="w-4 h-4 text-gray-400 group-hover:!text-blue-50 transition-colors duration-200" />
                  </div>
                  <span className="font-medium">Dashboard</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="!p-0">
                <button 
                  onClick={() => handleNavigation("/bookings")}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-200 hover:!bg-blue-500/30 hover:!text-blue-50 group transition-all duration-200 rounded-lg border border-transparent hover:!border-blue-400/30"
                >
                  <div className="p-1.5 rounded-md bg-gray-700/50 group-hover:!bg-blue-500/20 transition-colors duration-200">
                    <Calendar className="w-4 h-4 text-gray-400 group-hover:!text-blue-50 transition-colors duration-200" />
                  </div>
                  <span className="font-medium">My Bookings</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="!p-0">
                <button 
                  onClick={() => handleNavigation("/services")}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-200 hover:!bg-blue-500/30 hover:!text-blue-50 group transition-all duration-200 rounded-lg border border-transparent hover:!border-blue-400/30"
                >
                  <div className="p-1.5 rounded-md bg-gray-700/50 group-hover:!bg-blue-500/20 transition-colors duration-200">
                    <Activity className="w-4 h-4 text-gray-400 group-hover:!text-blue-50 transition-colors duration-200" />
                  </div>
                  <span className="font-medium">Browse Services</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="!p-0">
                <button 
                  onClick={() => handleNavigation("/profile")}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-200 hover:!bg-blue-500/30 hover:!text-blue-50 group transition-all duration-200 rounded-lg border border-transparent hover:!border-blue-400/30"
                >
                  <div className="p-1.5 rounded-md bg-gray-700/50 group-hover:!bg-blue-500/20 transition-colors duration-200">
                    <User className="w-4 h-4 text-gray-400 group-hover:!text-blue-50 transition-colors duration-200" />
                  </div>
                  <span className="font-medium">Profile</span>
                </button>
              </DropdownMenuItem>
            </nav>
          </div>

          <DropdownMenuSeparator className="bg-blue-400/20" />

          {/* Logout */}
          <div className="p-3 bg-gray-900/50 border-t border-gray-700/50">
            <Button 
              variant="outline" 
              className="w-full justify-center bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30 hover:border-red-500/50 hover:text-red-300 font-medium"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
