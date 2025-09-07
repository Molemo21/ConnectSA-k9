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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { BrandHeader } from "@/components/ui/brand-header"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeSplash, setFadeSplash] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className={`flex min-h-screen flex-col bg-black text-white transition-all duration-700 ${showSplash ? 'opacity-0 blur-sm' : contentReady ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}>
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

      <BrandHeader showAuth={true} showUserMenu={false} />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/60 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className={`fixed right-0 top-0 h-full w-80 bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <span className="text-xl font-bold text-white">ProLiink Connect</span>
              </div>
              <Button onClick={() => setMobileMenuOpen(false)} className="bg-transparent text-white hover:bg-white/10 p-2">
                <X className="h-6 w-6" />
              </Button>
            </div>

            <nav className="p-6 space-y-4">
              <Link href="/services" className="block text-white hover:text-blue-400 py-3 px-4 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Services
              </Link>
              <Link href="#how-it-works" className="block text-white hover:text-blue-400 py-3 px-4 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </Link>
              <Link href="/contact" className="block text-white hover:text-blue-400 py-3 px-4 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <Link href="/provider/onboarding" className="block text-white hover:text-blue-400 py-3 px-4 rounded-lg hover:bg-white/10 transition-colors font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  Become a Service Provider
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden flex items-center justify-center">
        <div className="absolute top-6 right-6 z-20 hidden md:block">
          <Link href="/provider/onboarding">
            <Button className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-6 py-3 rounded-lg shadow-lg hover:bg-white/20 transition-colors font-semibold">
              Become a Service Provider
            </Button>
          </Link>
        </div>

        {/* Collage Background */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden grid grid-cols-10 gap-0.5">
          {collagePhotos.map((photo, index) => (
            <div key={index} className="relative overflow-hidden rounded-sm shadow-md transition-all duration-300 group">
              <img
                src={photo}
                srcSet={`${photo} 1x, ${photo.replace(/(\.[a-zA-Z]+)$/, '@2x$1')} 2x`}
                alt={`Service collage ${index + 1}`}
                className="w-full h-full object-cover transition-all duration-300 hover:scale-110 hover:z-10 hover:shadow-[0_8px_32px_0_rgba(80,0,255,0.5)] hover:border-2 hover:border-blue-500 hover:brightness-125"
                loading="lazy"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/90" />
        </div>

        <div className={`relative w-full flex items-center justify-center transition-all duration-700 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ minHeight: '350px' }}>
          <div className="relative z-10 container px-4 md:px-6">
            <div className={`max-w-4xl mx-auto text-left md:text-left transition-all duration-700 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg text-left md:text-left">
                The smart way to <span className="text-blue-500">link</span> professionals and clients
              </h1>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md text-left md:text-left">
                Connect with trusted experts in your area, all in one place
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-start mb-12">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg">
                  <Link href="/book-service">
                    Book a Service
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-4 text-lg text-white border border-white/30 bg-black/60 hover:bg-blue-900/20 backdrop-blur-sm">
                  <Link href="/services">Browse Services</Link>
                </Button>
              </div>
              <div className="md:hidden fixed top-6 right-4 z-50">
                <Button onClick={() => setMobileMenuOpen(true)} className="bg-white/10 backdrop-blur-sm text-white border border-white/20 p-3 rounded-lg shadow-lg hover:bg-white/20 transition-colors">
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="w-full py-12 bg-black">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">Popular Services</h2>
            <Link href="/services" className="text-blue-400 hover:text-blue-300 hover:underline whitespace-nowrap text-base font-medium">
              View all services
            </Link>
          </div>

          {/* Mobile carousel */}
          <div className="relative md:hidden">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300" style={{ left: '-6px' }} onClick={() => {
              const el = document.getElementById('popular-scroll-mobile');
              if (el) el.scrollBy({ left: -el.offsetWidth * 0.8, behavior: 'smooth' });
            }} aria-label="Scroll left">
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>

            <div id="popular-scroll-mobile" className="flex overflow-x-auto hide-scrollbar gap-4 snap-x snap-mandatory scroll-smooth px-2" style={{ scrollSnapType: 'x mandatory' }}>
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <div key={index} className="min-w-[80vw] max-w-xs snap-center flex-shrink-0">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-gray-700/50 backdrop-blur-sm border border-gray-600/30 h-full">
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg mb-1">{service.name}</h3>
                            <p className="text-gray-300 mb-2">{service.category}</p>
                            <p className="text-blue-400 font-medium">{service.price}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300" style={{ right: '-6px' }} onClick={() => {
              const el = document.getElementById('popular-scroll-mobile');
              if (el) el.scrollBy({ left: el.offsetWidth * 0.8, behavior: 'smooth' });
            }} aria-label="Scroll right">
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Desktop carousel */}
          <div className="relative hidden md:block">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300" style={{ left: '-18px' }} onClick={() => {
              const el = document.getElementById('popular-scroll-desktop');
              if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
            }} aria-label="Scroll left">
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>

            <div id="popular-scroll-desktop" className="flex overflow-x-auto hide-scrollbar gap-6 scroll-smooth px-2">
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <div key={index} className="min-w-[320px] flex-shrink-0">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-gray-700/50 backdrop-blur-sm border border-gray-600/30 h-full">
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg mb-1">{service.name}</h3>
                            <p className="text-gray-300 mb-2">{service.category}</p>
                            <p className="text-blue-400 font-medium">{service.price}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300" style={{ right: '-18px' }} onClick={() => {
              const el = document.getElementById('popular-scroll-desktop');
              if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
            }} aria-label="Scroll right">
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 bg-black text-slate-200">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-12 items-center">
            <div className="w-full flex items-center justify-center mb-8 md:mb-0 h-full">
              <div className="w-full max-w-xs md:max-w-sm aspect-[4/5] rounded-xl shadow-lg border border-gray-800 overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#334155] flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-4xl">P</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full">
              <div className="mb-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-2">What We Offer</h2>
                <p className="text-lg text-slate-300">Discover a smarter way to book trusted local services.</p>
              </div>
              <ul className="flex flex-col gap-5">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <li key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/80 shadow transition hover:scale-105 hover:bg-gray-800/90 duration-300">
                      <Icon className={`h-7 w-7 ${feature.color} flex-shrink-0 mt-1`} />
                      <div>
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                        <p className="text-slate-400 text-base">{feature.description}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-black">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-10 md:gap-16">
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8 text-white">How It Works</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-[#00A3E0] mb-1">1. Browse</h3>
                  <p className="text-gray-300 text-base">Find the right service or contractor for your specific needs from our extensive network.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#00A3E0] mb-1">2. Connect</h3>
                  <p className="text-gray-300 text-base">Send a request and chat directly with providers to discuss your requirements.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#00A3E0] mb-1">3. Book</h3>
                  <p className="text-gray-300 text-base">Confirm your booking, get the job done, and enjoy hassle-free service.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[180px] md:max-w-[220px] lg:max-w-[260px] xl:max-w-[300px] h-auto">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                  <span className="text-white font-bold text-4xl">🤝</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">Why People Trust Our Platform</h2>
              <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Join thousands of satisfied customers who rely on our platform for their service needs.</p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 mt-12">
            {whyChooseUs.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-start space-x-4">
                  <Icon className="h-8 w-8 text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="text-gray-300">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      
      {/* Footer (single) */}
      <footer className="w-full border-t py-12 bg-gray-100 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold">
                <span className="flex flex-col">
                  <span>ProL<span className="text-blue-600">i</span>nk</span>
                  <span>Co<span className="text-blue-600">nn</span>ect</span>
                </span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">The smart way to link professionals and clients.</p>
              <img src="/handshake.png" alt="Handshake" className="mt-4 h-10 w-auto" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Quick Links</h3>
              <ul className="mt-2 space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link></li>
                <li><Link href="/services" className="text-sm text-muted-foreground hover:text-foreground">Services</Link></li>
                <li><Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How It Works</Link></li>
                <li><Link href="#blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold">Services</h3>
              <ul className="mt-2 space-y-2">
                <li><Link href="#plumbing" className="text-sm text-muted-foreground hover:text-foreground">Plumbing</Link></li>
                <li><Link href="#electrical" className="text-sm text-muted-foreground hover:text-foreground">Electrical</Link></li>
                <li><Link href="#gardening" className="text-sm text-muted-foreground hover:text-foreground">Gardening</Link></li>
                <li><Link href="#hair-styling" className="text-sm text-muted-foreground hover:text-foreground">Hair Styling</Link></li>
                <li><Link href="#painting" className="text-sm text-muted-foreground hover:text-foreground">Painting</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold">Contact Us</h3>
              <address className="mt-2 not-italic text-sm text-muted-foreground">
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

          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
            <div className="flex justify-center gap-6 mb-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook className="h-6 w-6" /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Twitter className="h-6 w-6" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Instagram className="h-6 w-6" /></a>
              <a href="https://www.linkedin.com/company/proliink-connect-sa" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Linkedin className="h-6 w-6" /></a>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 ProLiink Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}