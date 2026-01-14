"use client"

import React from "react"

interface CustomSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export function CustomSpinner({ size = "md", color = "#000000", className = "" }: CustomSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-9 h-9", 
    lg: "w-12 h-12"
  }

  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`}>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
      <div style={{ background: color }}></div>
    </div>
  )
}

























































