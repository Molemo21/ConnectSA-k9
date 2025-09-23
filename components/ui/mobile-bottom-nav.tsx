"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLogout } from "@/hooks/use-logout"
import { 
  Home, 
  Calendar, 
  User, 
  Settings, 
  BarChart3,
  Users,
  Shield,
  Bell,
  Plus,
  Search,
  MessageCircle,
  Briefcase,
  DollarSign,
  Wrench,
  Activity,
  LogOut
} from "lucide-react"

interface MobileBottomNavProps {
  userRole: "CLIENT" | "PROVIDER" | "ADMIN"
  className?: string
}

export function MobileBottomNav({ userRole, className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { logout, isLoggingOut } = useLogout()

  const handleLogout = async () => {
    try {
      console.log('=== MOBILE BOTTOM NAV LOGOUT START ===')
      console.log('📱 Mobile browser:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      console.log('🌐 Network status:', navigator.onLine)
      
      // Check mobile-specific conditions
      if (!navigator.onLine) {
        console.error('❌ No network connection on mobile')
        alert('No internet connection. Please check your network and try again.')
        return
      }
      
      // Check storage availability on mobile
      let storageAvailable = true
      try {
        localStorage.setItem('mobile-test', 'test')
        localStorage.removeItem('mobile-test')
      } catch (e) {
        storageAvailable = false
        console.warn('⚠️ LocalStorage not available on mobile:', e)
      }
      
      console.log('💾 Storage available:', storageAvailable)
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('Calling logout function...')
      
      // Perform logout using the comprehensive logout hook with mobile-specific handling
      await logout()
      
      console.log('=== MOBILE BOTTOM NAV LOGOUT COMPLETE ===')
    } catch (error) {
      console.error("Mobile bottom nav logout error:", error)
      
      // Mobile-specific error handling
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        console.error('🌐 Mobile network error:', error)
        alert('Network error. Please check your connection and try again.')
      } else if (error.name === 'QuotaExceededError') {
        console.error('💾 Mobile storage quota exceeded:', error)
        alert('Storage error. Please clear browser data and try again.')
      } else {
        console.error('❌ Mobile logout error:', error)
        alert('Logout failed. Please try again or refresh the page.')
      }
    }
  }

  const getNavItems = () => {
    switch (userRole) {
      case "CLIENT":
        return [
          {
            href: "/dashboard",
            icon: Home,
            label: "Home",
            active: pathname === "/dashboard",
            isPrimary: false,
            isLogout: false
          },
          {
            href: "/search",
            icon: Search,
            label: "Search",
            active: pathname.startsWith("/search") || pathname === "/book-service",
            isPrimary: true, // Primary action - Search/Book
            isLogout: false
          },
          {
            href: "/bookings",
            icon: Calendar,
            label: "Bookings",
            active: pathname.startsWith("/bookings"),
            isPrimary: false,
            isLogout: false
          },
          {
            href: "/profile",
            icon: User,
            label: "Profile",
            active: pathname === "/profile",
            isPrimary: false,
            isLogout: false
          },
          {
            href: null,
            icon: LogOut,
            label: "Logout",
            active: false,
            isPrimary: false,
            isLogout: true
          }
        ]
      
      case "PROVIDER":
        return [
          {
            href: "/provider/dashboard",
            icon: Home,
            label: "Home",
            active: pathname === "/provider/dashboard",
            isPrimary: false,
            isLogout: false
          },
          {
            href: "/provider/bookings",
            icon: Briefcase,
            label: "Jobs",
            active: pathname.startsWith("/provider") && pathname.includes("booking"),
            isPrimary: true, // Primary action - Manage Bookings
            isLogout: false
          },
          {
            href: "/provider/earnings",
            icon: DollarSign,
            label: "Earnings",
            active: pathname === "/provider/earnings",
            isPrimary: false,
            isLogout: false
          },
          {
            href: "/provider/profile",
            icon: User,
            label: "Profile",
            active: pathname === "/provider/profile",
            isPrimary: false,
            isLogout: false
          },
          {
            href: null,
            icon: LogOut,
            label: "Logout",
            active: false,
            isPrimary: false,
            isLogout: true
          }
        ]
      
      case "ADMIN":
        return [
          {
            href: "/admin/dashboard",
            icon: Home,
            label: "Home",
            active: pathname === "/admin/dashboard",
            isPrimary: false,
            isLogout: false
          },
          {
            href: "/admin/users",
            icon: Users,
            label: "Users",
            active: pathname.startsWith("/admin") && pathname.includes("user"),
            isPrimary: true, // Primary action - Manage Users
            isLogout: false
          },
          {
            href: "/admin/providers",
            icon: Briefcase,
            label: "Providers",
            active: pathname.startsWith("/admin") && pathname.includes("provider"),
            isPrimary: false,
            isLogout: false
          },
          {
            href: "/admin/audit-logs",
            icon: Shield,
            label: "Audit",
            active: pathname.startsWith("/admin") && pathname.includes("audit"),
            isPrimary: false,
            isLogout: false
          },
          {
            href: null,
            icon: LogOut,
            label: "Logout",
            active: false,
            isPrimary: false,
            isLogout: true
          }
        ]
      
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm border-t border-white/20 px-2 py-2 z-[80]",
      "sm:hidden", // Only show on mobile
      className
    )}>
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isPrimary = item.isPrimary
          const isActive = item.active
          const isLogout = item.isLogout
          
          if (isLogout) {
            return (
              <button
                key="logout"
                onClick={handleLogout}
                onTouchStart={(e) => {
                  // Ensure touch events work on mobile
                  e.preventDefault()
                  console.log('📱 Touch start on logout button')
                }}
                onTouchEnd={(e) => {
                  // Prevent double-tap zoom and ensure click works
                  e.preventDefault()
                  console.log('📱 Touch end on logout button')
                }}
                disabled={isLoggingOut}
                className={cn(
                  "flex flex-col items-center space-y-1 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200",
                  "min-h-[48px] min-w-[48px] justify-center", // Larger touch target for better UX
                  "text-red-400 hover:text-red-300 hover:bg-red-600/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "touch-manipulation", // Optimize for touch
                  "select-none" // Prevent text selection on mobile
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
                  WebkitTouchCallout: 'none', // Disable callout on iOS
                  WebkitUserSelect: 'none', // Prevent selection on WebKit
                  userSelect: 'none'
                }}
              >
                <Icon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-xs leading-tight font-medium">
                  {isLoggingOut ? "..." : item.label}
                </span>
              </button>
            )
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center space-y-1 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200",
                "min-h-[48px] min-w-[48px] justify-center", // Larger touch target for better UX
                isActive
                  ? isPrimary
                    ? "text-white bg-blue-600 shadow-lg shadow-blue-600/25" // Primary action when active
                    : "text-blue-600 bg-blue-50"
                  : isPrimary
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100" // Primary action when inactive
                    : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className={cn(
                "transition-transform duration-200",
                isActive && isPrimary ? "w-6 h-6" : "w-5 h-5", // Slightly larger icon for primary active
                isActive && isPrimary && "animate-pulse" // Subtle animation for primary active
              )} />
              <span className={cn(
                "text-xs leading-tight font-medium",
                isActive && isPrimary && "font-semibold" // Bolder text for primary active
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
