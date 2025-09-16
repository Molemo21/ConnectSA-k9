"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Search, UserPlus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export function ModernHeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Floating particles for ambiance - fewer on mobile */}
      <div className="absolute inset-0 overflow-hidden z-10">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 
            className={`text-4xl md:text-5xl font-bold text-white transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              lineHeight: '1.2',
              letterSpacing: '0.025em'
            }}
          >
            Bringing <span className="font-bold">trusted professionals</span> to your doorstep
          </h1>

          {/* Subheadline - Mobile First */}
          <p 
            className={`text-base xs:text-lg sm:text-xl md:text-2xl text-gray-200 mt-3 sm:mt-4 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            Verified experts ready to help, while you relax at home.{" "}
            <Link 
              href="/signup" 
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 sm:underline-offset-4 hover:underline-offset-4 sm:hover:underline-offset-8 transition-all duration-300 font-medium text-sm xs:text-base sm:text-lg md:text-xl"
            >
              Get Started
            </Link>
          </p>

          {/* CTA Buttons - Mobile First */}
          <div 
            className={`mt-4 sm:mt-6 flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center items-center transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Primary CTA */}
            <Button
              size="lg"
              className="w-full xs:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group text-sm sm:text-base"
              asChild
            >
              <Link href="/book-service">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Book a Service
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            {/* Secondary CTA */}
            <Button
              variant="outline"
              size="lg"
              className="w-full xs:w-auto bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group text-sm sm:text-base"
              asChild
            >
              <Link href="/become-provider">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Become a Provider
              </Link>
            </Button>
          </div>

          {/* Trust Badge - Mobile First */}
          <div 
            className={`mt-4 sm:mt-6 text-xs sm:text-sm text-gray-300 flex items-center gap-2 justify-center transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
            <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              100% Verified Providers
            </span>
          </div>
        </div>
      </div>

      {/* Decorative elements - hidden on very small screens */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 z-20 hidden xs:block">
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-2 sm:h-3 bg-white/50 rounded-full mt-1 sm:mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  )
}
