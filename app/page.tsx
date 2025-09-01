import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Shield, Clock, Star, Wrench, Zap, SprayCan, Paintbrush, Flower, Scissors, Sparkles, ArrowRight, Play, MapPin, Phone } from "lucide-react"
import { BrandHeaderServer } from "@/components/ui/brand-header-server"

export default function HomePage() {
  const services = [
    { name: "House Cleaning", category: "Cleaning", price: "From R150/hr", icon: SprayCan, color: "from-blue-500 to-blue-600" },
    { name: "Plumbing", category: "Maintenance", price: "From R200/hr", icon: Wrench, color: "from-orange-500 to-orange-600" },
    { name: "Electrical Work", category: "Maintenance", price: "From R250/hr", icon: Zap, color: "from-yellow-500 to-yellow-600" },
    { name: "Garden Services", category: "Outdoor", price: "From R120/hr", icon: Flower, color: "from-green-500 to-green-600" },
    { name: "Painting", category: "Home Improvement", price: "From R180/hr", icon: Paintbrush, color: "from-purple-500 to-purple-600" },
    { name: "Moving Services", category: "Logistics", price: "From R300/hr", icon: Scissors, color: "from-pink-500 to-pink-600" },
  ]

  const features = [
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All service providers are background-checked and verified for your safety",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Clock,
      title: "Quick Booking",
      description: "Book services in minutes and get instant confirmation",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Users,
      title: "Trusted by Thousands",
      description: "Join over 10,000 satisfied customers across South Africa",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "All services come with our satisfaction guarantee",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Verified Providers" },
    { number: "50,000+", label: "Services Completed" },
    { number: "4.8★", label: "Average Rating" },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <BrandHeaderServer showUserMenu={true} />

      {/* Hero Section - Mobile First */}
      <section className="relative py-12 sm:py-16 lg:py-20 xl:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Trusted by 10,000+ customers
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              Find Trusted Service
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Providers Near You
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              Connect with verified professionals for cleaning, maintenance, repairs, and more. 
              Quality service guaranteed across South Africa.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
                <Link href="/book-service">
                  Book a Service
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
                <Link href="/provider/onboarding">
                  Become a Provider
                </Link>
              </Button>
            </div>

            {/* Stats - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Mobile First */}
      <section id="services" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Popular Services
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              From cleaning to repairs, we've got you covered with trusted professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white hover:scale-105">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${service.color} rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 leading-tight">{service.name}</h3>
                        <p className="text-gray-600 mb-2 text-sm sm:text-base">{service.category}</p>
                        <p className="text-blue-600 font-medium text-sm sm:text-base">{service.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Mobile First */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Get started in just a few simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Book a Service", description: "Choose from our wide range of services and book instantly" },
              { step: "2", title: "Get Matched", description: "We'll connect you with verified professionals in your area" },
              { step: "3", title: "Enjoy Quality", description: "Sit back and relax while we handle the rest" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg sm:text-xl">{item.step}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 leading-tight">{item.title}</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Mobile First */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose ProLiink Connect
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              We make finding trusted service providers simple and secure
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 border-0 bg-white hover:scale-105">
                  <CardContent className="p-4 sm:p-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 leading-tight">{feature.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile First */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of satisfied customers who trust ProLiink Connect for their service needs
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button asChild size="lg" variant="secondary" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
              <Link href="/book-service">
                Book Your First Service
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
              <Link href="/provider/onboarding">
                Become a Provider
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Mobile First */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-base">P</span>
                </div>
                <span className="text-lg sm:text-xl font-bold">ProLiink Connect</span>
              </div>
              <p className="text-gray-400 mb-4 text-sm sm:text-base leading-relaxed">
                Connecting trusted service providers with customers across South Africa.
              </p>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="font-semibold mb-4 text-base sm:text-lg">Services</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link href="#" className="hover:text-white transition-colors">House Cleaning</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Plumbing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Electrical</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Painting</Link></li>
              </ul>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="font-semibold mb-4 text-base sm:text-lg">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Become a Provider</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="font-semibold mb-4 text-base sm:text-lg">Contact</h3>
              <div className="space-y-2 text-gray-400 text-sm sm:text-base">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+27 123 456 789</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>South Africa</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 ProLiink Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
