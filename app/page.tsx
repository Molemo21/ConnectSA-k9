"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { 
  Shield,
  Clock,
  Star,
  Wrench,
  Zap,
  SprayCan,
  Paintbrush,
  Flower,
  ArrowRight,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Hammer,
  ChevronLeft,
  Scissors,
  Sparkles,
} from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { LoadingButton as EnhancedButton } from "@/components/ui/enhanced-loading-button"
import { LoadingLink } from "@/components/ui/loading-link"
import { GlobalLoadingOverlay } from "@/components/ui/global-loading-overlay"
import { ModernHeroSection } from "@/components/ui/modern-hero-section"
import { ScrollParallaxSection } from "@/components/ui/scroll-parallax-section"
import { ScrollProgressIndicator } from "@/components/ui/scroll-progress-indicator"
import { FloatingParticles } from "@/components/ui/floating-elements"
import { Footer } from "@/components/ui/footer"
import { useState, useEffect } from "react"
import { useScrollAnimation, useScrollProgress, useScrollToTop } from "@/hooks/use-scroll-animation"
import { motion } from "framer-motion"
import { useLanguage } from "@/contexts/LanguageContext"

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeSplash, setFadeSplash] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string; name: string; role?: string } | null>(null)
  const [isUnderConstruction, setIsUnderConstruction] = useState(false) // Construction mode disabled
  const { t } = useLanguage()

  // Fetch user data with better error handling
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // Don't log 401 errors as they're expected for unauthenticated users
          if (response.status !== 401) {
            console.log("Authentication error:", response.status)
          }
        }
      } catch (error) {
        console.log("User not authenticated")
      }
    }
    
    // Only fetch if not already authenticated
    if (!user) {
      fetchUser()
    }
  }, [user])

  // Keyboard shortcut for construction mode toggle (Ctrl+Shift+C)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        setIsUnderConstruction(prev => !prev)
        console.log('Construction mode toggled:', !isUnderConstruction)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUnderConstruction])
  // Loading states for different buttons
  const [loadingStates, setLoadingStates] = useState({
    bookService: false,
    becomeProvider: false,
    getStarted: false,
    dashboard: false,
    browseServices: false,
    viewAllServices: false,
    scrollLeft: false,
    scrollRight: false,
    scrollLeftDesktop: false,
    scrollRightDesktop: false,
    // Footer links
    footerServices: false,
    footerBookService: false,
    footerBecomeProvider: false,
    footerAbout: false,
    footerDashboard: false,
    footerContact: false,
    // Service category links
    footerHomeServices: false,
    footerBeauty: false,
    footerIT: false,
    footerAutomotive: false,
    footerViewAll: false,
    // Social links
    facebook: false,
    twitter: false,
    instagram: false,
    linkedin: false,
    // Header links
    headerServices: false,
    headerSignIn: false
  })
  const [showGlobalLoader] = useState(false)

  // Scroll animations
  const servicesAnimation = useScrollAnimation({ threshold: 0.2 })
  const howItWorksAnimation = useScrollAnimation({ threshold: 0.2 })
  const testimonialsAnimation = useScrollAnimation({ threshold: 0.3 })
  const scrollProgress = useScrollProgress()
  const { showButton, scrollToTop } = useScrollToTop()

  const handleButtonClick = (buttonKey: keyof typeof loadingStates, action: () => void) => {
    setLoadingStates(prev => ({ ...prev, [buttonKey]: true }))
    
    // Simulate loading time and then execute action
    setTimeout(() => {
      action()
      setLoadingStates(prev => ({ ...prev, [buttonKey]: false }))
    }, 1000) // 1 second loading simulation
  }


  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.sessionStorage.getItem('splashShown')) {
        setShowSplash(false)
        return
      }
      const timer = setTimeout(() => {
        setFadeSplash(true)
        setTimeout(() => {
          setShowSplash(false)
          window.sessionStorage.setItem('splashShown', 'true')
        }, 700)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!showSplash) {
      setTimeout(() => setContentReady(true), 10)
    }
  }, [showSplash])

  const services = [
    { name: "Cleaning", category: "Home Services", price: "From R250", icon: SprayCan, color: "from-green-500 to-green-600", image: "/services/Cleaner%202.jpg", slug: "cleaning" },
    { name: "Hairdressing", category: "Beauty", price: "From R200", icon: Scissors, color: "from-purple-500 to-purple-600", image: "/services/hairdresser.webp", slug: "hairdressing" },
    { name: "Makeup Services", category: "Beauty", price: "From R250", icon: Sparkles, color: "from-pink-500 to-pink-600", image: "/services/makeup.jpg", slug: "makeup" },
    { name: "Plumbing", category: "Home Services", price: "From R300", icon: Wrench, color: "from-blue-500 to-blue-600", image: "/services/Plumber%202.jpg", slug: "plumbing", comingSoon: true },
    { name: "Carpentry", category: "Home Services", price: "From R350", icon: Hammer, color: "from-orange-500 to-orange-600", image: "/services/plank.jpg", slug: "carpentry", comingSoon: true },
  ]

  const whyChooseUs = [
    { icon: Clock, title: t('whyChooseUs.saveTime.title'), description: t('whyChooseUs.saveTime.description') },
    { icon: Shield, title: t('whyChooseUs.guaranteedQuality.title'), description: t('whyChooseUs.guaranteedQuality.description') },
    { icon: MessageSquare, title: t('whyChooseUs.dedicatedSupport.title'), description: t('whyChooseUs.dedicatedSupport.description') },
    { icon: Star, title: t('whyChooseUs.realReviews.title'), description: t('whyChooseUs.realReviews.description') },
  ]

  return (
    <div className={`flex min-h-screen flex-col gradient-bg-dark text-white transition-all duration-700 ${showSplash ? 'opacity-0 blur-sm' : contentReady ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'} ${isUnderConstruction ? 'grayscale pointer-events-none' : ''}`}>
      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator />
      
      {/* Floating Particles */}
      <FloatingParticles />
      {showSplash && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a1626] transition-opacity duration-700 ${fadeSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-6 animate-pulse">
            <span className="text-white font-bold text-4xl">P</span>
          </div>
          <span className={`text-3xl font-bold text-white transition-opacity duration-700 ${fadeSplash ? 'opacity-0' : 'opacity-100'} animate-fade-in-out`}>
            ProLiink Connect
          </span>
        </div>
      )}


      {/* Global Breathing Loader */}
      {showGlobalLoader && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-4 animate-pulse animate-breathe">
              <Image 
                src="/handshake.png" 
                alt="Loading" 
                width={48}
                height={48}
                className="h-12 w-auto filter brightness-0 invert"
              />
            </div>
            <div className="text-white text-lg font-medium animate-pulse">
              Loading...
            </div>
          </div>
        </div>
      )}

      {/* Modern Hero Section with extended background */}
      <div className="relative min-h-screen">
        {/* Background Image that extends to top */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/onboarding.jpg')"
            }}
          />
          {/* Gradient overlay for navbar readability - stronger on mobile */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent sm:from-black/80 sm:via-black/40" />
        </div>

        {/* Navbar with transparent background */}
        <div className="relative z-10">
          <BrandHeaderClient 
            showAuth={true} 
            showUserMenu={false} 
            className="bg-transparent border-none"
            servicesLoading={loadingStates.headerServices}
            signInLoading={loadingStates.headerSignIn}
            onServicesClick={() => handleButtonClick('headerServices', () => {})}
            onSignInClick={() => handleButtonClick('headerSignIn', () => {})}
          />
        </div>

          {/* Hero Content */}
          <div className="relative z-10">
            <ModernHeroSection 
              bookServiceLoading={loadingStates.bookService}
              becomeProviderLoading={loadingStates.becomeProvider}
              getStartedLoading={loadingStates.getStarted}
              dashboardLoading={loadingStates.dashboard}
              onBookServiceClick={() => handleButtonClick('bookService', () => window.location.href = '/book-service')}
              onBecomeProviderClick={() => handleButtonClick('becomeProvider', () => window.location.href = '/become-provider')}
              onGetStartedClick={() => handleButtonClick('getStarted', () => window.location.href = '/signup')}
              onDashboardClick={() => handleButtonClick('dashboard', () => window.location.href = '/dashboard')}
              showGetStarted={!user}
              isUnderConstruction={isUnderConstruction}
              user={user}
            />
          </div>
      </div>

      {/* Modern Services Section - Bolt-Inspired Design */}
      <section 
        ref={servicesAnimation.ref as React.RefObject<HTMLElement>}
        className={`w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-black ${servicesAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        <div className="container px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
                {t('services.title')}
              </h2>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                {t('services.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Services Grid - Show 5 services with horizontal scroll */}
          <div className="relative">
            {/* Scroll container */}
            <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-4 snap-x snap-mandatory scroll-smooth">
              {services.map((service, index) => {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    viewport={{ once: true }}
                    className="group flex-shrink-0 w-72 xs:w-80 sm:w-80 lg:w-96 snap-center"
                  >
                    <Card className={`relative overflow-hidden backdrop-blur-sm border transition-all duration-300 hover:shadow-2xl h-full ${
                      service.comingSoon 
                        ? 'bg-white/5 border-white/10 opacity-60 grayscale hover:opacity-70 hover:grayscale-[0.8]' 
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:scale-105 hover:bg-white/10'
                    }`}>
                      {/* Service Image */}
                      <div className="relative h-48 sm:h-56 overflow-hidden">
                        <Image 
                          src={service.image} 
                          alt={service.name}
                          width={400}
                          height={300}
                          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                            service.comingSoon 
                              ? 'grayscale group-hover:grayscale-[0.8]' 
                              : 'group-hover:scale-110'
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30">
                            {service.category}
                          </span>
                        </div>

                        {/* Coming Soon Badge */}
                        {service.comingSoon && (
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-orange-400/50">
                              Coming Soon
                            </span>
                          </div>
                        )}
            </div>

                      {/* Service Content */}
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <h3 className={`text-lg sm:text-xl font-bold mb-2 transition-colors ${
                              service.comingSoon 
                                ? 'text-gray-400' 
                                : 'text-white group-hover:text-blue-300'
                            }`}>
                              {service.name}
                            </h3>
                            <p className={`text-xs sm:text-sm leading-relaxed ${
                              service.comingSoon ? 'text-gray-500' : 'text-gray-300'
                            }`}>
                              {service.name === "Cleaning" && "Professional cleaning services for your home or office."}
                              {service.name === "Hairdressing" && "Professional hairdressing and styling services."}
                              {service.name === "Makeup Services" && "Professional makeup for all occasions."}
                              {service.name === "Plumbing" && "Professional plumbing services for homes and businesses."}
                              {service.name === "Carpentry" && "Custom woodwork and furniture building services."}
                            </p>
                          </div>

                          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-0">
                            <div className={`font-semibold text-base sm:text-lg ${
                              service.comingSoon ? 'text-gray-400' : 'text-blue-400'
                            }`}>
                              {service.price}
                            </div>
                            <EnhancedButton 
                              size="sm"
                              disabled={service.comingSoon}
                              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${
                                service.comingSoon
                                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:scale-105'
                              }`}
                              onClick={() => handleButtonClick('browseServices', () => window.location.href = `/book-service?service=${service.slug}`)}
                              loading={loadingStates.browseServices}
                              loadingText="Booking..."
                            >
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <span>{service.comingSoon ? 'Coming Soon' : t('services.bookNow')}</span>
                                {!service.comingSoon && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                              </div>
                            </EnhancedButton>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* View All Services Link */}
            <div className="text-center mt-6">
              <LoadingLink 
                href="/services" 
                className="text-blue-400 hover:text-blue-300 hover:underline text-lg font-medium transition-colors duration-300"
                loading={loadingStates.viewAllServices}
                loadingText="Loading Services..."
                onClick={() => handleButtonClick('viewAllServices', () => {})}
              >
                {t('services.viewAllServices')}
              </LoadingLink>
            </div>
          </div>

        </div>
      </section>

      {/* Enhanced Scroll Parallax Section */}
      <ScrollParallaxSection
        imageSrc="/painting.jpg"
        title=""
        subtitle=""
      />

      {/* How It Works - Phone Background with Steps Overlay */}
      <section 
        ref={howItWorksAnimation.ref as React.RefObject<HTMLElement>}
        id="how-it-works" 
        className={`w-full py-12 sm:py-16 md:py-20 lg:py-32 relative overflow-hidden ${howItWorksAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
        style={{
          backgroundImage: "url('/phone.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60" />

        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 md:mb-8 tracking-tight">
                {t('howItWorks.title')}
              </h2>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed">
                {t('howItWorks.subtitle')}
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Phone Background Area - Hidden on mobile, shown on desktop */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative hidden lg:block"
            >
              {/* This space is intentionally left for the phone background to show through */}
              <div className="h-96 lg:h-[32rem]">
                {/* Empty space to let phone background show through */}
              </div>
            </motion.div>

            {/* Steps - Full width on mobile, right side on desktop */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6 lg:space-y-8"
            >
              {[
                {
                  step: "01",
                  title: t('howItWorks.step1.title'),
                  description: t('howItWorks.step1.description'),
                  color: "from-blue-600 to-blue-700"
                },
                {
                  step: "02", 
                  title: t('howItWorks.step2.title'),
                  description: t('howItWorks.step2.description'),
                  color: "from-blue-700 to-blue-800"
                },
                {
                  step: "03",
                  title: t('howItWorks.step3.title'),
                  description: t('howItWorks.step3.description'),
                  color: "from-blue-800 to-blue-900"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.1 * index,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  {/* Glassy card background */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:border-white/30 transition-all duration-300 hover:bg-white/15 shadow-xl hover:shadow-2xl hover:scale-105">
                    <div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </section>

      {/* Why Choose Us - Mobile First */}
      <section 
        ref={testimonialsAnimation.ref as React.RefObject<HTMLElement>}
        className={`w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-black relative overflow-hidden ${testimonialsAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        {/* Background Image with Black and White Filter */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat filter grayscale"
          style={{
            backgroundImage: "url('/contractor.jpg')"
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/70" />
        
        <div className="container px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-white">{t('whyChooseUs.title')}</h2>
              <p className="max-w-[900px] text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">{t('whyChooseUs.subtitle')}</p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 mt-8 sm:mt-12">
            {whyChooseUs.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-gray-300 text-sm sm:text-base">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />

      {/* Scroll Progress Indicator */}
      <div 
        className="scroll-progress" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`scroll-to-top ${showButton ? 'visible' : ''}`}
        aria-label="Scroll to top"
      >
        <ChevronLeft className="h-6 w-6 rotate-90 text-white" />
      </button>

      {/* Global Loading Overlay */}
      <GlobalLoadingOverlay 
        isVisible={showGlobalLoader} 
        message="Processing your request..."
      />

    </div>

  )

}
