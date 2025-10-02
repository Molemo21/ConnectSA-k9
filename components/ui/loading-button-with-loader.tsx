"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { CircularLoader } from "@/components/ui/circular-loader"
import { cn } from "@/lib/utils"

interface LoadingButtonWithLoaderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  loaderColor?: "black" | "white" | "blue" | "gray"
}

export function LoadingButtonWithLoader({
  loading = false,
  loadingText,
  children,
  size = "md",
  variant = "default",
  loaderColor = "white",
  className,
  disabled,
  ...props
}: LoadingButtonWithLoaderProps) {
  const isDisabled = disabled || loading

  const getLoaderSize = () => {
    switch (size) {
      case "sm": return "sm"
      case "md": return "md" 
      case "lg": return "lg"
      default: return "md"
    }
  }

  const getLoaderColor = () => {
    // Auto-detect loader color based on button variant
    if (variant === "outline" || variant === "secondary" || variant === "ghost") {
      return "black"
    }
    return loaderColor
  }

  return (
    <Button
      {...props}
      disabled={isDisabled}
      size={size}
      variant={variant}
      className={cn("relative", className)}
    >
      {loading && (
        <div className="flex items-center justify-center">
          <CircularLoader 
            size={getLoaderSize()} 
            color={getLoaderColor()}
            className="mr-2"
          />
          {loadingText && (
            <span className="ml-1">{loadingText}</span>
          )}
        </div>
      )}
      {!loading && children}
    </Button>
  )
}













