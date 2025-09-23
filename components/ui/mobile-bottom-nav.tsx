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
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
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
      "fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm border-t border-white/20 px-2 py-2 z-50",
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
                disabled={isLoggingOut}
                className={cn(
                  "flex flex-col items-center space-y-1 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200",
                  "min-h-[48px] min-w-[48px] justify-center", // Larger touch target for better UX
                  "text-red-400 hover:text-red-300 hover:bg-red-600/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
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
