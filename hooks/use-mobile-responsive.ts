"use client"

import { useState, useEffect, useCallback } from 'react'

interface UseMobileResponsiveOptions {
  breakpoint?: number
  enableTouchDetection?: boolean
  enableViewportTracking?: boolean
  enableOrientationTracking?: boolean
}

interface MobileResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  isLandscape: boolean
  isPortrait: boolean
  viewportWidth: number
  viewportHeight: number
  orientation: 'landscape' | 'portrait'
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function useMobileResponsive(options: UseMobileResponsiveOptions = {}) {
  const {
    breakpoint = 768,
    enableTouchDetection = true,
    enableViewportTracking = true,
    enableOrientationTracking = true
  } = options

  const [state, setState] = useState<MobileResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouch: false,
    isLandscape: false,
    isPortrait: false,
    viewportWidth: 0,
    viewportHeight: 0,
    orientation: 'portrait',
    breakpoint: 'md'
  })

  // Detect touch capability
  const detectTouch = useCallback(() => {
    if (!enableTouchDetection) return false
    
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }
    return false
  }, [enableTouchDetection])

  // Get current breakpoint
  const getBreakpoint = useCallback((width: number): MobileResponsiveState['breakpoint'] => {
    if (width < 475) return 'xs'
    if (width < 640) return 'sm'
    if (width < 768) return 'md'
    if (width < 1024) return 'lg'
    if (width < 1280) return 'xl'
    return '2xl'
  }, [])

  // Update state based on current conditions
  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const isTouch = detectTouch()
    const isLandscape = width > height
    const isPortrait = height > width
    const breakpoint = getBreakpoint(width)

    setState({
      isMobile: width < 768,
      isTablet: width >= 640 && width < 1024,
      isDesktop: width >= 1024,
      isTouch,
      isLandscape,
      isPortrait,
      viewportWidth: width,
      viewportHeight: height,
      orientation: isLandscape ? 'landscape' : 'portrait',
      breakpoint
    })
  }, [breakpoint, detectTouch, getBreakpoint])

  // Initialize state
  useEffect(() => {
    updateState()

    if (enableViewportTracking) {
      window.addEventListener('resize', updateState)
      window.addEventListener('orientationchange', updateState)
    }

    return () => {
      if (enableViewportTracking) {
        window.removeEventListener('resize', updateState)
        window.removeEventListener('orientationchange', updateState)
      }
    }
  }, [updateState, enableViewportTracking])

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableTouchDetection) return
    // Handle touch start if needed
  }, [enableTouchDetection])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enableTouchDetection) return
    // Handle touch move if needed
  }, [enableTouchDetection])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enableTouchDetection) return
    // Handle touch end if needed
  }, [enableTouchDetection])

  // Add touch event listeners
  useEffect(() => {
    if (!enableTouchDetection || typeof window === 'undefined') return

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enableTouchDetection, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Utility functions
  const isBreakpoint = useCallback((targetBreakpoint: MobileResponsiveState['breakpoint']) => {
    return state.breakpoint === targetBreakpoint
  }, [state.breakpoint])

  const isBreakpointOrAbove = useCallback((targetBreakpoint: MobileResponsiveState['breakpoint']) => {
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(state.breakpoint)
    const targetIndex = breakpointOrder.indexOf(targetBreakpoint)
    return currentIndex >= targetIndex
  }, [state.breakpoint])

  const isBreakpointOrBelow = useCallback((targetBreakpoint: MobileResponsiveState['breakpoint']) => {
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(state.breakpoint)
    const targetIndex = breakpointOrder.indexOf(targetBreakpoint)
    return currentIndex <= targetIndex
  }, [state.breakpoint])

  // Responsive class helpers
  const getResponsiveClasses = useCallback((classes: Record<string, string>) => {
    const result: string[] = []
    
    Object.entries(classes).forEach(([breakpoint, className]) => {
      if (breakpoint === 'default') {
        result.push(className)
      } else if (isBreakpointOrAbove(breakpoint as MobileResponsiveState['breakpoint'])) {
        result.push(className)
      }
    })
    
    return result.join(' ')
  }, [isBreakpointOrAbove])

  // Touch gesture detection
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)
    
    if (isHorizontalSwipe) {
      if (Math.abs(distanceX) > minSwipeDistance) {
        if (distanceX > 0) {
          // Swiped left
          return 'left'
        } else {
          // Swiped right
          return 'right'
        }
      }
    } else {
      if (Math.abs(distanceY) > minSwipeDistance) {
        if (distanceY > 0) {
          // Swiped up
          return 'up'
        } else {
          // Swiped down
          return 'down'
        }
      }
    }
    
    return null
  }, [touchStart, touchEnd])

  // Responsive media query helpers
  const useMediaQuery = useCallback((query: string) => {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
      if (typeof window === 'undefined') return

      const media = window.matchMedia(query)
      if (media.matches !== matches) {
        setMatches(media.matches)
      }

      const listener = () => setMatches(media.matches)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }, [matches, query])

    return matches
  }, [])

  // Common media queries
  const isMobileQuery = useMediaQuery('(max-width: 767px)')
  const isTabletQuery = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktopQuery = useMediaQuery('(min-width: 1024px)')

  return {
    ...state,
    isBreakpoint,
    isBreakpointOrAbove,
    isBreakpointOrBelow,
    getResponsiveClasses,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    useMediaQuery,
    isMobileQuery,
    isTabletQuery,
    isDesktopQuery
  }
}

// Hook for detecting if element is in viewport
export function useInViewport(options: IntersectionObserverInit = {}) {
  const [isInViewport, setIsInViewport] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInViewport(entry.isIntersecting)
    }, {
      threshold: 0.1,
      ...options
    })

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return { isInViewport, setRef }
}

// Hook for detecting scroll direction
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let ticking = false

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY

      if (Math.abs(currentScrollY - scrollY) < 10) {
        ticking = false
        return
      }

      setScrollDirection(currentScrollY > scrollY ? 'down' : 'up')
      setScrollY(currentScrollY > 0 ? currentScrollY : 0)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll)

    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollY])

  return scrollDirection
}

// Hook for detecting device orientation changes
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}
