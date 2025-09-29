"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface LoadingLinkProps {
  href: string
  children: React.ReactNode
  loading?: boolean
  onClick?: () => void
  className?: string
  loadingText?: string
}

export function LoadingLink({ 
  href, 
  children, 
  loading = false,
  onClick,
  className = "",
  loadingText = "Loading..."
}: LoadingLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false)
  
  const handleClick = (e: React.MouseEvent) => {
    if (loading || isNavigating) {
      e.preventDefault()
      return
    }
    
    setIsNavigating(true)
    onClick?.()
    
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false)
    }, 2000)
  }

  const isCurrentlyLoading = loading || isNavigating

  return (
    <Link 
      href={href}
      onClick={handleClick}
      className={`${className} ${isCurrentlyLoading ? 'opacity-75 cursor-not-allowed' : ''} transition-all duration-200`}
    >
      {isCurrentlyLoading ? (
        <span className="flex items-center space-x-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </Link>
  )
}



