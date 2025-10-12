"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Wrench, 
  Zap, 
  SprayCan, 
  Paintbrush, 
  Flower, 
  Hammer,
  ArrowRight,
  Clock,
  DollarSign,
  CheckCircle
} from "lucide-react"
import { motion } from "framer-motion"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { LoadingButton as EnhancedButton } from "@/components/ui/enhanced-loading-button"
import { LoadingLink } from "@/components/ui/loading-link"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { useLanguage } from "@/contexts/LanguageContext"

export default function ServicesPage() {
  const { t } = useLanguage()
  const servicesAnimation = useScrollAnimation({ threshold: 0.2 })
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    browseServices: false,
    viewAllServices: false,
    bookService: false,
  })

  const handleButtonClick = (buttonType: keyof typeof loadingStates, action: () => void) => {
    setLoadingStates(prev => ({ ...prev, [buttonType]: true }))
    
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonType]: false }))
      action()
    }, 1000)
  }

  // Services data matching the landing page
  const services = [
    { 
      name: "Plumbing", 
      category: "Home Services", 
      price: "From R300", 
      icon: Wrench, 
      color: "from-blue-500 to-blue-600", 
      image: "/services/Plumber 2.jpg",
      description: "Professional plumbing services including repairs, installations, and maintenance",
      features: ["Leak repairs", "Pipe installation", "Drain cleaning", "Fixture installation"]
    },
    { 
      name: "Electrical Work", 
      category: "Home Services", 
      price: "From R400", 
      icon: Zap, 
      color: "from-yellow-500 to-yellow-600", 
      image: "/services/electricity.jpg",
      description: "Certified electrical work including wiring, repairs, and installations",
      features: ["Wiring repairs", "Outlet installation", "Circuit breaker fixes", "Light fixture installation"]
    },
    { 
      name: "House Cleaning", 
      category: "Home Services", 
      price: "From R250", 
      icon: SprayCan, 
      color: "from-green-500 to-green-600", 
      image: "/services/Cleaner 2.jpg",
      description: "Professional house cleaning services for all your cleaning needs",
      features: ["Regular cleaning", "Deep cleaning", "Move-in/out cleaning", "Post-construction cleaning"]
    },
    { 
      name: "Carpentry", 
      category: "Home Services", 
      price: "From R350", 
      icon: Hammer, 
      color: "from-orange-500 to-orange-600", 
      image: "/services/plank.jpg",
      description: "Skilled carpentry services for furniture, repairs, and custom work",
      features: ["Furniture repair", "Custom shelving", "Door installation", "Cabinet work"]
    },
    { 
      name: "Painting", 
      category: "Home Services", 
      price: "From R350", 
      icon: Paintbrush, 
      color: "from-purple-500 to-purple-600", 
      image: "/services/paint.jpg",
      description: "Professional painting services for interior and exterior projects",
      features: ["Interior painting", "Exterior painting", "Color consultation", "Surface preparation"]
    },
    { 
      name: "Garden Services", 
      category: "Home Services", 
      price: "From R200", 
      icon: Flower, 
      color: "from-green-500 to-green-600", 
      image: "/services/skere.jpg",
      description: "Complete garden maintenance and landscaping services",
      features: ["Lawn mowing", "Garden maintenance", "Tree trimming", "Landscaping"]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <BrandHeaderClient />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 tracking-tight">
                Our Services
          </h1>
              <p className="text-gray-300 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12">
                Professional services delivered by verified experts in your area. 
                Book trusted professionals for all your home service needs.
              </p>
              
              {/* CTA Button */}
              <EnhancedButton
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={() => handleButtonClick('bookService', () => window.location.href = '/book-service')}
                loading={loadingStates.bookService}
                loadingText="Loading..."
              >
                <div className="flex items-center space-x-2">
                  <span>Book a Service</span>
                  <ArrowRight className="w-5 h-5" />
        </div>
              </EnhancedButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
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
                What We Offer
              </h2>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                Professional services delivered by verified experts in your area
              </p>
            </motion.div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon
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
                  className="group"
                >
                  <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full hover:bg-white/10">
                    {/* Service Image */}
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <Image 
                        src={service.image} 
                        alt={service.name}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30">
                          {service.category}
                        </span>
                      </div>

                      {/* Service Icon */}
                      <div className="absolute top-4 right-4">
                        <div className={`p-3 bg-gradient-to-r ${service.color} rounded-full shadow-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                </div>
                    </div>

                    {/* Service Content */}
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-3">
                            {service.description}
                          </p>
                          
                          {/* Features */}
                          <div className="space-y-1">
                            {service.features.slice(0, 2).map((feature, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                <span className="text-gray-400 text-xs">{feature}</span>
                    </div>
                  ))}
                          </div>
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-0">
                          <div className="text-blue-400 font-semibold text-base sm:text-lg">
                            {service.price}
                          </div>
                          <EnhancedButton 
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                            onClick={() => handleButtonClick('browseServices', () => window.location.href = '/book-service')}
                            loading={loadingStates.browseServices}
                            loadingText="Booking..."
                          >
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span>Book Now</span>
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
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

          {/* Call to Action */}
          <div className="text-center mt-12 sm:mt-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Ready to Book a Service?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get started by booking your preferred service. Our verified professionals are ready to help.
              </p>
              <EnhancedButton
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={() => handleButtonClick('bookService', () => window.location.href = '/book-service')}
                loading={loadingStates.bookService}
                loadingText="Loading..."
              >
                <div className="flex items-center space-x-2">
                  <span>Start Booking</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </EnhancedButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}