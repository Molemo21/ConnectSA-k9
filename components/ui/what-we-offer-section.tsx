"use client"

import { Card, CardContent } from "@/components/ui/card"
import { 
  Shield, 
  Clock, 
  Smartphone, 
  MessageSquare,
  CheckCircle,
  Zap,
  Laptop,
  ChatBubbleLeftRight
} from "lucide-react"

export function WhatWeOfferSection() {
  const features = [
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All providers are background-checked and verified for safety.",
      gradient: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      hoverGlow: "hover:shadow-blue-500/25"
    },
    {
      icon: Clock,
      title: "Fast & Flexible Booking",
      description: "Book services when you need them — without the hassle.",
      gradient: "from-green-500/20 to-green-600/20",
      iconColor: "text-green-400",
      iconBg: "bg-green-500/10",
      hoverGlow: "hover:shadow-green-500/25"
    },
    {
      icon: Smartphone,
      title: "User-Friendly Platform",
      description: "Browse, book, and manage services seamlessly on any device.",
      gradient: "from-purple-500/20 to-purple-600/20",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
      hoverGlow: "hover:shadow-purple-500/25"
    },
    {
      icon: MessageSquare,
      title: "Transparent Communication",
      description: "Chat directly with providers and track your bookings in real-time.",
      gradient: "from-orange-500/20 to-orange-600/20",
      iconColor: "text-orange-400",
      iconBg: "bg-orange-500/10",
      hoverGlow: "hover:shadow-orange-500/25"
    }
  ]

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/contractor.jpg')"
          }}
        />
        {/* Dimming overlay */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-purple-900/40 to-slate-900/40" />
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
            Why Choose ProLiink?
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto drop-shadow-lg font-medium">
            Your smarter, safer way to hire trusted service providers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className={`group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${feature.hoverGlow} hover:shadow-2xl shadow-lg`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <CardContent className="relative p-8">
                  <div className="flex items-start space-x-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white transition-colors duration-300 drop-shadow-lg">
                        {feature.title}
                      </h3>
                      <p className="text-slate-300 text-lg leading-relaxed group-hover:text-white/90 transition-colors duration-300 drop-shadow-md">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors duration-300"></div>
                  <div className="absolute bottom-4 right-4 w-1 h-1 bg-white/40 rounded-full group-hover:bg-white/60 transition-colors duration-300"></div>
                </CardContent>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%]"></div>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 shadow-lg hover:bg-white/15 hover:border-white/30 transition-all duration-300">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium drop-shadow-lg">Trusted by thousands of satisfied customers</span>
          </div>
        </div>
      </div>
    </section>
  )
}
