"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3
} from "lucide-react"
import Link from "next/link"

interface AdminSidebarProps {
  activeSection?: string
}

export function AdminSidebar({ activeSection = "overview" }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      href: "/admin/dashboard",
      description: "Dashboard overview"
    },
    {
      id: "manage-users",
      label: "Manage Users",
      icon: Users,
      href: "/admin/dashboard/manage-users",
      description: "View and manage user accounts"
    },
    {
      id: "approve-providers",
      label: "Approve Providers",
      icon: UserCheck,
      href: "/admin/dashboard/approve-providers",
      description: "Review pending provider applications"
    },
    {
      id: "view-bookings",
      label: "View Bookings",
      icon: Calendar,
      href: "/admin/dashboard/view-bookings",
      description: "Monitor all platform bookings"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/admin/dashboard/settings",
      description: "Configure platform settings"
    }
  ]

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <Link key={item.id} href={item.href}>
              <Card className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isActive 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isActive 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </p>
                      <p className={`text-xs ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            ProLiink Connect Admin
          </div>
        </div>
      )}
    </div>
  )
}


