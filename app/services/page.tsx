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

interface Service {
  id: number
  slug: string
  title: string
  description: string
  category: string
  subcategories: string[]
  price: string
  image: string
  icon: string
  comingSoon?: boolean
  longDescription?: string
  benefits?: string[]
  faqs?: { question: string; answer: string }[]
}

// Services data with images and coming soon status
const services: (Service & { comingSoon?: boolean })[] = [
  // Services with images
  {
    id: 1,
    slug: "plumbing",
    title: "Plumbing",
    description: "Professional plumbing services for homes and businesses.",
    category: "Home Services",
    subcategories: ["Leak repairs", "Pipe installation", "Drain cleaning", "Toilet repair"],
    price: "From R300",
    image: "/services/Plumber 2.jpg",
    icon: "🔧"
  },
  {
    id: 2,
    slug: "electrical",
    title: "Electrical",
    description: "Certified electricians for all your electrical needs.",
    category: "Home Services",
    subcategories: ["Wiring", "Lighting installation", "Fuse box upgrades", "Appliance repair"],
    price: "From R400",
    image: "/services/electricity.jpg",
    icon: "⚡"
  },
  {
    id: 3,
    slug: "cleaning",
    title: "Cleaning",
    description: "Professional cleaning services for your home or office.",
    category: "Home Services",
    subcategories: ["Deep cleaning", "Regular cleaning", "Carpet cleaning", "End of lease"],
    price: "From R250",
    image: "/services/Cleaner 2.jpg",
    icon: "🧹"
  },
  {
    id: 4,
    slug: "carpentry",
    title: "Carpentry",
    description: "Custom woodwork and furniture building services.",
    category: "Home Services",
    subcategories: ["Furniture making", "Cabinets", "Shelving", "Door installation"],
    price: "From R350",
    image: "/services/plank.jpg",
    icon: "🔨"
  },
  {
    id: 5,
    slug: "hairdressing",
    title: "Hairdressing",
    description: "Professional hairdressing and styling services.",
    category: "Beauty",
    subcategories: ["Haircuts", "Coloring", "Styling", "Treatments"],
    price: "From R200",
    image: "/services/hairdresser.webp",
    icon: "✂️"
  },
  {
    id: 7,
    slug: "it-support",
    title: "IT Support",
    description: "Professional IT support and computer services.",
    category: "Technology",
    subcategories: ["Virus removal", "Hardware repair", "Network setup", "Data recovery"],
    price: "From R350",
    image: "/services/support.jpg",
    icon: "💻"
  },
  {
    id: 8,
    slug: "gardening",
    title: "Gardening",
    description: "Landscaping and garden maintenance services.",
    category: "Home Services",
    subcategories: ["Lawn mowing", "Hedge trimming", "Garden design", "Tree surgery"],
    price: "From R200",
    image: "/services/skere.jpg",
    icon: "🌱"
  },
  {
    id: 10,
    slug: "painting",
    title: "Painting",
    description: "Professional interior and exterior painting services.",
    category: "Home Services",
    subcategories: ["Wall painting", "Wallpaper installation", "Color consultation", "Surface preparation"],
    price: "From R350",
    image: "/services/paint.jpg",
    icon: "🎨"
  },
  {
    id: 11,
    slug: "security-systems",
    title: "Security System Installation",
    description: "Professional installation of home and business security systems.",
    category: "Home Services",
    subcategories: ["CCTV installation", "Alarm systems", "Access control", "Smart home security"],
    price: "From R1500",
    image: "/services/security 3.jpg",
    icon: "🔒"
  },
  {
    id: 12,
    slug: "mobile-car-wash",
    title: "Mobile Car Wash",
    description: "Professional car washing services at your location.",
    category: "Automotive",
    subcategories: ["Exterior wash", "Interior cleaning", "Waxing", "Detailing"],
    price: "From R150",
    image: "/services/Mobile carwash 6.jpg",
    icon: "🚗"
  },
  {
    id: 13,
    slug: "laundry",
    title: "Laundry Services",
    description: "Professional laundry and dry cleaning services.",
    category: "Home Services",
    subcategories: ["Wash & fold", "Dry cleaning", "Ironing", "Specialty fabric care"],
    price: "From R80/kg",
    image: "/services/laundry.jpg",
    icon: "👕"
  },
  {
    id: 14,
    slug: "moving-delivery",
    title: "Moving & Delivery",
    description: "Reliable moving and delivery services for homes and businesses.",
    category: "Transportation",
    subcategories: ["Local moves", "Furniture delivery", "Office relocation", "Packing services"],
    price: "From R300",
    image: "/services/moving 3.jpg",
    icon: "🚚"
  },
  {
    id: 15,
    slug: "makeup",
    title: "Makeup Services",
    description: "Professional makeup for all occasions.",
    category: "Beauty",
    subcategories: ["Bridal makeup", "Special effects", "Glamour", "Airbrush"],
    price: "From R250",
    image: "/services/makeup.jpg",
    icon: "💄"
  },
  {
    id: 16,
    slug: "nails",
    title: "Nail Services",
    description: "Professional nail care and design.",
    category: "Beauty",
    subcategories: ["Manicures", "Pedicures", "Gel nails", "Nail art"],
    price: "From R150",
    image: "/services/nails.jpg",
    icon: "💅"
  },
  {
    id: 17,
    slug: "spa-treatment",
    title: "Spa Treatment",
    description: "Relaxing and rejuvenating spa treatments.",
    category: "Wellness",
    subcategories: ["Massage", "Facials", "Body wraps", "Aromatherapy"],
    price: "From R350",
    image: "/services/spa treatment 5.jpg",
    icon: "🧖"
  },
  {
    id: 18,
    slug: "car-maintenance",
    title: "Car Maintenance",
    description: "Professional car maintenance and servicing.",
    category: "Automotive",
    subcategories: ["Oil changes", "Brake service", "Tire rotation", "Engine diagnostics"],
    price: "From R400",
    image: "/services/car m3.jpg",
    icon: "🔧"
  },
  {
    id: 19,
    slug: "pest-control",
    title: "Pest Control",
    description: "Effective pest control solutions for homes and businesses.",
    category: "Home Services",
    subcategories: ["Termite control", "Rodent removal", "Fumigation", "Preventative treatments"],
    price: "From R500",
    image: "/services/pest.jpg",
    icon: "🐜"
  }
]

