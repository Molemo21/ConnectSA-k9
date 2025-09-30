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
  Construction,
  Wrench
} from "lucide-react"
import { BrandHeader } from "@/components/ui/brand-header"
import { useState, useEffect } from "react"

export default function AboutPage() {
  const [showConstruction, setShowConstruction] = useState(true)
  const [blurContent, setBlurContent] = useState(true)

  useEffect(() => {
    // Show construction overlay for 3 seconds, then blur content
    const timer = setTimeout(() => {
      setShowConstruction(false)
      setBlurContent(true)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])
  const values = [
    { icon: Shield, title: "Transparency", description: "We believe in clear communication and honest business practices that build trust with our clients and service providers." },
    { icon: Star, title: "Quality", description: "We're committed to excellence in every aspect of our platform, from the professionals we verify to the user experience we deliver." },
    { icon: Users, title: "Community", description: "We're building more than a platform—we're creating a community that connects people and strengthens local economies." },
  ]

  const team = [
    { name: "Bubele Mbizeni", role: "Chief Financial Officer", description: "Numbers tell a story—my job is to make sure it's a successful one.", image: "Bubele Mbizeni card background" },
    { name: "Qhawe Mlengana", role: "Project Manager", description: "Great things are never done alone—they're done with great teams.", image: "Qhawe Mlengana card background" },
    { name: "Molemo Nakin", role: "Operations Manager & Lead Developer", description: "Clean code. Clear process. Connected people.", image: "Molemo Nakin card background" },
    { name: "Nontlahla Adonis", role: "Communications & Marketing Manager", description: "A strong message turns interest into trust—and trust into loyalty.", image: "Nontlahla Adonis card background" },
    { name: "Aphiwe Gaya", role: "Business Analyst", description: "Analysis is the bridge between questions and answers that matter.", image: "Aphiwe Gaya card background" },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Verified Providers" },
    { number: "50,000+", label: "Services Completed" },
    { number: "4.8★", label: "Average Rating" },
  ]

  return (
    <div className="min-h-screen gradient-bg-dark text-white relative">
      <BrandHeader showAuth={true} showUserMenu={false} />
      
      {/* Construction Overlay */}
      {showConstruction && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a1626] transition-opacity duration-700">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg mb-6 animate-pulse">
            <Construction className="w-16 h-16 text-white" />
          </div>
          <span className="text-3xl font-bold text-white transition-opacity duration-700 animate-fade-in-out">
            Under Construction
          </span>
          <p className="text-lg text-gray-300 mt-4 text-center max-w-md">
            We're working hard to bring you an amazing About page. Please check back soon!
          </p>
        </div>
      )}

      {/* Floating Construction Notice */}
      {!showConstruction && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg shadow-lg border border-orange-400/30 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span className="font-semibold">Under Construction</span>
          </div>
          <p className="text-sm text-orange-100 mt-1">Page is being updated</p>
        </div>
      )}

      {/* Blurred Content */}
      <div className={`transition-all duration-1000 ${blurContent ? 'blur-sm opacity-50' : 'blur-0 opacity-100'}`}>
      
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/all.jpg')",
              backgroundSize: "120%"
            }}
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              About <span className="text-blue-500">ProLiink Connect</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Connecting skilled professionals with clients across Africa since 2024
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg">
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
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white">
              Our Story
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              ProLiink Connect was founded in 2024 with a simple yet powerful vision: to revolutionize how people connect with service professionals. What began as a solution to the frustration of finding reliable contractors has grown into a comprehensive platform that serves communities across Eastern Cape and beyond.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              We recognized two critical problems in the service industry: clients struggled to find trustworthy, skilled professionals, while talented service providers lacked effective ways to market themselves and grow their businesses. ProLiink Connect bridges this gap, creating a marketplace where quality, reliability, and transparency are paramount.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Today, we're proud to be a leading platform in our market, with thousands of successful service connections made through our platform. As we continue to grow, we remain committed to our core mission: empowering both service providers and customers through technology that makes finding and booking services simpler, safer, and more efficient than ever before.
            </p>
          </div>
          
          {/* Image placeholder for ProLiink service professionals greeting a customer */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-full h-64 bg-gray-800/50 rounded-lg flex items-center justify-center border border-gray-700">
              <p className="text-gray-400">ProLiink service professionals greeting a customer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white">
              Our Mission & Values
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              At ProLiink Connect, we're guided by a set of core values that shape everything we do.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card key={index} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                        <p className="text-gray-300">{value.description}</p>
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
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white">
              Our Impact
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              Numbers that tell the story of our growing community and success.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white">
              Meet Our Leadership Team
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              The passionate individuals driving ProLiink Connect's mission forward.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-blue-400 text-sm mb-2">{member.role}</p>
                  <p className="text-gray-300 text-sm italic">"{member.description}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Team */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white">
              Join Our Team
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              We're always looking for talented individuals who share our passion for connecting people and building innovative solutions.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg">
              <Link href="/contact">
                View Open Positions
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Join thousands of satisfied customers who trust ProLiink Connect for their service needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg">
                <Link href="/book-service">
                  Book a Service
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="px-8 py-4 text-lg text-white border border-white/30 bg-black/60 hover:bg-blue-900/20 backdrop-blur-sm">
                <Link href="/provider/onboarding">Become a Provider</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-12 bg-black">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold">
                <span className="flex flex-col">
                  <span>ProL<span className="text-blue-600">i</span>nk</span>
                  <span>Co<span className="text-blue-600">nn</span>ect</span>
                </span>
              </h3>
              <p className="mt-2 text-sm text-gray-400">The smart way to link professionals and clients.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Quick Links</h3>
              <ul className="mt-2 space-y-2">
                <li><Link href="/about" className="text-sm text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/services" className="text-sm text-gray-400 hover:text-white">Services</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-400 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Services</h3>
              <ul className="mt-2 space-y-2">
                <li><Link href="/services" className="text-sm text-gray-400 hover:text-white">Browse All Services</Link></li>
                <li><Link href="/provider/onboarding" className="text-sm text-gray-400 hover:text-white">Become a Provider</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Contact Us</h3>
              <address className="mt-2 not-italic text-sm text-gray-400">
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
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <div className="flex justify-center space-x-6 mb-4">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white">Terms of Service</Link>
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white">Contact Us</Link>
            </div>
            <p className="text-sm text-gray-400">© 2024 ProLiink Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}




