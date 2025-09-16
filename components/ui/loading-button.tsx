"use client"

import React from "react"
import { Button } from "./button"
import { CircularLoader } from "./circular-loader"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  loaderColor?: "black" | "white" | "blue" | "gray"
  loaderSize?: "sm" | "md" | "lg"
  size?: "sm" | "md" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function LoadingButton({ 
  loading = false, 
  loadingText, 
  children, 
  loaderColor = "white",
  loaderSize = "sm",
  size,
  variant,
  className = "",
  disabled,
  ...props 
}: LoadingButtonProps) {
  const isDisabled = disabled || loading

  const getLoaderSize = () => {
    switch (size) {
      case "sm": return "sm"
      case "md": return "md" 
      case "lg": return "lg"
      case "icon": return "sm"
      default: return "sm"
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
      size={size}
      variant={variant}
      disabled={isDisabled}
      className={`relative ${className}`}
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
