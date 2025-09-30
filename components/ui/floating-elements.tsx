"use client"

import { useEffect, useState } from "react"

interface FloatingElementProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FloatingElement({ 
  children, 
  delay = 0, 
  duration = 6, 
  className = "" 
}: FloatingElementProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      {children}
    </div>
  )
}

export function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Reduced floating particles for better performance */}
      {[...Array(8)].map((_, i) => (
        <FloatingElement
          key={i}
          delay={Math.random() * 3}
          duration={6 + Math.random() * 2}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${3 + Math.random() * 3}px`,
            height: `${3 + Math.random() * 3}px`,
            background: `linear-gradient(45deg, 
              ${i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#06b6d4'}, 
              ${i % 3 === 0 ? '#1d4ed8' : i % 3 === 1 ? '#7c3aed' : '#0891b2'})`,
            borderRadius: '50%',
            opacity: 0.2 + Math.random() * 0.3
          }}
        />
      ))}
      
      {/* Reduced floating geometric shapes */}
      {[...Array(4)].map((_, i) => (
        <FloatingElement
          key={`shape-${i}`}
          delay={Math.random() * 2}
          duration={8 + Math.random() * 2}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${15 + Math.random() * 25}px`,
            height: `${15 + Math.random() * 25}px`,
            background: `linear-gradient(135deg, 
              ${i % 4 === 0 ? '#3b82f6' : i % 4 === 1 ? '#8b5cf6' : i % 4 === 2 ? '#06b6d4' : '#10b981'}, 
              transparent)`,
            borderRadius: i % 2 === 0 ? '50%' : '20%',
            opacity: 0.05 + Math.random() * 0.15,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  )
}
