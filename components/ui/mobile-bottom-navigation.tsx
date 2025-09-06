"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Search, 
  Calendar, 
  User, 
  Settings,
  Briefcase,
  BarChart3,
  Bell,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: string[]
}

interface MobileBottomNavigationProps {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
}

export function MobileBottomNavigation({ user }: MobileBottomNavigationProps) {
  const pathname = usePathname()
  
  // Define navigation items based on user role
  const getNavigationItems = (): BottomNavItem[] => {
    if (!user) {
      return [
        { href: '/', label: 'Home', icon: Home },
        { href: '/search', label: 'Search', icon: Search },
        { href: '/login', label: 'Login', icon: User },
      ]
    }

    if (user.role === 'CLIENT') {
      return [
        { href: '/dashboard', label: 'Home', icon: Home },
        { href: '/search', label: 'Search', icon: Search },
        { href: '/bookings', label: 'Bookings', icon: Calendar },
        { href: '/profile', label: 'Profile', icon: User },
      ]
    }

    if (user.role === 'PROVIDER') {
      return [
        { href: '/provider/dashboard', label: 'Dashboard', icon: BarChart3 },
        { href: '/provider/bookings', label: 'Bookings', icon: Calendar },
        { href: '/provider/services', label: 'Services', icon: Briefcase },
        { href: '/provider/profile', label: 'Profile', icon: User },
      ]
    }

    if (user.role === 'ADMIN') {
      return [
        { href: '/admin', label: 'Dashboard', icon: BarChart3 },
        { href: '/admin/providers', label: 'Providers', icon: Briefcase },
        { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
      ]
    }

    return []
  }

  const navigationItems = getNavigationItems()

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/provider/dashboard' || href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 sm:hidden z-50">
      <div className="flex items-center justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center space-y-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200 min-w-0 flex-1',
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'w-5 h-5',
                  active ? 'text-blue-600' : 'text-gray-500'
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'truncate max-w-full',
                active ? 'text-blue-600' : 'text-gray-500'
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

// Floating Action Button for mobile
interface MobileFABProps {
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export function MobileFAB({ 
  onClick, 
  icon: Icon, 
  label, 
  position = 'bottom-right' 
}: MobileFABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 p-4 sm:hidden',
        positionClasses[position]
      )}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
    </button>
  )
}

// Mobile header component
interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
  rightAction?: React.ReactNode
}

export function MobileHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  onBackClick,
  rightAction 
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 sm:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {rightAction && (
          <div className="flex-shrink-0">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  )
}

// Mobile page wrapper
interface MobilePageWrapperProps {
  children: React.ReactNode
  showBottomNav?: boolean
  showHeader?: boolean
  headerTitle?: string
  headerSubtitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function MobilePageWrapper({
  children,
  showBottomNav = true,
  showHeader = false,
  headerTitle,
  headerSubtitle,
  showBackButton = false,
  onBackClick,
  rightAction,
  className
}: MobilePageWrapperProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {showHeader && (
        <MobileHeader
          title={headerTitle || ''}
          subtitle={headerSubtitle}
          showBackButton={showBackButton}
          onBackClick={onBackClick}
          rightAction={rightAction}
        />
      )}
      
      <main className={cn(
        'pb-20', // Space for bottom navigation
        showHeader ? 'pt-0' : 'pt-4'
      )}>
        {children}
      </main>
      
      {showBottomNav && (
        <MobileBottomNavigation user={null} />
      )}
    </div>
  )
}
