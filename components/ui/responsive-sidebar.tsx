"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Menu, X, Home, Calendar, CreditCard, Settings, HelpCircle, 
  ChevronLeft, ChevronRight, Shield, User, LogOut, Bell
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
  badge?: number
}

interface ResponsiveSidebarProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  items?: SidebarItem[]
  onItemClick?: (item: SidebarItem) => void
  className?: string
}

const defaultItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
  { name: 'Bookings', href: '/bookings', icon: Calendar, current: false, badge: 3 },
  { name: 'Payments', href: '/payments', icon: CreditCard, current: false },
  { name: 'Support', href: '/support', icon: HelpCircle, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
]

export function ResponsiveSidebar({ 
  user = { name: 'John Doe', email: 'john@example.com' },
  items = defaultItems,
  onItemClick,
  className 
}: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById('responsive-sidebar')
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  const handleItemClick = (item: SidebarItem) => {
    if (onItemClick) {
      onItemClick(item)
    }
    
    // Close mobile sidebar after clicking
    if (isMobile) {
      setIsOpen(false)
    }
  }

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-60'
  const mobileTransform = isOpen ? 'translate-x-0' : '-translate-x-full'

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md hover:bg-gray-50"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="responsive-sidebar"
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300 ease-in-out",
          // Mobile styles
          isMobile ? `w-60 ${mobileTransform}` : 
          // Desktop styles
          `${sidebarWidth} translate-x-0`,
          className
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {/* Logo/Brand */}
          <div className={cn(
            "flex items-center space-x-3 transition-opacity duration-200",
            isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">ConnectSA</h1>
              <p className="text-xs text-gray-500 truncate">Client Portal</p>
            </div>
          </div>

          {/* Desktop Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:flex p-1.5 transition-all duration-200",
              isCollapsed ? "ml-0" : "ml-2"
            )}
          >
            {isCollapsed ? 
              <ChevronRight className="w-4 h-4" /> : 
              <ChevronLeft className="w-4 h-4" />
            }
          </Button>

          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.current
            
            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isCollapsed && !isMobile ? "justify-center" : ""
                )}
                title={isCollapsed && !isMobile ? item.name : ''}
              >
                <Icon className={cn(
                  "flex-shrink-0 w-5 h-5 transition-colors duration-200",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
                  isCollapsed && !isMobile ? "" : "mr-3"
                )} />
                
                {/* Text Label */}
                <span className={cn(
                  "truncate transition-all duration-200",
                  isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}>
                  {item.name}
                </span>

                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className={cn(
                    "ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center transition-all duration-200",
                    isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className={cn(
            "flex items-center space-x-3 transition-all duration-200",
            isCollapsed && !isMobile ? "justify-center" : ""
          )}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className={cn(
              "flex-1 min-w-0 transition-all duration-200",
              isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-1.5 text-gray-400 hover:text-gray-600 transition-all duration-200",
                isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop layout */}
      <div className={cn(
        "hidden lg:block transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60"
      )} />
    </>
  )
}

// Example usage component
export function SidebarExample() {
  const [activeItem, setActiveItem] = useState('Dashboard')

  const handleItemClick = (item: SidebarItem) => {
    console.log('Clicked:', item.name)
    setActiveItem(item.name)
  }

  const itemsWithActive = defaultItems.map(item => ({
    ...item,
    current: item.name === activeItem
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveSidebar 
        items={itemsWithActive}
        onItemClick={handleItemClick}
        user={{
          name: 'John Doe',
          email: 'john@example.com',
          avatar: undefined
        }}
      />
      
      {/* Main Content */}
      <main className="lg:ml-0 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {activeItem}
            </h1>
            <p className="text-gray-600 mb-6">
              This is the main content area. The sidebar will automatically adjust based on screen size.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Card {i}</h3>
                  <p className="text-sm text-gray-600">
                    Sample content for demonstration purposes.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}