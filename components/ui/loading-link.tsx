"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"

interface LoadingLinkProps {
  href: string
  children: React.ReactNode
  loading?: boolean
  onClick?: () => void
  className?: string
  loadingText?: string
  external?: boolean // For external links (social media, etc.)
}

export function LoadingLink({ 
  href, 
  children, 
  loading = false,
  onClick,
  className = "",
  loadingText = "Loading...",
  external = false
}: LoadingLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const pathname = usePathname()
  const previousPathnameRef = useRef<string>(pathname)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Detect navigation completion for internal links
  useEffect(() => {
    if (!external && pathname !== previousPathnameRef.current && isNavigating) {
      // Navigation completed
      const timer = setTimeout(() => {
        setIsNavigating(false)
        setIsClicked(false)
      }, 100)
      previousPathnameRef.current = pathname
      return () => clearTimeout(timer)
    }
    previousPathnameRef.current = pathname
  }, [pathname, isNavigating, external])
  
  const handleClick = (e: React.MouseEvent) => {
    // Prevent action if already loading or navigating
    if (loading || isNavigating || isClicked) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Immediately set states to prevent double-clicks
    setIsClicked(true)
    setIsNavigating(true)
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Call onClick handler
    onClick?.()
    
    // For external links, reset after navigation starts
    if (external) {
      timeoutRef.current = setTimeout(() => {
        setIsNavigating(false)
        setIsClicked(false)
      }, 1000)
    } else {
      // For internal links, navigation completion is tracked via pathname change
      // Fallback timeout in case navigation doesn't complete
      timeoutRef.current = setTimeout(() => {
        setIsNavigating(false)
        setIsClicked(false)
      }, 5000)
    }
  }

  const isCurrentlyLoading = loading || isNavigating || isClicked

  return (
    <Link 
      href={href}
      onClick={handleClick}
      className={`
        ${className} 
        ${isCurrentlyLoading ? 'opacity-75 cursor-not-allowed pointer-events-none' : ''} 
        transition-all duration-200
        ${isClicked ? 'scale-95' : ''}
      `.trim().replace(/\s+/g, ' ')}
      aria-busy={isCurrentlyLoading}
      aria-disabled={isCurrentlyLoading}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {isCurrentlyLoading ? (
        <span className="flex items-center space-x-2">
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </Link>
  )
}



