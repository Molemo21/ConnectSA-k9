"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { X, DollarSign, Clock, Star, Image as ImageIcon } from "lucide-react"
import { showToast } from "@/lib/toast"

interface ServiceItem {
  id: string
  name: string
  description: string
  price: number
  duration: number // in minutes
  image?: string
  category: string
  isPopular?: boolean
}

interface ProviderCatalogueModalProps {
  provider: {
    id: string
    businessName: string
    user: {
      name: string
      avatar?: string
    }
    service: {
      name: string
      category: string
    }
    averageRating: number
    totalReviews: number
  }
  isOpen: boolean
  onClose: () => void
}

// Sample service catalogue data - in a real app, this would come from the API
const getSampleCatalogue = (serviceCategory: string): ServiceItem[] => {
  const baseServices: Record<string, ServiceItem[]> = {
    "Hair & Beauty": [
      {
        id: "haircut-men",
        name: "Men's Haircut",
        description: "Professional men's haircut with styling",
        price: 150,
        duration: 45,
        image: "/services/haircut.jpg",
        category: "Hair",
        isPopular: true
      },
      {
        id: "haircut-women",
        name: "Women's Haircut",
        description: "Stylish women's haircut and styling",
        price: 200,
        duration: 60,
        image: "/services/haircut-women.jpg",
        category: "Hair"
      },
      {
        id: "hair-color",
        name: "Hair Coloring",
        description: "Professional hair coloring service",
        price: 350,
        duration: 120,
        image: "/services/hair-color.jpg",
        category: "Hair"
      },
      {
        id: "beard-trim",
        name: "Beard Trim & Style",
        description: "Professional beard trimming and styling",
        price: 80,
        duration: 30,
        image: "/services/beard.jpg",
        category: "Grooming",
        isPopular: true
      },
      {
        id: "facial",
        name: "Facial Treatment",
        description: "Deep cleansing facial treatment",
        price: 250,
        duration: 90,
        image: "/services/facial.jpg",
        category: "Skincare"
      }
    ],
    "Home Services": [
      {
        id: "plumbing-basic",
        name: "Basic Plumbing Repair",
        description: "Fix leaks, unclog drains, repair faucets",
        price: 300,
        duration: 60,
        image: "/services/plumbing.jpg",
        category: "Plumbing",
        isPopular: true
      },
      {
        id: "electrical-outlet",
        name: "Electrical Outlet Installation",
        description: "Install new electrical outlets safely",
        price: 250,
        duration: 45,
        image: "/services/electrical.jpg",
        category: "Electrical"
      },
      {
        id: "painting-room",
        name: "Room Painting",
        description: "Professional interior room painting",
        price: 800,
        duration: 240,
        image: "/services/painting.jpg",
        category: "Painting"
      },
      {
        id: "cleaning-deep",
        name: "Deep House Cleaning",
        description: "Comprehensive house cleaning service",
        price: 400,
        duration: 180,
        image: "/services/cleaning.jpg",
        category: "Cleaning",
        isPopular: true
      }
    ],
    "Technology": [
      {
        id: "laptop-repair",
        name: "Laptop Screen Repair",
        description: "Professional laptop screen replacement",
        price: 800,
        duration: 90,
        image: "/services/laptop.jpg",
        category: "Computer Repair",
        isPopular: true
      },
      {
        id: "phone-repair",
        name: "Phone Screen Repair",
        description: "Smartphone screen and battery repair",
        price: 300,
        duration: 60,
        image: "/services/phone.jpg",
        category: "Phone Repair"
      },
      {
        id: "wifi-setup",
        name: "WiFi Network Setup",
        description: "Home WiFi network installation and setup",
        price: 200,
        duration: 45,
        image: "/services/wifi.jpg",
        category: "Networking"
      }
    ],
    "Automotive": [
      {
        id: "oil-change",
        name: "Oil Change Service",
        description: "Complete oil change with filter replacement",
        price: 150,
        duration: 30,
        image: "/services/oil-change.jpg",
        category: "Maintenance",
        isPopular: true
      },
      {
        id: "brake-repair",
        name: "Brake Pad Replacement",
        description: "Professional brake pad replacement",
        price: 600,
        duration: 120,
        image: "/services/brakes.jpg",
        category: "Repair"
      },
      {
        id: "tire-change",
        name: "Tire Change Service",
        description: "Tire replacement and balancing",
        price: 200,
        duration: 45,
        image: "/services/tires.jpg",
        category: "Maintenance"
      }
    ]
  }

  return baseServices[serviceCategory] || [
    {
      id: "basic-service",
      name: "Basic Service",
      description: "Standard service offering",
      price: 200,
      duration: 60,
      image: "/services/default.jpg",
      category: "General",
      isPopular: true
    }
  ]
}

export function ProviderCatalogueModal({ provider, isOpen, onClose }: ProviderCatalogueModalProps) {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  
  const catalogueItems = getSampleCatalogue(provider.service.category)

  const handleServiceSelect = (service: ServiceItem) => {
    setSelectedService(service)
    showToast.success(`Selected: ${service.name}`)
  }

  const formatPrice = (price: number) => {
    return `R${price}`
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-black/95 border-gray-800">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl text-white flex items-center space-x-3">
              <ImageIcon className="w-6 h-6 text-blue-400" />
              <span>Service Catalogue</span>
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Provider Info */}
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {provider.user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{provider.businessName}</h3>
              <div className="flex items-center space-x-4 text-sm text-white/70">
                <span className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{provider.averageRating.toFixed(1)} ({provider.totalReviews} reviews)</span>
                </span>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {provider.service.category}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogueItems.map((service) => (
              <Card 
                key={service.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-0 bg-white/5 backdrop-blur-sm ${
                  selectedService?.id === service.id 
                    ? 'ring-2 ring-blue-500 bg-blue-500/10' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => handleServiceSelect(service)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Service Image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      {service.image ? (
                        <img 
                          src={service.image} 
                          alt={service.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Service Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                            {service.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/70 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                        {service.isPopular && (
                          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>

                      {/* Price and Duration */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4 text-xs sm:text-sm">
                          <div className="flex items-center space-x-1 text-green-400">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-semibold">{formatPrice(service.price)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-blue-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(service.duration)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          {service.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
              {selectedService ? (
                <span>Selected: <span className="text-white font-medium">{selectedService.name}</span></span>
              ) : (
                <span>Click on a service to select it</span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Close
              </Button>
              {selectedService && (
                <Button
                  onClick={() => {
                    showToast.success(`Service ${selectedService.name} selected!`)
                    onClose()
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Book This Service
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}



