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
import { WhatWeOfferSection } from "@/components/ui/what-we-offer-section"
import { ModernHeroSection } from "@/components/ui/modern-hero-section"
import { useState, useEffect } from "react"
import { useScrollAnimation, useScrollProgress, useScrollToTop } from "@/hooks/use-scroll-animation"

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeSplash, setFadeSplash] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  // Loading states for different buttons
  const [loadingStates, setLoadingStates] = useState({
    bookService: false,
    browseServices: false,
    scrollLeft: false,
    scrollRight: false,
    scrollLeftDesktop: false,
    scrollRightDesktop: false
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
    setShowGlobalLoader(true)
    
    // Simulate loading time (you can adjust this or make it dynamic)
    setTimeout(() => {
      action()
      setLoadingStates(prev => ({ ...prev, [buttonKey]: false }))
      setShowGlobalLoader(false)
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
    { icon: Clock, title: "Save Time", description: "We make finding reliable services effortless, saving you hours of research and phone calls." },
    { icon: Shield, title: "Guaranteed Quality", description: "Avoid scams and poor service with our vetted professionals and quality guarantee." },
    { icon: MessageSquare, title: "Dedicated Support", description: "Our customer service team is always ready to help with any questions or issues." },
    { icon: Star, title: "Real Reviews", description: "Make informed decisions based on authentic reviews from real users." },
  ]

  return (
    <div className={`flex min-h-screen flex-col gradient-bg-dark text-white transition-all duration-700 ${showSplash ? 'opacity-0 blur-sm' : contentReady ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}>
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
          <BrandHeaderClient showAuth={true} showUserMenu={false} className="bg-transparent border-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10">
          <ModernHeroSection />
        </div>
      </div>

      {/* Popular Services - Mobile First */}
      <section 
        ref={servicesAnimation.ref as React.RefObject<HTMLElement>}
        className={`w-full py-8 sm:py-12 bg-black ${servicesAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        <div className="container px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-4 sm:mb-6 gap-3 xs:gap-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tight text-white">Popular Services</h2>
            <Link href="/services" className="text-blue-400 hover:text-blue-300 hover:underline whitespace-nowrap text-sm sm:text-base font-medium">
              View all services
            </Link>
          </div>

          {/* Mobile carousel - Mobile First */}
          <div className="relative md:hidden">
            <LoadingButton
              onClick={() => handleButtonClick('scrollLeft', () => {
              const el = document.getElementById('popular-scroll-mobile');
              if (el) el.scrollBy({ left: -el.offsetWidth * 0.8, behavior: 'smooth' });
              })}
              loading={loadingStates.scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              style={{ left: '-4px' }}
              aria-label="Scroll left"
              loaderColor="white"
            >
              <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </LoadingButton>

            <div id="popular-scroll-mobile" className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 snap-x snap-mandatory scroll-smooth px-1 sm:px-2" style={{ scrollSnapType: 'x mandatory' }}>
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <div key={index} className="min-w-[75vw] xs:min-w-[70vw] sm:min-w-[60vw] max-w-xs snap-center flex-shrink-0">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-gray-700/50 backdrop-blur-sm border border-gray-600/30 h-full">
                      <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg">
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                          <h3 className="font-bold text-white text-base sm:text-lg mb-1 drop-shadow-lg">{service.name}</h3>
                          <p className="text-gray-200 text-xs sm:text-sm font-medium">{service.category}</p>
                        </div>
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="text-center">
                          <p className="text-blue-300 font-bold text-base sm:text-lg">{service.price}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            <LoadingButton
              onClick={() => handleButtonClick('scrollRight', () => {
              const el = document.getElementById('popular-scroll-mobile');
              if (el) el.scrollBy({ left: el.offsetWidth * 0.8, behavior: 'smooth' });
              })}
              loading={loadingStates.scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              style={{ right: '-4px' }}
              aria-label="Scroll right"
              loaderColor="white"
            >
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </LoadingButton>
          </div>

          {/* Desktop carousel */}
          <div className="relative hidden md:block">
            <LoadingButton
              onClick={() => handleButtonClick('scrollLeftDesktop', () => {
              const el = document.getElementById('popular-scroll-desktop');
              if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
              })}
              loading={loadingStates.scrollLeftDesktop}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              style={{ left: '-18px' }}
              aria-label="Scroll left"
              loaderColor="white"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </LoadingButton>

            <div id="popular-scroll-desktop" className="flex overflow-x-auto hide-scrollbar gap-6 scroll-smooth px-2">
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <div key={index} className="min-w-[320px] flex-shrink-0">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-gray-700/50 backdrop-blur-sm border border-gray-600/30 h-full">
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="font-bold text-white text-lg mb-1 drop-shadow-lg">{service.name}</h3>
                          <p className="text-gray-200 text-sm font-medium">{service.category}</p>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-blue-300 font-bold text-lg">{service.price}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            <LoadingButton
              onClick={() => handleButtonClick('scrollRightDesktop', () => {
              const el = document.getElementById('popular-scroll-desktop');
              if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
              })}
              loading={loadingStates.scrollRightDesktop}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              style={{ right: '-18px' }}
              aria-label="Scroll right"
              loaderColor="white"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </LoadingButton>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <WhatWeOfferSection />

      {/* How It Works - Mobile First */}
      <section 
        ref={howItWorksAnimation.ref as React.RefObject<HTMLElement>}
        id="how-it-works" 
        className={`w-full py-8 sm:py-12 md:py-24 lg:py-32 bg-black ${howItWorksAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        <div className="container px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 sm:gap-10 md:gap-16">
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-6 sm:mb-8 text-white">How It Works</h2>
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-lg xs:text-xl font-semibold text-[#00A3E0] mb-1">1. Browse</h3>
                  <p className="text-gray-300 text-sm xs:text-base">Find the right service or contractor for your specific needs from our extensive network.</p>
                </div>
                <div>
                  <h3 className="text-lg xs:text-xl font-semibold text-[#00A3E0] mb-1">2. Connect</h3>
                  <p className="text-gray-300 text-sm xs:text-base">Send a request and chat directly with providers to discuss your requirements.</p>
                </div>
                <div>
                  <h3 className="text-lg xs:text-xl font-semibold text-[#00A3E0] mb-1">3. Book</h3>
                  <p className="text-gray-300 text-sm xs:text-base">Confirm your booking, get the job done, and enjoy hassle-free service.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[140px] xs:max-w-[160px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px] xl:max-w-[300px] h-auto">
                <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                  <span className="text-white font-bold text-2xl xs:text-3xl sm:text-4xl">🤝</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Mobile First */}
      <section 
        ref={testimonialsAnimation.ref as React.RefObject<HTMLElement>}
        className={`w-full py-8 sm:py-12 md:py-24 lg:py-32 bg-black ${testimonialsAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        <div className="container px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-white">Why People Trust Our Platform</h2>
              <p className="max-w-[900px] text-gray-300 text-sm xs:text-base sm:text-lg md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Join thousands of satisfied customers who rely on our platform for their service needs.</p>
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
      <footer className="w-full border-t py-8 sm:py-12 bg-black">
        <div className="container px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                <span className="flex flex-col">
                  <span>ProL<span className="text-blue-600">i</span>nk</span>
                  <span>Co<span className="text-blue-600">nn</span>ect</span>
                </span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-400">The smart way to link professionals and clients.</p>
              <img src="/handshake.png" alt="Handshake" className="mt-3 sm:mt-4 h-8 sm:h-10 w-auto" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Quick Links</h3>
              <ul className="mt-2 space-y-1.5 sm:space-y-2">
                <li><Link href="/about" className="text-xs sm:text-sm text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/services" className="text-xs sm:text-sm text-gray-400 hover:text-white">Services</Link></li>
                <li><Link href="#how-it-works" className="text-xs sm:text-sm text-gray-400 hover:text-white">How It Works</Link></li>
                <li><Link href="#blog" className="text-xs sm:text-sm text-gray-400 hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="text-xs sm:text-sm text-gray-400 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Services</h3>
              <ul className="mt-2 space-y-1.5 sm:space-y-2">
                <li><Link href="#plumbing" className="text-xs sm:text-sm text-gray-400 hover:text-white">Plumbing</Link></li>
                <li><Link href="#electrical" className="text-xs sm:text-sm text-gray-400 hover:text-white">Electrical</Link></li>
                <li><Link href="#gardening" className="text-xs sm:text-sm text-gray-400 hover:text-white">Gardening</Link></li>
                <li><Link href="#hair-styling" className="text-xs sm:text-sm text-gray-400 hover:text-white">Hair Styling</Link></li>
                <li><Link href="#painting" className="text-xs sm:text-sm text-gray-400 hover:text-white">Painting</Link></li>
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
                  <span className="block">Phone: +27 78 128 3697</span>
                </p>
              </address>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 border-t border-gray-800 pt-6 sm:pt-8 text-center">
            <div className="flex justify-center gap-4 sm:gap-6 mb-3 sm:mb-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook className="h-5 w-5 sm:h-6 sm:w-6" /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Twitter className="h-5 w-5 sm:h-6 sm:w-6" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Instagram className="h-5 w-5 sm:h-6 sm:w-6" /></a>
              <a href="https://www.linkedin.com/company/proliink-connect-sa" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Linkedin className="h-5 w-5 sm:h-6 sm:w-6" /></a>
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
    </div>
  )
}