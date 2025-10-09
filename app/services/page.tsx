"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ChevronRight, Clock, DollarSign, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { SERVICES } from "@/config/services"
import { ServiceCategory } from "@/types/services"

interface ServiceUI {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: string;
  image: string;
  icon: string;
  features: string[];
}

// Map configuration services to UI format
const services: ServiceUI[] = [
  {
    id: 'house-cleaning',
    slug: "house-cleaning",
    title: "House Cleaning",
    description: "Professional house cleaning services including dusting, vacuuming, and sanitizing",
    price: "From R350",
    image: "/services/house-cleaning.jpg",
    icon: "🧹",
    features: [
      "Dusting and wiping",
      "Vacuum and mop",
      "Bathroom cleaning",
      "Kitchen cleaning"
    ]
  },
  {
    id: 'deep-cleaning',
    slug: "deep-cleaning",
    title: "Deep Cleaning",
    description: "Comprehensive deep cleaning for move-in/move-out or special occasions",
    price: "From R600",
    image: "/services/deep-cleaning.jpg",
    icon: "✨",
    features: [
      "Standard cleaning",
      "Behind furniture",
      "Inside cabinets",
      "Window cleaning"
    ]
  },
  {
    id: 'carpet-cleaning',
    slug: "carpet-cleaning",
    title: "Carpet Cleaning",
    description: "Professional carpet and upholstery cleaning services",
    price: "From R400",
    image: "/services/carpet-cleaning.jpg",
    icon: "🧽",
    features: [
      "Deep cleaning",
      "Stain removal",
      "Deodorizing",
      "Quick drying"
    ]
  },
  {
    id: 'window-cleaning',
    slug: "window-cleaning",
    title: "Window Cleaning",
    description: "Interior and exterior window cleaning services",
    price: "From R300",
    image: "/services/window-cleaning.jpg",
    icon: "🪟",
    features: [
      "Interior cleaning",
      "Exterior cleaning",
      "Frame cleaning",
      "Glass polishing"
    ]
  }
];

export default function ServicesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState(services);
  const [contentReady, setContentReady] = useState(false);

  // Handle search change
  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    const term = search.toLowerCase();
    const filtered = services.filter(
      (service) =>
        service.title.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.features.some(feature => feature.toLowerCase().includes(term))
    );
    setFilteredServices(filtered);
  };

  // Initialize animation
  useEffect(() => {
    setTimeout(() => setContentReady(true), 10);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/cleaning-bg.jpg')" }}
      />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Professional Cleaning Services
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Expert cleaning services for your home or office. Book trusted, experienced cleaners today.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className={`group hover:shadow-xl transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 ${
                contentReady ? 'animate-fade-in-up' : 'opacity-0'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{service.icon}</span>
                  <Badge variant="secondary" className="bg-white/10">
                    {service.price}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-white group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <Button
                    className="w-full mt-4"
                    onClick={() => router.push(`/book-service?service=${service.slug}`)}
                  >
                    Book Now
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No services found matching "{searchTerm}"
            </p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Need a Custom Cleaning Solution?
          </h2>
          <p className="text-gray-300 mb-6">
            Contact us to discuss your specific cleaning requirements
          </p>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => router.push('/contact')}
          >
            Get in Touch
          </Button>
        </div>
      </div>
    </div>
  );
}