// Categories for filtering
const categories = ["All", "Home Services", "Beauty", "Technology", "Automotive", "Transportation"]

// Sort services: ones with images first
const sortedServices = [...services].sort((a, b) => {
  // Services with images come first
  if (a.image && !b.image) return -1;
  if (!a.image && b.image) return 1;
  // Then sort by ID
  return a.id - b.id;
});

export default function ServicesPage() {
  const router = useRouter()
  const [filteredServices, setFilteredServices] = useState<(Service & { comingSoon?: boolean })[]>(sortedServices);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter function
  const handleFilterChange = (category: string, search: string) => {
    let filtered = [...services]

    // Filter by category
    if (category !== "All") {
      filtered = filtered.filter((service) => service.category === category)
    }

    // Filter by search term
    if (search) {
      const term = search.toLowerCase()
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term) ||
          service.subcategories.some((sub) => sub.toLowerCase().includes(term)),
      )
    }

    setFilteredServices(filtered)
  }

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    handleFilterChange(category, searchTerm);
  }

  // Handle search change
  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    handleFilterChange(selectedCategory, search);
  }

  // Reset filters on initial load
  useEffect(() => {
    setFilteredServices(sortedServices)
  }, [])

  const [contentReady, setContentReady] = useState(false);
  useEffect(() => {
    setTimeout(() => setContentReady(true), 10);
  }, []);
  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/serv.jpg')" }}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Top right navigation buttons */}
      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <Button variant="outline" onClick={() => router.back()} className="border border-white/30 bg-black/60 text-white hover:bg-blue-900/20">
          Back
        </Button>
        <Link href="/">
          <Button variant="outline" className="border border-white/30 bg-black/60 text-white hover:bg-blue-900/20">
            Home
          </Button>
        </Link>
      </div>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 overflow-hidden">
          <div className="container relative z-10 px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className={`space-y-6 transition-all duration-700 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}> 
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white">
                  Find the Right Service for Your Needs
                </h1>
                <p className="text-xl text-gray-300">
                  From plumbing emergencies to electrical installations, ProLiink Connect has you covered.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                    Book a Service
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="w-full max-w-2xl">
                  <div className="columns-2 gap-4 space-y-4">
                    {/* Makeup - Tall */}
                    <div className="mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                      <img
                        src="/services/makeup.jpg"
                        alt="Makeup artist at work"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    
                    {/* Electricity - Square */}
                    <div className="mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                      <img
                        src="/services/electricity.jpg"
                        alt="Electrician working"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    
                    {/* Laundry - Wide */}
                    <div className="mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                      <img
                        src="/services/laundry.jpg"
                        alt="Laundry service"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Services Section */}
        <section className="w-full py-16 md:py-24 bg-black/80 backdrop-blur-sm">
          <div className="container px-4 md:px-6 relative z-10">
            {/* Filter Section */}
            <div className="mb-12">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="text-white hover:bg-gray-800">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.length > 0 ? (
                filteredServices.map((service, index) => (
                  <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30">
                    <div className="relative">
                      {service.image ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <div className="text-6xl">{service.icon}</div>
                        </div>
                      )}
                      {service.comingSoon && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{service.icon}</span>
                        <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                      </div>
                      <CardDescription className="text-gray-300">{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {service.subcategories.slice(0, 3).map((sub, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                              {sub}
                            </Badge>
                          ))}
                          {service.subcategories.length > 3 && (
                            <Badge variant="outline" className="text-xs border-white/30 text-white">
                              +{service.subcategories.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-blue-400">
                            {service.price}
                          </span>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                            disabled={service.comingSoon}
                            onClick={() => router.push(`/book-service?service=${service.slug}`)}
                          >
                            {service.comingSoon ? "Coming Soon" : "Book Now"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-300">No services found matching your criteria.</p>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchTerm("");
                      handleFilterChange("All", "");
                    }} 
                    className="mt-2 text-blue-400 hover:text-blue-300"
                  >
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="w-full py-16 md:py-24 bg-black/60 backdrop-blur-sm">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">Why Book with ProLiink Connect?</h2>
                <p className="max-w-[700px] text-gray-300">
                  We're committed to providing reliable, high-quality services through our trusted platform.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Vetted Professionals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    All service providers are thoroughly vetted and verified for your safety and peace of mind.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Secure Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Pay securely through our platform with transparent pricing and no hidden fees.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Quick Turnaround</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Get matched with available professionals quickly, even for urgent service needs.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6 bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Transparent Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Clear pricing information upfront so you know exactly what to expect.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center mt-10">
              <img src="/Handshake.png" alt="Handshake" className="max-w-xs w-full rounded-xl shadow-lg" />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-16 md:py-24 bg-black/80 backdrop-blur-sm text-white relative overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                  Ready to Book a Reliable Pro?
                </h2>
                <p className="text-xl text-gray-300">Get started today and connect with skilled professionals in your area.</p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <Link href="/book-service">
                    Get Started <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="relative w-full">
                <div className="relative w-full rounded-xl overflow-hidden bg-gray-900/50 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <img
                      src="/services/security 3.jpg"
                      alt="Security installation"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <img
                      src="/services/Mobile carwash 6.jpg"
                      alt="Mobile car wash"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <img
                      src="/services/spa treatment 5.jpg"
                      alt="Spa treatment"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <img
                      src="/services/car m3.jpg"
                      alt="Car maintenance"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-6 bg-gray-100 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2024 ProLiink Connect. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}