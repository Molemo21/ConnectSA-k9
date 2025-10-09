"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface ScrollParallaxSectionProps {
  imageSrc: string
  title: string
  subtitle: string
  className?: string
}

export function ScrollParallaxSection({ 
  imageSrc, 
  title, 
  subtitle, 
  className = "" 
}: ScrollParallaxSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Transform values for parallax effect
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 1, 0.8])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -10% 0px"
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  return (
    <section 
      ref={containerRef}
      className={`relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-screen overflow-hidden ${className}`}
    >
      {/* Parallax Background Image */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          y,
          scale,
          opacity
        }}
      >
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${imageSrc}')`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-6xl mx-auto">
          {title && subtitle && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ 
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 50
              }}
              transition={{ 
                duration: 1, 
                delay: 0.3,
                ease: "easeOut"
              }}
              className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-xl"
            >
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: isVisible ? 1 : 0,
                  y: isVisible ? 0 : 30
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.5,
                  ease: "easeOut"
                }}
              >
                {title}
              </motion.h2>
              
              <motion.p 
                className="text-gray-300 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: isVisible ? 1 : 0,
                  y: isVisible ? 0 : 30
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.7,
                  ease: "easeOut"
                }}
              >
                {subtitle}
              </motion.p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll indicator - Hidden on mobile */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <span className="text-white/70 text-sm">Scroll</span>
        </div>
      </motion.div>
    </section>
  )
}
