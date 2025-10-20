"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ChevronRight, Clock, DollarSign, Lock, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"

// Services data structure with exact specifications
const services = [
  // ACTIVE SERVICES (no comingSoon flag)
  {
    id: 3, slug: "cleaning", title: "Cleaning", 
    description: "Professional cleaning services for your home or office.",
    category: "Home Services", subcategories: ["Deep cleaning", "Regular cleaning", "Carpet cleaning", "End of lease"],
    price: "From R250", image: "/services/Cleaner 2.jpg", icon: "🧹"
  },
  {
    id: 5, slug: "hairdressing", title: "Hairdressing",
    description: "Professional hairdressing and styling services.", 
    category: "Beauty", subcategories: ["Haircuts", "Coloring", "Styling", "Treatments"],
    price: "From R200", image: "/services/hairdresser.webp", icon: "✂️"
  },
  {
    id: 15, slug: "makeup", title: "Makeup Services",
    description: "Professional makeup for all occasions.",
    category: "Beauty", subcategories: ["Bridal makeup", "Special effects", "Glamour", "Airbrush"],
    price: "From R250", image: "/services/makeup.jpg", icon: "💄"
  },
  
  // COMING SOON SERVICES (with comingSoon: true)
  {
    id: 1, slug: "plumbing", title: "Plumbing", comingSoon: true,
    description: "Professional plumbing services for homes and businesses.",
    category: "Home Services", subcategories: ["Leak repairs", "Pipe installation", "Drain cleaning", "Toilet repair"],
    price: "From R300", image: "/services/Plumber 2.jpg", icon: "🔧"
  },
  {
    id: 2, slug: "electrical", title: "Electrical", comingSoon: true,
    description: "Certified electricians for all your electrical needs.",
    category: "Home Services", subcategories: ["Wiring", "Lighting installation", "Fuse box upgrades", "Appliance repair"],
    price: "From R400", image: "/services/electricity.jpg", icon: "⚡"
  },
  {
    id: 4, slug: "carpentry", title: "Carpentry", comingSoon: true,
    description: "Custom woodwork and furniture building services.",
    category: "Home Services", subcategories: ["Furniture making", "Cabinets", "Shelving", "Door installation"],
    price: "From R350", image: "/services/plank.jpg", icon: "🔨"
  },
  {
    id: 7, slug: "it-support", title: "IT Support", comingSoon: true,
    description: "Professional IT support and computer services.",
    category: "Technology", subcategories: ["Virus removal", "Hardware repair", "Network setup", "Data recovery"],
    price: "From R350", image: "/services/support.jpg", icon: "💻"
  },
  {
    id: 8, slug: "gardening", title: "Gardening", comingSoon: true,
    description: "Landscaping and garden maintenance services.",
    category: "Home Services", subcategories: ["Lawn mowing", "Hedge trimming", "Garden design", "Tree surgery"],
    price: "From R200", image: "/services/skere.jpg", icon: "🌱"
  },
  {
    id: 10, slug: "painting", title: "Painting", comingSoon: true,
    description: "Professional interior and exterior painting services.",
    category: "Home Services", subcategories: ["Wall painting", "Wallpaper installation", "Color consultation", "Surface preparation"],
    price: "From R350", image: "/services/paint.jpg", icon: "🎨"
  },
  {
    id: 11, slug: "security-systems", title: "Security System Installation", comingSoon: true,
    description: "Professional installation of home and business security systems.",
    category: "Home Services", subcategories: ["CCTV installation", "Alarm systems", "Access control", "Smart home security"],
    price: "From R1500", image: "/services/security 3.jpg", icon: "🔒"
  },
  {
    id: 12, slug: "mobile-car-wash", title: "Mobile Car Wash", comingSoon: true,
    description: "Professional car washing services at your location.",
    category: "Automotive", subcategories: ["Exterior wash", "Interior cleaning", "Waxing", "Detailing"],
    price: "From R150", image: "/services/Mobile carwash 6.jpg", icon: "🚗"
  },
  {
    id: 13, slug: "laundry", title: "Laundry Services", comingSoon: true,
    description: "Professional laundry and dry cleaning services.",
    category: "Home Services", subcategories: ["Wash & fold", "Dry cleaning", "Ironing", "Specialty fabric care"],
    price: "From R80/kg", image: "/services/laundry.jpg", icon: "👕"
  },
  {
    id: 14, slug: "moving-delivery", title: "Moving & Delivery", comingSoon: true,
    description: "Reliable moving and delivery services for homes and businesses.",
    category: "Transportation", subcategories: ["Local moves", "Furniture delivery", "Office relocation", "Packing services"],
    price: "From R300", image: "/services/moving 3.jpg", icon: "🚚"
  },
  {
    id: 16, slug: "nails", title: "Nail Services", comingSoon: true,
    description: "Professional nail care and design.",
    category: "Beauty", subcategories: ["Manicures", "Pedicures", "Gel nails", "Nail art"],
    price: "From R150", image: "/services/nails.jpg", icon: "💅"
  },
  {
    id: 17, slug: "spa-treatment", title: "Spa Treatment", comingSoon: true,
    description: "Relaxing and rejuvenating spa treatments.",
    category: "Wellness", subcategories: ["Massage", "Facials", "Body wraps", "Aromatherapy"],
    price: "From R350", image: "/services/spa treatment 5.jpg", icon: "🧖"
  },
  {
    id: 18, slug: "car-maintenance", title: "Car Maintenance", comingSoon: true,
    description: "Professional car maintenance and servicing.",
    category: "Automotive", subcategories: ["Oil changes", "Brake service", "Tire rotation", "Engine diagnostics"],
    price: "From R400", image: "/services/car m3.jpg", icon: "🔧"
  },
  {
    id: 19, slug: "pest-control", title: "Pest Control", comingSoon: true,
    description: "Effective pest control solutions for homes and businesses.",
    category: "Home Services", subcategories: ["Termite control", "Rodent removal", "Fumigation", "Preventative treatments"],
    price: "From R500", image: "/services/pest.jpg", icon: "🐜"
  }
]

