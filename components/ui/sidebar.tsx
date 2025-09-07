"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Menu, X, ChevronLeft, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  children: React.ReactNode
  className?: string
  defaultCollapsed?: boolean
}

export function Sidebar({ children, className, defaultCollapsed = false }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      if (mobile) {
        setIsCollapsed(false) // Always expanded on mobile when open
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300 ease-in-out",
          // Mobile styles
          isMobile ? `w-60 ${mobileTransform}` : 
          // Desktop styles
          `${sidebarWidth} translate-x-0`,
          className
        )}
      >
        {/* Desktop Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 z-10",
            "transition-all duration-200"
          )}
        >
          {isCollapsed ? 
            <ChevronRight className="w-3 h-3" /> : 
            <ChevronLeft className="w-3 h-3" />
          }
        </Button>

        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1.5"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {typeof children === 'function' ? 
            children({ isCollapsed: isCollapsed && !isMobile, isMobile, closeSidebar: () => setIsOpen(false) }) : 
            children
          }
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

// Sidebar components for composition
export function SidebarHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex items-center justify-between h-16 px-4 border-b border-gray-200", className)}>
      {children}
    </div>
  )
}

export function SidebarContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex-1 px-3 py-4 space-y-1 overflow-y-auto", className)}>
      {children}
    </div>
  )
}

export function SidebarFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("p-4 border-t border-gray-200", className)}>
      {children}
    </div>
  )
}

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  active?: boolean
  badge?: number
  onClick?: () => void
  href?: string
  isCollapsed?: boolean
  className?: string
}

export function SidebarItem({ 
  icon: Icon, 
  children, 
  active = false, 
  badge, 
  onClick, 
  href, 
  isCollapsed = false,
  className 
}: SidebarItemProps) {
  const Component = href ? 'a' : 'button'
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative",
        active
          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        isCollapsed ? "justify-center" : "",
        className
      )}
      title={isCollapsed ? children?.toString() : ''}
    >
      <Icon className={cn(
        "flex-shrink-0 w-5 h-5 transition-colors duration-200",
        active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
        isCollapsed ? "" : "mr-3"
      )} />
      
      {/* Text Label */}
      <span className={cn(
        "truncate transition-all duration-200",
        isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
      )}>
        {children}
      </span>

      {/* Badge */}
      {badge && badge > 0 && (
        <span className={cn(
          "ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center transition-all duration-200",
          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Component>
  )
}