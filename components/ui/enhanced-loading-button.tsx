"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"

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
  const handleClick = (e: React.MouseEvent) => {
    if (loading) {
      e.preventDefault()
      return
    }
    onClick?.()
  }

  const buttonContent = loading ? (
    <div className="flex items-center space-x-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{loadingText}</span>
    </div>
  ) : (
    children
  )

  if (href && !loading) {
    return (
      <Button
        className={`${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
        disabled={disabled || loading}
        variant={variant}
        size={size}
        asChild
      >
        <Link href={href}>
          {buttonContent}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      className={`${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      onClick={handleClick}
    >
      {buttonContent}
    </Button>
  )
}



