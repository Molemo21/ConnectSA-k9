"use client"

import { motion } from "framer-motion"

interface SkeletonLoaderProps {
  className?: string
  variant?: "text" | "rectangular" | "circular"
  width?: string | number
  height?: string | number
  animation?: "wave" | "pulse"
}

export function SkeletonLoader({ 
  className = "", 
  variant = "rectangular", 
  width = "100%", 
  height = "1rem",
  animation = "wave"
}: SkeletonLoaderProps) {
  const baseClasses = "bg-gray-200 dark:bg-gray-700"
  
  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded",
    circular: "rounded-full"
  }

  const animationClasses = {
    wave: "animate-pulse",
    pulse: "animate-pulse"
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width, height }}
    >
      {animation === "wave" && (
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}
    </motion.div>
  )
}

// Predefined skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <SkeletonLoader variant="rectangular" height="200px" />
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="80%" />
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
  )
}

export function SkeletonButton() {
  return (
    <SkeletonLoader 
      variant="rectangular" 
      height="40px" 
      width="120px" 
      className="rounded-lg"
    />
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader 
          key={i}
          variant="text" 
          width={i === lines - 1 ? "60%" : "100%"} 
        />
      ))}
    </div>
  )
}



