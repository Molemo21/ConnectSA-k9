"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle,
  Shield,
  Clock,
  Star,
  Wrench,
  Zap,
  SprayCan,
  Paintbrush,
  Flower,
  ArrowRight,
  Calendar,
  MessageSquare,
  Globe,
  Smartphone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Hammer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { LoadingButton } from "@/components/ui/loading-button"
import { LoadingButton as EnhancedButton } from "@/components/ui/enhanced-loading-button"
import { LoadingLink } from "@/components/ui/loading-link"
import { GlobalLoadingOverlay } from "@/components/ui/global-loading-overlay"
import { ModernHeroSection } from "@/components/ui/modern-hero-section"
import { ScrollParallaxSection } from "@/components/ui/scroll-parallax-section"
import { ScrollProgressIndicator } from "@/components/ui/scroll-progress-indicator"
import { FloatingParticles } from "@/components/ui/floating-elements"
import { useState, useEffect } from "react"
import { useScrollAnimation, useScrollProgress, useScrollToTop } from "@/hooks/use-scroll-animation"
import { motion } from "framer-motion"
import { useLanguage } from "@/contexts/LanguageContext"

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeSplash, setFadeSplash] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const { t } = useLanguage()
  // Loading states for different buttons
  const [loadingStates, setLoadingStates] = useState({
    bookService: false,
    becomeProvider: false,
    getStarted: false,
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
  const [showGlobalLoader, setShowGlobalLoader] = useState(false)

  // Scroll animations
  const heroAnimation = useScrollAnimation({ threshold: 0.1 })
  const servicesAnimation = useScrollAnimation({ threshold: 0.2 })
  const featuresAnimation = useScrollAnimation({ threshold: 0.1 })
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

  const photos = [
    '/services/car%20m3.jpg',
    '/services/Cleaner%202.jpg',
    '/services/electrician%205.jpg',
    '/services/electricity.jpg',
    '/services/hairdresser.webp',
    '/services/IMG-20250813-WA0039.jpg',
    '/services/IMG-20250813-WA0043.jpg',
    '/services/IMG-20250813-WA0044.jpg',
    '/services/IMG-20250813-WA0046.jpg',
    '/services/IMG-20250813-WA0054.jpg',
    '/services/IMG-20250813-WA0057.jpg',
    '/services/laundry.jpg',
    '/services/makeup.jpg',
    '/services/Mobile%20carwash%206.jpg',
    '/services/moving%203.jpg',
    '/services/nails.jpg',
    '/services/paint.jpg',
    '/services/pest.jpg',
    '/services/plank.jpg',
    '/services/Plumber%202.jpg',
    '/services/security%203.jpg',
  ]

  const collagePhotos = Array.from({ length: 100 }, (_, i) => photos[i % photos.length])

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
    { name: "Plumbing", category: "Home Services", price: "From R300", icon: Wrench, color: "from-blue-500 to-blue-600", image: "/services/Plumber%202.jpg" },
    { name: "Electrical Work", category: "Home Services", price: "From R400", icon: Zap, color: "from-yellow-500 to-yellow-600", image: "/services/electricity.jpg" },
    { name: "House Cleaning", category: "Home Services", price: "From R250", icon: SprayCan, color: "from-green-500 to-green-600", image: "/services/Cleaner%202.jpg" },
    { name: "Carpentry", category: "Home Services", price: "From R350", icon: Hammer, color: "from-orange-500 to-orange-600", image: "/services/plank.jpg" },
    { name: "Painting", category: "Home Services", price: "From R350", icon: Paintbrush, color: "from-purple-500 to-purple-600", image: "/services/paint.jpg" },
    { name: "Garden Services", category: "Home Services", price: "From R200", icon: Flower, color: "from-green-500 to-green-600", image: "/services/skere.jpg" },
  ]

  const features = [
    { icon: CheckCircle, title: "Verified Professionals", description: "All service providers are background-checked and verified for your safety", color: "text-blue-400" },
    { icon: Calendar, title: "Fast & Flexible Booking", description: "Schedule services exactly when you need them — no hassle", color: "text-green-400" },
    { icon: Smartphone, title: "User-Friendly Platform", description: "Seamlessly browse, book, and manage services from your phone or computer", color: "text-blue-400" },
    { icon: MessageSquare, title: "Clear Communication", description: "Chat directly with service providers for updates and details", color: "text-purple-400" },
    { icon: Shield, title: "Secure & Transparent Payments", description: "Pay safely online with clear pricing and no surprise fees", color: "text-yellow-400" },
    { icon: Globe, title: "Wide Service Coverage", description: "Find qualified professionals in your region — with more joining every day", color: "text-cyan-400" },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Verified Providers" },
    { number: "50,000+", label: "Services Completed" },
    { number: "4.8★", label: "Average Rating" },
  ]

  const whyChooseUs = [
    { icon: Clock, title: t('whyChooseUs.saveTime.title'), description: t('whyChooseUs.saveTime.description') },
    { icon: Shield, title: t('whyChooseUs.guaranteedQuality.title'), description: t('whyChooseUs.guaranteedQuality.description') },
    { icon: MessageSquare, title: t('whyChooseUs.dedicatedSupport.title'), description: t('whyChooseUs.dedicatedSupport.description') },
    { icon: Star, title: t('whyChooseUs.realReviews.title'), description: t('whyChooseUs.realReviews.description') },
  ]

  return (
    <div className={`flex min-h-screen flex-col gradient-bg-dark text-white transition-all duration-700 ${showSplash ? 'opacity-0 blur-sm' : contentReady ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}>
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
              <img 
                src="/handshake.png" 
                alt="Loading" 
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
            onBookServiceClick={() => handleButtonClick('bookService', () => window.location.href = '/book-service')}
            onBecomeProviderClick={() => handleButtonClick('becomeProvider', () => window.location.href = '/become-provider')}
            onGetStartedClick={() => handleButtonClick('getStarted', () => window.location.href = '/signup')}
          />
        </div>
      </div>

      {/* Modern Services Section - Bolt-Inspired Design */}
      <section 
        ref={servicesAnimation.ref as React.RefObject<HTMLElement>}
        className={`w-full py-16 sm:py-20 md:py-24 lg:py-32 bg-black ${servicesAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        <div className="container px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                {t('services.title')}
              </h2>
              <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
                {t('services.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Services Grid - Show 4 services, scroll horizontally */}
          <div className="relative">
            {/* Scroll container */}
            <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-4 snap-x snap-mandatory scroll-smooth">
              {services.slice(0, 4).map((service, index) => {
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
                    className="group flex-shrink-0 w-full sm:w-80 lg:w-96 snap-center"
                  >
                    <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full hover:bg-white/10">
                      {/* Service Image */}
                      <div className="relative h-48 sm:h-56 overflow-hidden">
                        <img 
                          src={service.image} 
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30">
                            {service.category}
                          </span>
                        </div>
            </div>

                      {/* Service Content */}
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                              {service.name}
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              Professional {service.name.toLowerCase()} services delivered by verified experts in your area.
                            </p>
          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-blue-400 font-semibold text-lg">
                              {service.price}
                            </div>
                            <EnhancedButton 
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                              onClick={() => handleButtonClick('browseServices', () => window.location.href = '/book-service')}
                              loading={loadingStates.browseServices}
                              loadingText="Booking..."
                            >
                                <div className="flex items-center space-x-2">
                                  <span>{t('services.bookNow')}</span>
                                  <ArrowRight className="w-4 h-4" />
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
        className={`w-full py-20 sm:py-24 md:py-32 lg:py-40 relative overflow-hidden ${howItWorksAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
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
          <div className="text-center mb-20 sm:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight">
                {t('howItWorks.title')}
              </h2>
              <p className="text-gray-300 text-xl sm:text-2xl max-w-4xl mx-auto leading-relaxed">
                {t('howItWorks.subtitle')}
              </p>
            </motion.div>
                </div>

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Phone Background Area - Left Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* This space is intentionally left for the phone background to show through */}
              <div className="h-96 lg:h-[32rem]">
                {/* Empty space to let phone background show through */}
              </div>
            </motion.div>

            {/* Steps - Right Side Overlay */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-8"
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
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-white/30 transition-all duration-300 hover:bg-white/15 shadow-xl hover:shadow-2xl hover:scale-105">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-300 text-lg leading-relaxed">
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
        className={`w-full py-8 sm:py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden ${testimonialsAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
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
      
      {/* Footer - Mobile First */}
      <footer className="w-full border-t border-gray-800/50 py-8 sm:py-12 bg-gradient-to-b from-black to-gray-900">
        <div className="container px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                <span className="flex flex-col">
                  <span>ProL<span className="text-blue-400">i</span>nk</span>
                  <span>Co<span className="text-blue-400">nn</span>ect</span>
                </span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-400">The smart way to link professionals and clients.</p>
              <img src="/handshake.png" alt="Handshake" className="mt-3 sm:mt-4 h-8 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Quick Links</h3>
              <ul className="mt-2 space-y-1.5 sm:space-y-2">
                <li>
                  <LoadingLink 
                    href="/services" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerServices}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerServices', () => {})}
                  >
                    Services
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/book-service" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerBookService}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerBookService', () => {})}
                  >
                    Book Service
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/become-provider" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerBecomeProvider}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerBecomeProvider', () => {})}
                  >
                    Become Provider
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/about" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerAbout}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerAbout', () => {})}
                  >
                    About Us
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/dashboard" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerDashboard}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerDashboard', () => {})}
                  >
                    Dashboard
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/contact" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerContact}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerContact', () => {})}
                  >
                    Contact Us
                  </LoadingLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Popular Services</h3>
              <ul className="mt-2 space-y-1.5 sm:space-y-2">
                <li>
                  <LoadingLink 
                    href="/services?category=Home Services" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerHomeServices}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerHomeServices', () => {})}
                  >
                    Home Services
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/services?category=Beauty" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerBeauty}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerBeauty', () => {})}
                  >
                    Beauty & Wellness
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/services?category=Technology" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerIT}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerIT', () => {})}
                  >
                    IT Support
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/services?category=Automotive" 
                    className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                    loading={loadingStates.footerAutomotive}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerAutomotive', () => {})}
                  >
                    Automotive
                  </LoadingLink>
                </li>
                <li>
                  <LoadingLink 
                    href="/services" 
                    className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    loading={loadingStates.footerViewAll}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('footerViewAll', () => {})}
                  >
                    View All Services →
                  </LoadingLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Contact Us</h3>
              <address className="mt-2 not-italic text-xs sm:text-sm text-gray-400">
                <p>49 Leeds Street</p>
                <p>Cnr Leeds & Creister street</p>
                <p>Mthatha, Eastern Cape</p>
                <p>5099</p>
                <p className="mt-2">
                  <span className="block">Email: support@proliinkconnect.co.za</span>
                  <span className="block">Phone: +27 68 947 6401</span>
                </p>
              </address>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 border-t border-gray-800/50 pt-6 sm:pt-8 text-center">
            <div className="flex justify-center gap-4 sm:gap-6 mb-3 sm:mb-4">
              <LoadingLink 
                href="https://facebook.com" 
                className="text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                loading={loadingStates.facebook}
                loadingText="Loading..."
                onClick={() => handleButtonClick('facebook', () => {})}
              >
                <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
              </LoadingLink>
              <LoadingLink 
                href="https://twitter.com" 
                className="text-gray-400 hover:text-blue-400 transition-all duration-300 hover:scale-110"
                loading={loadingStates.twitter}
                loadingText="Loading..."
                onClick={() => handleButtonClick('twitter', () => {})}
              >
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
              </LoadingLink>
              <LoadingLink 
                href="https://instagram.com" 
                className="text-gray-400 hover:text-pink-500 transition-all duration-300 hover:scale-110"
                loading={loadingStates.instagram}
                loadingText="Loading..."
                onClick={() => handleButtonClick('instagram', () => {})}
              >
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </LoadingLink>
              <LoadingLink 
                href="https://www.linkedin.com/company/proliink-connect-sa" 
                className="text-gray-400 hover:text-blue-600 transition-all duration-300 hover:scale-110"
                loading={loadingStates.linkedin}
                loadingText="Loading..."
                onClick={() => handleButtonClick('linkedin', () => {})}
              >
                <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
              </LoadingLink>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">© 2024 ProLiink Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
