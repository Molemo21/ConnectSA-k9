import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Shield, Clock, Star, Wrench, Zap, SprayCan, Paintbrush, Flower, Scissors, Sparkles } from "lucide-react"

export default function HomePage() {
  const services = [
    { name: "House Cleaning", category: "Cleaning", price: "From R150/hr" },
    { name: "Plumbing", category: "Maintenance", price: "From R200/hr" },
    { name: "Electrical Work", category: "Maintenance", price: "From R250/hr" },
    { name: "Garden Services", category: "Outdoor", price: "From R120/hr" },
    { name: "Painting", category: "Home Improvement", price: "From R180/hr" },
    { name: "Moving Services", category: "Logistics", price: "From R300/hr" },
  ]

  const features = [
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All service providers are background-checked and verified",
    },
    {
      icon: Clock,
      title: "Quick Booking",
      description: "Book services in minutes and get instant confirmation",
    },
    {
      icon: Users,
      title: "Trusted by Thousands",
      description: "Join over 10,000 satisfied customers across South Africa",
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "All services come with our satisfaction guarantee",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-white">ProLiink Connect</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#services" className="text-gray-300 hover:text-primary transition-colors">
              Services
            </Link>
            <Link href="#how-it-works" className="text-gray-300 hover:text-primary transition-colors">
              How it Works
            </Link>
            <Link href="#providers" className="text-gray-300 hover:text-primary transition-colors">
              Become a Provider
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative text-white py-20 overflow-hidden">
        {/* Background Map */}
        <div className="absolute inset-0 z-0">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d5585.4541884300825!2d28.785907410921308!3d-31.58744534348173!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sza!4v1753262755649!5m2!1sen!2sza" 
            width="100%" 
            height="100%" 
            style={{border: 0}} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full object-cover"
          />
          {/* Dimming overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-black/80 to-gray-900/90"></div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Find Trusted Service
            <br />
            <span className="text-blue-200">Providers Near You</span>
          </h1>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto drop-shadow-md">
            Connect with verified professionals for cleaning, maintenance, repairs, and more. Quality service guaranteed
            across South Africa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/book-service">Book a Service</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-primary backdrop-blur-sm"
              asChild
            >
              <Link href="/signup?role=provider">Become a Provider</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Popular Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[
              {
                name: "Cleaning",
                icon: <Sparkles className="w-10 h-10 text-blue-500" />, 
                desc: "Sparkling clean homes in hours",
              },
              {
                name: "Plumbing",
                icon: <Wrench className="w-10 h-10 text-green-500" />, 
                desc: "Fast, reliable pipe repairs",
              },
              {
                name: "Electrical",
                icon: <Zap className="w-10 h-10 text-yellow-500" />, 
                desc: "Safe and expert electricians",
              },
              {
                name: "Gardening",
                icon: <Flower className="w-10 h-10 text-emerald-500" />, 
                desc: "Beautiful gardens, made easy",
              },
              {
                name: "Painting",
                icon: <Paintbrush className="w-10 h-10 text-pink-500" />, 
                desc: "Fresh paint, new look",
              },
              {
                name: "Hair",
                icon: <Scissors className="w-10 h-10 text-purple-500" />, 
                desc: "Salon-quality at home",
              },
              {
                name: "Spa",
                icon: <Sparkles className="w-10 h-10 text-sky-400" />, 
                desc: "Relax and rejuvenate",
              },
            ].map((service) => (
              <div
                key={service.name}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-200 p-7 flex flex-col items-center text-center cursor-pointer"
              >
                <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                  {service.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{service.name}</h3>
                <p className="text-gray-500 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ServiceHub SA?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-green-100">Join thousands of satisfied customers and providers</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Find Services</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-primary"
              asChild
            >
              <Link href="/signup?role=provider">Offer Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold">ServiceHub SA</span>
              </div>
              <p className="text-gray-400">
                South Africa's trusted marketplace for home services and professional providers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/signup" className="hover:text-white transition-colors">
                    Book Services
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Safety
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/signup?role=provider" className="hover:text-white transition-colors">
                    Join as Provider
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Provider Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Earnings
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms & Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ServiceHub SA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
