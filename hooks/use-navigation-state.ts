"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface UseNavigationStateOptions {
  timeout?: number // Timeout in milliseconds to prevent stuck states
  debounceMs?: number // Debounce delay for rapid clicks (default: 100ms for better responsiveness)
}

interface UseNavigationStateReturn {
  isNavigating: boolean
  navigate: (href: string, options?: { replace?: boolean }) => Promise<void>
  cancelNavigation: () => void
}

/**
 * Hook to track navigation state in Next.js App Router
 * Provides navigation state management with timeout protection and debouncing
 * 
 * @example
 * const { isNavigating, navigate } = useNavigationState()
 * await navigate('/dashboard')
 */
export function useNavigationState(
  options: UseNavigationStateOptions = {}
): UseNavigationStateReturn {
  const { timeout = 5000, debounceMs = 100 } = options
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const previousPathnameRef = useRef<string | null>(null)
  const navigationStartRef = useRef<number | null>(null)

  // Initialize previous pathname on mount
  useEffect(() => {
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname
    }
  }, [pathname])

  // Detect when navigation completes by watching pathname changes
  useEffect(() => {
    // If pathname changed and we were navigating, navigation completed
    if (previousPathnameRef.current !== null && pathname !== previousPathnameRef.current && isNavigating) {
      // Small delay to ensure navigation is fully complete
      const completeTimer = setTimeout(() => {
        setIsNavigating(false)
        navigationStartRef.current = null
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }, 100)

      previousPathnameRef.current = pathname
      return () => clearTimeout(completeTimer)
    }

    // Update previous pathname if not navigating
    if (!isNavigating) {
      previousPathnameRef.current = pathname
    }
  }, [pathname, isNavigating])

  // Timeout fallback to prevent stuck states
  useEffect(() => {
    if (isNavigating && navigationStartRef.current) {
      const elapsed = Date.now() - navigationStartRef.current
      const remaining = timeout - elapsed

      if (remaining > 0) {
        timeoutRef.current = setTimeout(() => {
          console.warn('Navigation timeout - clearing stuck state')
          setIsNavigating(false)
          navigationStartRef.current = null
        }, remaining)
      } else {
        // Already timed out
        setIsNavigating(false)
        navigationStartRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isNavigating, timeout])

  const navigate = useCallback(
    async (href: string, navOptions?: { replace?: boolean }): Promise<void> => {
      // Prevent navigation if already navigating
      if (isNavigating) {
        return
      }

      // Clear any existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      // Check if we're navigating to the same path
      if (href === pathname) {
        return
      }

      // Start navigation immediately (no debounce for better UX)
      setIsNavigating(true)
      navigationStartRef.current = Date.now()

      try {
        // Use Next.js router for navigation
        if (navOptions?.replace) {
          router.replace(href)
        } else {
          router.push(href)
        }
      } catch (error) {
        console.error('Navigation error:', error)
        setIsNavigating(false)
        navigationStartRef.current = null
      }
    },
    [isNavigating, pathname, router]
  )

  const cancelNavigation = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setIsNavigating(false)
    navigationStartRef.current = null
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isNavigating,
    navigate,
    cancelNavigation,
  }
}