const categories = ["All", "Home Services", "Beauty", "Technology", "Automotive", "Transportation", "Wellness"]

export default function ServicesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [filteredServices, setFilteredServices] = useState(services)

  // Filter services based on search query and category
  useEffect(() => {
    let filtered = services

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(service => service.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.subcategories.some(sub => sub.toLowerCase().includes(query))
      )
    }

    // Sort: Active services first, then coming soon (by ID)
    filtered.sort((a, b) => {
      if (a.comingSoon && !b.comingSoon) return 1
      if (!a.comingSoon && b.comingSoon) return -1
      return a.id - b.id
    })

    setFilteredServices(filtered)
  }, [searchQuery, selectedCategory])

  const handleBookService = (slug: string, comingSoon?: boolean) => {
    if (comingSoon) return
    router.push(`/book-service?service=${slug}`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/services/serv.jpg')" }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Text Content */}
              <div className="text-center lg:text-left animate-slide-in-up">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Find the Right Service for Your Needs
                </h1>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  From plumbing emergencies to electrical installations, ProLiink Connect has you covered.
                </p>
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <Link href="/book-service">
                    Book a Service
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>

              {/* Right Column - Image Gallery */}
              <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="columns-2 gap-4 space-y-4">
                  {/* Tall image */}
                  <div className="break-inside-avoid">
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                      <img 
                        src="/services/makeup.jpg" 
                        alt="Makeup Services" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Square image */}
                  <div className="break-inside-avoid">
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                      <img 
                        src="/services/electricity.jpg" 
                        alt="Electrical Services" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Wide image */}
                  <div className="break-inside-avoid">
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                      <img 
                        src="/services/laundry.jpg" 
                        alt="Laundry Services" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="w-full py-8 bg-black/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/15"
                />
              </div>

              {/* Category Dropdown */}
              <div className="w-full sm:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="w-full py-16 bg-black/60 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service, index) => (
                <Card 
                  key={service.id} 
                  className={`group relative bg-white/10 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300 animate-slide-in-up ${
                    service.comingSoon 
                      ? 'opacity-60 grayscale hover:opacity-70 hover:grayscale-[0.8]' 
                      : 'hover:bg-white/15'
                  }`}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  {/* Coming Soon Badge */}
                  {service.comingSoon && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-orange-500 text-white text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        service.comingSoon 
                          ? 'grayscale group-hover:grayscale-[0.8]' 
                          : 'group-hover:scale-105'
                      }`}
                    />
                  </div>

                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <h3 className={`font-semibold text-lg ${
                          service.comingSoon ? 'text-gray-400' : 'text-white'
                        }`}>
                          {service.title}
                        </h3>
                        <p className={`text-sm ${
                          service.comingSoon ? 'text-gray-500' : 'text-gray-300'
                        }`}>
                          {service.category}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-sm mb-4 ${
                      service.comingSoon ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {service.description}
                    </p>

                    {/* Subcategories */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {service.subcategories.slice(0, 3).map((subcategory, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className={`text-xs ${
                              service.comingSoon 
                                ? 'border-gray-600 text-gray-500' 
                                : 'border-gray-400 text-gray-300'
                            }`}
                          >
                            {subcategory}
                          </Badge>
                        ))}
                        {service.subcategories.length > 3 && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              service.comingSoon 
                                ? 'border-gray-600 text-gray-500' 
                                : 'border-gray-400 text-gray-300'
                            }`}
                          >
                            +{service.subcategories.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price and Button */}
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${
                        service.comingSoon ? 'text-gray-400' : 'text-white'
                      }`}>
                        {service.price}
                      </span>
                      <Button
                        onClick={() => handleBookService(service.slug, service.comingSoon)}
                        disabled={service.comingSoon}
                        className={`${
                          service.comingSoon
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                        }`}
                        size="sm"
                      >
                        {service.comingSoon ? 'Coming Soon' : 'Book Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="w-full py-16 bg-black/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Book with ProLiink Connect?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                We're committed to providing reliable, high-quality services through our trusted platform.
              </p>
            </div>

            {/* Trust Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center p-6 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Vetted Professionals</h3>
                  <p className="text-gray-300 text-sm">All providers are verified and background checked</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center p-6 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Secure Payments</h3>
                  <p className="text-gray-300 text-sm">Safe and encrypted payment processing</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center p-6 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Quick Turnaround</h3>
                  <p className="text-gray-300 text-sm">Fast booking and service delivery</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center p-6 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Transparent Pricing</h3>
                  <p className="text-gray-300 text-sm">No hidden fees, clear upfront pricing</p>
                </CardContent>
              </Card>
            </div>

            {/* Handshake Image */}
            <div className="text-center">
              <img 
                src="/services/handshake.png" 
                alt="Trust and Partnership" 
                className="max-w-xs w-full rounded-xl shadow-lg mx-auto"
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-16 bg-black/60 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Book a Reliable Pro?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Get started today and connect with skilled professionals in your area.
                </p>
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <Link href="/book-service">
                    Get Started
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>

              {/* Right Column - 2x2 Image Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src="/services/security 3.jpg" 
                    alt="Security Services" 
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src="/services/Mobile carwash 6.jpg" 
                    alt="Mobile Car Wash" 
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src="/services/spa treatment 5.jpg" 
                    alt="Spa Treatment" 
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src="/services/car m3.jpg" 
                    alt="Car Maintenance" 
                    className="h-32 w-full object-cover"
                  />
                </div>
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
    </div>
  )
}