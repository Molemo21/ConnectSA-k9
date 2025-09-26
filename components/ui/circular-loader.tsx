"use client"

import React from "react"

interface CircularLoaderProps {
  size?: "sm" | "md" | "lg"
  color?: "black" | "white" | "blue" | "gray"
  className?: string
}

export function CircularLoader({ 
  size = "md", 
  color = "black", 
  className = "" 
}: CircularLoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  }

  const colorClasses = {
    black: "border-black border-transparent",
    white: "border-white border-transparent", 
    blue: "border-blue-600 border-transparent",
    gray: "border-gray-400 border-transparent"
  }

  return (
    <div 
      className={`loader ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}










