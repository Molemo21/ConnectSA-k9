"use client"

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigationState } from './use-navigation-state'

interface UseButtonNavigationOptions {
  clearOnNavigation?: boolean // Clear loading states when navigation completes
}

interface UseButtonNavigationReturn {
  handleNavigation: (href: string, buttonId?: string) => Promise<void>
  isNavigating: boolean
  buttonLoading: string | null
  setButtonLoading: (buttonId: string | null) => void
  clearButtonLoading: () => void
}

/**
 * Hook for managing button navigation with loading states
 * Provides a simple interface for buttons to handle navigation with loading feedback
 * 
 * @example
 * const { handleNavigation, buttonLoading } = useButtonNavigation()
 * 
 * <Button 
 *   onClick={() => handleNavigation('/dashboard', 'dashboardBtn')}
 *   loading={buttonLoading === 'dashboardBtn'}
 * >
 *   Go to Dashboard
 * </Button>
 */
export function useButtonNavigation(
  options: UseButtonNavigationOptions = {}
): UseButtonNavigationReturn {
  const { clearOnNavigation = true } = options
  const { navigate, isNavigating } = useNavigationState()
  const [buttonLoading, setButtonLoading] = useState<string | null>(null)
  const pathname = usePathname()
  const previousPathnameRef = useRef<string>(pathname)

  // Clear button loading when navigation completes
  useEffect(() => {
    if (clearOnNavigation && pathname !== previousPathnameRef.current && buttonLoading) {
      // Navigation completed - clear loading state
      const timer = setTimeout(() => {
        setButtonLoading(null)
      }, 100)
      previousPathnameRef.current = pathname
      return () => clearTimeout(timer)
    }
    previousPathnameRef.current = pathname
  }, [pathname, buttonLoading, clearOnNavigation])

  const handleNavigation = async (href: string, buttonId?: string): Promise<void> => {
    // Prevent navigation if already navigating
    if (isNavigating) {
      return
    }

    // Set loading state immediately
    if (buttonId) {
      setButtonLoading(buttonId)
    }

    try {
      // Use navigation hook for navigation
      await navigate(href)
      
      // Loading state will be cleared by pathname change (via useEffect above)
      // Set fallback timeout in case navigation doesn't complete
      if (buttonId) {
        setTimeout(() => {
          setButtonLoading((current) => current === buttonId ? null : current)
        }, 6000)
      }
    } catch (error) {
      console.error('Navigation error:', error)
      if (buttonId) {
        setButtonLoading(null)
      }
    }
  }

  const clearButtonLoading = () => {
    setButtonLoading(null)
  }

  return {
    handleNavigation,
    isNavigating,
    buttonLoading,
    setButtonLoading,
    clearButtonLoading,
  }
}


