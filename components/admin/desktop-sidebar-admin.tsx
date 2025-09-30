"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3,
  Users,
  Briefcase,
  Calendar,
  CreditCard,
  TrendingUp,
  Settings,
  Shield,
  ChevronRight,
  X
} from "lucide-react"

interface DesktopSidebarAdminProps {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  totalBookings: number
  pendingBookings: number
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export function DesktopSidebarAdmin({
  activeSection,
  setActiveSection,
  user,
  totalBookings,
  pendingBookings,
  isCollapsed,
  setIsCollapsed
}: DesktopSidebarAdminProps) {
  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      badge: null
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      badge: null
    },
    {
      id: "providers",
      label: "Providers",
      icon: Briefcase,
      badge: pendingBookings > 0 ? pendingBookings.toString() : null
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      badge: totalBookings > 0 ? totalBookings.toString() : null
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      badge: null
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      badge: null
    },
    {
      id: "system",
      label: "System Health",
      icon: Shield,
      badge: null
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      badge: null
    }
  ]

  return (
    <div className={`
      hidden lg:flex flex-col bg-black/80 backdrop-blur-sm border-r border-gray-300/20 transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-300/20">
        <div className="flex items-center justify-between">
          <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-full'}`}>
            <h2 className="text-lg lg:text-xl font-semibold text-white whitespace-nowrap">Admin Dashboard</h2>
            <p className="text-sm lg:text-base text-gray-300 whitespace-nowrap truncate">Welcome back, {user?.name || user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 flex-shrink-0 min-h-[44px] min-w-[44px] transition-transform duration-200 hover:scale-105"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="transition-transform duration-200">
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-300 ease-out min-h-[44px]
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black
                ${isActive 
                  ? 'bg-blue-400/20 backdrop-blur-sm text-white border border-blue-400/30 shadow-lg shadow-blue-400/20' 
                  : 'text-gray-300 hover:bg-blue-400/10 hover:text-white hover:border-blue-400/20 hover:shadow-sm'
                }
              `}
              aria-label={`Switch to ${item.label} section`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-gray-300'}`} />
              <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-full'}`}>
                <span className="font-medium whitespace-nowrap">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto bg-blue-400/20 text-blue-400 border-blue-400/30 flex-shrink-0">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className={`p-4 border-t border-gray-300/20 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
        <div className="bg-blue-400/10 backdrop-blur-sm rounded-lg p-3 border border-blue-400/20">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">System Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">Database</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">API</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
