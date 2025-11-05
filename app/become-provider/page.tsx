"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Users, 
  ShieldCheck, 
  Clock, 
  Wallet, 
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  ArrowRight,
  ChevronRight,
  Zap,
  Target,
  Award,
  Globe,
  Smartphone,
  MessageSquare,
  DollarSign,
  UserCheck,
  FileText,
  Banknote,
  Briefcase,
  Handshake,
  Sparkles,
  Rocket,
  Crown,
  Gem
} from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { LoadingButton as EnhancedButton } from "@/components/ui/enhanced-loading-button"
import { LoadingLink } from "@/components/ui/loading-link"
import { ScrollProgressIndicator } from "@/components/ui/scroll-progress-indicator"
import { FloatingParticles } from "@/components/ui/floating-elements"
import { useScrollAnimation, useScrollProgress, useScrollToTop } from "@/hooks/use-scroll-animation"
import { useLanguage } from "@/contexts/LanguageContext"

export default function BecomeProvider() {
  const { t } = useLanguage()
  const [showSplash, setShowSplash] = useState(true)
  const [fadeSplash, setFadeSplash] = useState(false)
  const [contentReady, setContentReady] = useState(false)

  // Add CSS for flipping cards
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .perspective-1000 {
        perspective: 1000px;
      }
      .transform-style-preserve-3d {
        transform-style: preserve-3d;
      }
      .backface-hidden {
        backface-visibility: hidden;
      }
      .rotate-y-180 {
        transform: rotateY(180deg);
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  
  // Loading states for different buttons
  const [loadingStates, setLoadingStates] = useState({
    getStarted: false,
    signUpNow: false,
    learnMore: false,
    joinNow: false,
    startEarning: false,
    headerServices: false,
    headerSignIn: false
  })

  // Scroll animations
  const heroAnimation = useScrollAnimation({ threshold: 0.1 })
  const benefitsAnimation = useScrollAnimation({ threshold: 0.2 })
  const processAnimation = useScrollAnimation({ threshold: 0.2 })
  const requirementsAnimation = useScrollAnimation({ threshold: 0.3 })
  const scrollProgress = useScrollProgress()
  const { showButton, scrollToTop } = useScrollToTop()

  const handleButtonClick = (buttonKey: keyof typeof loadingStates, action: () => void) => {
    setLoadingStates(prev => ({ ...prev, [buttonKey]: true }))
    
    setTimeout(() => {
      action()
      setLoadingStates(prev => ({ ...prev, [buttonKey]: false }))
    }, 1000)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.sessionStorage.getItem('providerSplashShown')) {
        setShowSplash(false)
        return
      }
      const timer = setTimeout(() => {
        setFadeSplash(true)
        setTimeout(() => {
          setShowSplash(false)
          window.sessionStorage.setItem('providerSplashShown', 'true')
        }, 700)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!showSplash) {
      setTimeout(() => setContentReady(true), 10)
    }
  }, [showSplash])

  const benefits = [
    { 
      icon: Users, 
      title: "Access to Quality Clients", 
      description: "Connect with verified customers actively seeking your services in your area",
      color: "from-blue-500 to-blue-600",
      gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/20"
    },
    { 
      icon: DollarSign, 
      title: "Secure & Fast Payments", 
      description: "Get paid on time, every time with our escrow system and instant transfers",
      color: "from-green-500 to-green-600",
      gradient: "bg-gradient-to-br from-green-500/20 to-green-600/20"
    },
    { 
      icon: ShieldCheck, 
      title: "Build Your Reputation", 
      description: "Verified profiles and authentic reviews help you stand out from the competition",
      color: "from-purple-500 to-purple-600",
      gradient: "bg-gradient-to-br from-purple-500/20 to-purple-600/20"
    },
    { 
      icon: Clock, 
      title: "Complete Flexibility", 
      description: "Choose your own schedule, set your rates, and work when it suits you best",
      color: "from-orange-500 to-orange-600",
      gradient: "bg-gradient-to-br from-orange-500/20 to-orange-600/20"
    },
    { 
      icon: TrendingUp, 
      title: "Grow Your Business", 
      description: "Scale your services with our tools and support to reach more customers",
      color: "from-cyan-500 to-cyan-600",
      gradient: "bg-gradient-to-br from-cyan-500/20 to-cyan-600/20"
    },
    { 
      icon: Smartphone, 
      title: "Easy Management", 
      description: "Manage bookings, communicate with clients, and track earnings from your phone",
      color: "from-pink-500 to-pink-600",
      gradient: "bg-gradient-to-br from-pink-500/20 to-pink-600/20"
    }
  ]

  const processSteps = [
    {
      step: "01",
      title: "Create Your Profile",
      description: "Set up your professional profile with photos, skills, and service areas in minutes",
      icon: UserCheck,
      color: "from-blue-600 to-blue-700"
    },
    {
      step: "02", 
      title: "Get Verified",
      description: "Upload your documents and certifications to build trust with potential clients",
      icon: ShieldCheck,
      color: "from-green-600 to-green-700"
    },
    {
      step: "03",
      title: "Start Receiving Jobs",
      description: "Get matched with customers in your area and start earning from day one",
      icon: Briefcase,
      color: "from-purple-600 to-purple-700"
    },
    {
      step: "04",
      title: "Get Paid Securely",
      description: "Receive payments directly to your bank account with our secure escrow system",
      icon: Banknote,
      color: "from-orange-600 to-orange-700"
    }
  ]

  const requirements = [
    { text: "Valid South African ID or work permit", icon: FileText },
    { text: "Relevant qualifications or certifications (if applicable)", icon: Award },
    { text: "Basic tools and equipment for your service", icon: Briefcase },
    { text: "South African bank account for payments", icon: Banknote },
    { text: "Reliable internet connection and smartphone", icon: Smartphone },
    { text: "Professional attitude and customer service skills", icon: Handshake }
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
            <Crown className="w-16 h-16 text-white" />
          </div>
          <span className={`text-3xl font-bold text-white transition-opacity duration-700 ${fadeSplash ? 'opacity-0' : 'opacity-100'} animate-fade-in-out`}>
            Join ProLiink Connect
          </span>
        </div>
      )}

      {/* Modern Hero Section */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/proliink meet.png')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent sm:from-black/80 sm:via-black/40" />
        </div>

        {/* Navbar */}
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
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Floating particles for ambiance */}
            <div className="absolute inset-0 overflow-hidden z-10">
              {[...Array(20)].map((_, i) => (
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

            <div className="container mx-auto px-4 sm:px-6 relative z-20">
              <div className="max-w-5xl mx-auto text-center">
                {/* Main Headline */}
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
                  style={{
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    lineHeight: '1.2',
                    letterSpacing: '0.025em'
                  }}
                >
                  Turn Your Skills Into
                  <span className="block bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    Steady Income
                  </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-lg sm:text-xl md:text-2xl text-gray-200 mt-4 max-w-4xl mx-auto leading-relaxed"
                  style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  Join South Africa's most trusted platform for service providers. 
                  Connect with quality clients, build your reputation, and grow your business.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <EnhancedButton
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
                    href="/signup?role=provider"
                    loading={loadingStates.getStarted}
                    loadingText="Getting Started..."
                    onClick={() => handleButtonClick('getStarted', () => {})}
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Earning Today
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </EnhancedButton>

                  <EnhancedButton
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
                    href="#benefits"
                    loading={loadingStates.learnMore}
                    loadingText="Loading..."
                    onClick={() => handleButtonClick('learnMore', () => {})}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Learn More
                  </EnhancedButton>
                </motion.div>

                {/* Trust Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mt-8 text-sm text-gray-300 flex items-center gap-2 justify-center"
                >
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    Trusted by 500+ Service Providers Across South Africa
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
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
            </div>
          </section>
        </div>
          </div>

      {/* Enhanced Scroll Parallax Section with vider.jpg */}
      <div className="relative h-screen overflow-hidden">
        <motion.div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/vider.jpg')",
            scale: 1.2
          }}
          animate={{
            scale: [1.2, 1.1, 1.2]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Benefits Section with paint.jpg background */}
      <section 
        ref={benefitsAnimation.ref as React.RefObject<HTMLElement>}
        id="benefits"
        className={`w-full py-16 sm:py-20 md:py-24 lg:py-32 relative overflow-hidden ${benefitsAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/paint.jpg')"
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                Why Choose ProLiink Connect?
              </h2>
              <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
                Join the platform that's revolutionizing how service providers connect with clients across South Africa
              </p>
            </motion.div>
          </div>

          {/* Benefits Grid with Photo and Text Layout */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Photo */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative">
                <div 
                  className="w-full h-96 lg:h-[500px] bg-cover bg-center bg-no-repeat rounded-2xl shadow-2xl"
                  style={{
                    backgroundImage: "url('/paint.jpg')"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
              </div>
            </motion.div>

            {/* Right Side - Benefits Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 space-y-6"
            >
              {benefits.map((benefit, index) => (
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
                  className="group"
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 hover:bg-white/15 shadow-xl hover:shadow-2xl">
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Scroll Parallax Section with provider.jpg */}
      <div className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/provider.jpg')"
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 1, 
                delay: 0.3,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/20 shadow-xl"
            >
              <motion.h2 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.5,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
              >
                Ready to Transform Your Business?
              </motion.h2>
              
              <motion.p 
                className="text-gray-300 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto mb-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.7,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
              >
                Join thousands of successful service providers who've built thriving businesses with ProLiink Connect
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.9,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
              >
                <EnhancedButton
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
                  href="/signup?role=provider"
                  loading={loadingStates.joinNow}
                  loadingText="Joining..."
                  onClick={() => handleButtonClick('joinNow', () => {})}
                >
                  <Gem className="w-5 h-5 mr-2" />
                  Join Our Elite Network
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </EnhancedButton>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How It Works Section with Flipping Cards */}
      <section 
        ref={processAnimation.ref as React.RefObject<HTMLElement>}
        className={`w-full py-16 sm:py-20 md:py-24 lg:py-32 bg-black ${processAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
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
                Get Started in 4 Simple Steps
              </h2>
              <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
                From signup to your first earning - we've made it incredibly simple
              </p>
            </motion.div>
          </div>

          {/* Process Steps with Flipping Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon
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
                  className="group relative h-80"
                >
                  <div className="relative w-full h-full perspective-1000">
                    {/* Card Container */}
                    <div className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
                      {/* Front of Card */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
                        <div className="text-center h-full flex flex-col justify-center">
                          <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-blue-400 font-bold text-lg mb-3">Step {step.step}</div>
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Back of Card */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl rotate-y-180">
                        <div className="text-center h-full flex flex-col justify-center">
                          <div className="text-white text-sm leading-relaxed">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section 
        ref={requirementsAnimation.ref as React.RefObject<HTMLElement>}
        className={`w-full py-16 sm:py-20 bg-black/50 ${requirementsAnimation.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'}`}
      >
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                What You'll Need to Get Started
              </h2>
              <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
                Simple requirements to ensure quality service delivery
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {requirements.map((req, index) => {
                const Icon = req.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white text-sm sm:text-base">{req.text}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`scroll-to-top ${showButton ? 'visible' : ''}`}
        aria-label="Scroll to top"
      >
        <ChevronRight className="h-6 w-6 rotate-90 text-white" />
      </button>
    </div>
  )
}