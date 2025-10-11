"use client"

import { Button } from "@/components/ui/button"
import { LoadingButton as EnhancedButton } from "@/components/ui/enhanced-loading-button"
import { CheckCircle, Search, UserPlus, ArrowRight, Hammer } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/LanguageContext"

interface ModernHeroSectionProps {
  bookServiceLoading?: boolean
  becomeProviderLoading?: boolean
  getStartedLoading?: boolean
  onBookServiceClick?: () => void
  onBecomeProviderClick?: () => void
  onGetStartedClick?: () => void
  showGetStarted?: boolean
  isUnderConstruction?: boolean
}

export function ModernHeroSection({ 
  bookServiceLoading = false, 
  becomeProviderLoading = false,
  getStartedLoading = false,
  onBookServiceClick,
  onBecomeProviderClick,
  onGetStartedClick,
  showGetStarted = true,
  isUnderConstruction = false
}: ModernHeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useLanguage()

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
          {isUnderConstruction ? (
            /* Construction Mode Content */
            <>
              {/* Construction Icon */}
              <div 
                className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl mb-8 mx-auto animate-pulse transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <Hammer className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>

              {/* Construction Title */}
              <h1 
                className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white transition-all duration-1000 delay-200 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  lineHeight: '1.2',
                  letterSpacing: '0.025em'
                }}
              >
                Platform Under Maintenance
              </h1>

              {/* Construction Subtitle */}
              <p 
                className={`text-base xs:text-lg sm:text-xl md:text-2xl text-gray-200 mt-4 sm:mt-6 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                We're working hard to bring you an amazing experience. 
                Our platform will be launching soon with exciting new features!
              </p>

              {/* Contact Info */}
              <div 
                className={`mt-6 sm:mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 max-w-md mx-auto transition-all duration-1000 delay-600 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <p className="text-gray-300 text-sm sm:text-base mb-3">Stay updated:</p>
                <p className="text-blue-400 font-medium text-sm sm:text-base">
                  support@proliinkconnect.co.za
                </p>
                <p className="text-blue-400 font-medium text-sm sm:text-base">
                  +27 68 947 6401
                </p>
              </div>

              {/* Admin Toggle Hint */}
              <div 
                className={`mt-6 text-xs text-gray-500 transition-all duration-1000 delay-800 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <p>Press <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Ctrl+Shift+C</kbd> to toggle maintenance mode</p>
              </div>
            </>
          ) : (
            /* Normal Content */
            <>
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
                {t('hero.title')}
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
                {t('hero.subtitle')}{" "}
                {showGetStarted && (
                  <button 
                    onClick={onGetStartedClick}
                    disabled={getStartedLoading}
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 sm:underline-offset-4 hover:underline-offset-4 sm:hover:underline-offset-8 transition-all duration-300 font-medium text-sm xs:text-base sm:text-lg md:text-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-400"
                  >
                    {getStartedLoading ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      t('hero.getStarted')
                    )}
                  </button>
                )}
              </p>

              {/* CTA Buttons - Mobile First */}
              <div 
                className={`mt-4 sm:mt-6 flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center items-center transition-all duration-1000 delay-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {/* Primary CTA */}
                <EnhancedButton
                  size="lg"
                  className="w-full xs:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group text-sm sm:text-base"
                  href="/book-service"
                  loading={bookServiceLoading}
                  loadingText="Booking..."
                  onClick={onBookServiceClick}
                  disabled={bookServiceLoading}
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('hero.bookService')}
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </EnhancedButton>

                {/* Secondary CTA */}
                <EnhancedButton
                  variant="outline"
                  size="lg"
                  className="w-full xs:w-auto bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group text-sm sm:text-base"
                  href="/become-provider"
                  loading={becomeProviderLoading}
                  loadingText="Loading..."
                  onClick={onBecomeProviderClick}
                  disabled={becomeProviderLoading}
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('hero.becomeProvider')}
                </EnhancedButton>
              </div>

              {/* Trust Badge - Mobile First */}
              <div 
                className={`mt-4 sm:mt-6 text-xs sm:text-sm text-gray-300 flex items-center gap-2 justify-center transition-all duration-1000 delay-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  {t('hero.trustBadge')}
                </span>
              </div>
            </>
          )}
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
