"use client"

import { useEffect, useState } from "react"

export function ScrollProgressIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (!mounted) return
    
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      setScrollProgress(scrollPercent)
    }

    window.addEventListener('scroll', updateScrollProgress)
    return () => window.removeEventListener('scroll', updateScrollProgress)
  }, [mounted])

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return <div className="scroll-progress" style={{ width: '0%' }} />
  }

  return (
    <div 
      className="scroll-progress"
      style={{ width: `${scrollProgress}%` }}
    />
  )
}



