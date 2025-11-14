"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface LoadingButtonProps {
  children: React.ReactNode
  loading?: boolean
  onClick?: () => void
  href?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
  loadingText?: string
}

export function LoadingButton({ 
  children, 
  loading = false,
  onClick, 
  href, 
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  loadingText = "Loading..."
}: LoadingButtonProps) {
  const [isClicked, setIsClicked] = useState(false)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDisabled = disabled || loading || isClicked

  const handleClick = (e: React.MouseEvent) => {
    // Prevent action if already loading or disabled
    if (isDisabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Immediately disable button to prevent double-clicks
    setIsClicked(true)
    
    // Clear any existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    // Call onClick handler
    onClick?.()

    // Reset clicked state after a short delay (fallback if loading doesn't clear)
    clickTimeoutRef.current = setTimeout(() => {
      setIsClicked(false)
    }, 2000)
  }

  // Reset clicked state when loading completes
  useEffect(() => {
    if (!loading && isClicked) {
      const timer = setTimeout(() => {
        setIsClicked(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, isClicked])

  const buttonContent = loading ? (
    <div className="flex items-center space-x-2">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span>{loadingText}</span>
    </div>
  ) : (
    children
  )

  const buttonClassName = `
    ${className} 
    ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''} 
    ${isClicked && !loading ? 'scale-95' : ''}
    transition-all duration-200
    relative overflow-hidden
  `.trim().replace(/\s+/g, ' ')

  // For buttons with href, use Link component
  if (href) {
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // If disabled or loading, prevent navigation
      if (isDisabled) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // If onClick handler is provided, use it instead of default Link behavior
      if (onClick) {
        e.preventDefault()
        e.stopPropagation()
        
        // Immediately disable button to prevent double-clicks
        setIsClicked(true)
        
        // Clear any existing timeout
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current)
        }

        // Call onClick handler (which should handle navigation)
        onClick()

        // Reset clicked state after a delay (fallback)
        clickTimeoutRef.current = setTimeout(() => {
          setIsClicked(false)
        }, 2000)
      }
      // If no onClick, let Link handle navigation normally
    }

    return (
      <Button
        className={buttonClassName}
        disabled={isDisabled}
        variant={variant}
        size={size}
        asChild
        aria-busy={loading}
        aria-disabled={isDisabled}
      >
        <Link 
          href={href}
          onClick={handleLinkClick}
          className={isDisabled ? 'pointer-events-none' : ''}
        >
          {buttonContent}
        </Link>
      </Button>
    )
  }

  // For buttons without href, use button element
  return (
    <Button
      className={buttonClassName}
      disabled={isDisabled}
      variant={variant}
      size={size}
      onClick={handleClick}
      aria-busy={loading}
      aria-disabled={isDisabled}
    >
      {buttonContent}
    </Button>
  )
}



