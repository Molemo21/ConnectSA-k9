"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle,
  Shield,
  Clock,
  Star,
  Users,
  Globe,
  Heart,
  Award,
  Target,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { BrandHeader } from "@/components/ui/brand-header"
import { useState, useEffect } from "react"

// Team Carousel Component
function TeamCarousel({ team }: { team: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % team.length)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + team.length) % team.length)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoRotating) return

    const interval = setInterval(() => {
      if (!isTransitioning) {
        nextSlide()
      }
    }, 4000) // Rotate every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoRotating, isTransitioning])

  // Pause auto-rotation on hover
  const handleMouseEnter = () => setIsAutoRotating(false)
  const handleMouseLeave = () => setIsAutoRotating(true)

  const getCardStyle = (index: number) => {
    const distance = Math.abs(index - currentIndex)
    const isActive = index === currentIndex
    const isLeft = index < currentIndex
    const isRight = index > currentIndex

    let transform = ''
    let opacity = 1
    let scale = 1
    let zIndex = 1

    if (isActive) {
      transform = 'translateX(0)'
      scale = 1
      zIndex = 10
    } else if (isLeft) {
      const offset = (currentIndex - index) * 100
      transform = `translateX(-${offset}px)`
      scale = 1 - (distance * 0.1)
      opacity = 1 - (distance * 0.2)
      zIndex = 5 - distance
    } else if (isRight) {
      const offset = (index - currentIndex) * 100
      transform = `translateX(${offset}px)`
      scale = 1 - (distance * 0.1)
      opacity = 1 - (distance * 0.2)
      zIndex = 5 - distance
    }

    return {
      transform,
      opacity: Math.max(opacity, 0.3),
      scale,
      zIndex,
      transition: isTransitioning ? 'all 0.3s ease-in-out' : 'none'
    }
  }

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <div className="relative h-96 flex items-center justify-center overflow-hidden">
        {team.map((member, index) => (
          <div
            key={index}
            className="absolute flex flex-col items-center"
            style={getCardStyle(index)}
          >
            {/* Photo Card */}
            <Card className="w-72 h-80 bg-gray-800/80 border-gray-700 hover:bg-gray-800/90 transition-all duration-300 shadow-xl hover:shadow-2xl backdrop-blur-sm overflow-hidden rounded-xl hover:scale-105">
              <div className="relative w-full h-full">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
                  style={{
                    backgroundImage: `url(${member.image})`,
                    filter: index === currentIndex 
                      ? 'brightness(1)' 
                      : 'grayscale(100%) brightness(0.8)'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent hover:from-black/40 transition-all duration-300" />
              </div>
            </Card>
            
            {/* Title below card - only show for current card */}
            {index === currentIndex && (
              <div className="mt-4 text-center animate-fade-in">
                <h3 
                  className="text-lg font-semibold text-white mb-1 hover:text-white transition-colors duration-300"
                  style={{
                    textShadow: '0px -1px 0px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {member.name}
                </h3>
                <p 
                  className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors duration-300"
                  style={{
                    textShadow: '0px -1px 0px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {member.role}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center mt-8 space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={isTransitioning}
          className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 disabled:opacity-50 hover:text-white hover:shadow-lg transition-all duration-300"
          style={{
            textShadow: '0px -1px 0px rgba(0, 0, 0, 0.4)'
          }}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Dots */}
        <div className="flex space-x-2">
          {team.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-blue-500 scale-110'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              disabled={isTransitioning}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={isTransitioning}
          className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 disabled:opacity-50 hover:text-white hover:shadow-lg transition-all duration-300"
          style={{
            textShadow: '0px -1px 0px rgba(0, 0, 0, 0.4)'
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Auto-rotation toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`ml-4 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 hover:text-white hover:shadow-lg transition-all duration-300 ${
            isAutoRotating ? 'bg-green-600/20 border-green-500' : ''
          }`}
          style={{
            textShadow: '0px -1px 0px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className={`w-2 h-2 rounded-full ${isAutoRotating ? 'bg-green-400' : 'bg-gray-400'}`} />
        </Button>
      </div>
    </div>
  )
}

export default function AboutPage() {
  const values = [
    { icon: Shield, title: "Transparency", description: "We believe in clear communication and honest business practices that build trust with our clients and service providers." },
    { icon: Star, title: "Quality", description: "We're committed to excellence in every aspect of our platform, from the professionals we verify to the user experience we deliver." },
    { icon: Users, title: "Community", description: "We're building more than a platform—we're creating a community that connects people and strengthens local economies." },
  ]

  const team = [
    { name: "Bubele Mbizeni", role: "Chief Financial Officer", image: "/BBm.jpg" },
    { name: "Qhawe Mlengana", role: "Project Manager", image: "/QM.jpg" },
    { name: "Molemo Nakin", role: "Operations Manager & Lead Developer", image: "/MN.jpg" },
    { name: "Nontlahla Adonis", role: "Communications & Marketing Manager", image: "/NA.jpg" },
    { name: "Aphiwe Gaya", role: "Business Analyst", image: "/AG.jpg" },
    { name: "Asiphe Sikrenya", role: "Intern (Admin)", image: "/AS.jpg" },
    { name: "Ezam Mngombane", role: "Intern (Social Media)", image: "/EM.jpg" },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Verified Providers" },
    { number: "50,000+", label: "Services Completed" },
    { number: "4.8★", label: "Average Rating" },
  ]

  return (
    <div className="min-h-screen gradient-bg-dark text-white relative overflow-hidden animate-fade-in">
      <BrandHeader showAuth={true} showUserMenu={false} />
      
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden flex items-center justify-center animate-slide-in-up">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
            style={{
              backgroundImage: "url('/all.jpg')",
              backgroundSize: "120%"
            }}
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg animate-fade-in">
              About <span className="text-blue-500">ProLiink Connect</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              Connecting skilled professionals with clients across Africa since 2024
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/">
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white animate-fade-in">
              Our Story
            </h2>
            <div className="space-y-6 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-lg text-gray-300 leading-relaxed">
                ProLiink Connect was founded in 2024 with a simple yet powerful vision: to revolutionize how people connect with service professionals. What began as a solution to the frustration of finding reliable contractors has grown into a comprehensive platform that serves communities across Eastern Cape and beyond.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                We recognized two critical problems in the service industry: clients struggled to find trustworthy, skilled professionals, while talented service providers lacked effective ways to market themselves and grow their businesses. ProLiink Connect bridges this gap, creating a marketplace where quality, reliability, and transparency are paramount.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Today, we're proud to be a leading platform in our market, with thousands of successful service connections made through our platform. As we continue to grow, we remain committed to our core mission: empowering both service providers and customers through technology that makes finding and booking services simpler, safer, and more efficient than ever before.
              </p>
            </div>
          </div>
          
          {/* Enhanced Image placeholder */}
          <div className="max-w-4xl mx-auto text-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-full h-64 bg-gray-800/50 rounded-xl flex items-center justify-center border border-gray-700 backdrop-blur-sm shadow-xl hover:bg-gray-800/60 transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-400 font-medium">ProLiink service professionals greeting a customer</p>
                <p className="text-gray-500 text-sm mt-2">Building connections, one service at a time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-900 relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white animate-fade-in">
              Our Mission & Values
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              At ProLiink Connect, we're guided by a set of core values that shape everything we do.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card key={index} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 shadow-xl backdrop-blur-sm animate-slide-in-up" style={{ animationDelay: `${0.1 * index}s` }}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white animate-fade-in">
              Our Impact
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              Numbers that tell the story of our growing community and success.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 shadow-lg animate-slide-in-up" style={{ animationDelay: `${0.1 * index}s` }}>
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm md:text-base font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/back.jpg')",
              backgroundSize: "cover"
            }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white animate-fade-in">
              Meet Our Leadership Team
            </h2>
          </div>
          
          <TeamCarousel team={team} />
        </div>
      </section>

      {/* Join Our Team */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white animate-fade-in">
              Join Our Team
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              We're always looking for talented individuals who share our passion for connecting people and building innovative solutions.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg transition-all duration-300 hover:scale-105 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <Link href="/contact">
                View Open Positions
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white animate-fade-in">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              Join thousands of satisfied customers who trust ProLiink Connect for their service needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/book-service">
                  Book a Service
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="px-8 py-4 text-lg text-white border border-white/30 bg-black/60 hover:bg-blue-900/20 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Link href="/provider/onboarding">Become a Provider</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800 py-12 bg-black relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-lg font-bold mb-4">
                <span className="flex flex-col">
                  <span>ProL<span className="text-blue-600">i</span>nk</span>
                  <span>Co<span className="text-blue-600">nn</span>ect</span>
                </span>
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">The smart way to link professionals and clients across South Africa.</p>
            </div>
            <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">About Us</Link></li>
                <li><Link href="/services" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Services</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Contact Us</Link></li>
              </ul>
            </div>
            <div className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-lg font-bold text-white mb-4">Services</h3>
              <ul className="space-y-3">
                <li><Link href="/services" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Browse All Services</Link></li>
                <li><Link href="/provider/onboarding" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Become a Provider</Link></li>
              </ul>
            </div>
            <div className="animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
              <address className="not-italic text-sm text-gray-400 leading-relaxed">
                <p className="mb-2">49 Leeds Street</p>
                <p className="mb-2">Cnr Leeds & Creister street</p>
                <p className="mb-2">Mthatha, Eastern Cape</p>
                <p className="mb-4">5099</p>
                <div className="space-y-1">
                  <p>Email: <span className="text-blue-400">support@proliinkconnect.co.za</span></p>
                  <p>Phone: <span className="text-blue-400">+27 68 947 6401</span></p>
                </div>
              </address>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex justify-center space-x-6 mb-4">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</Link>
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">Contact Us</Link>
            </div>
            <p className="text-sm text-gray-400">© 2024 ProLiink Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
