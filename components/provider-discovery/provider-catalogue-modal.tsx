"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  X, 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Package,
  Sparkles,
  Shield,
  Award,
  Users
} from "lucide-react"

interface Provider {
  id: string
  businessName: string
  description: string
  experience: number
  location: string
  hourlyRate: number
    user: {
      name: string
    email: string
    phone?: string
      avatar?: string
    }
    service: {
      name: string
    description: string
      category: string
    }
    averageRating: number
    totalReviews: number
  completedJobs: number
  recentReviews: Array<{
    id: string
    rating: number
    comment?: string
    client?: { name?: string }
    booking?: { client?: { name?: string } }
    createdAt: string
  }>
  isAvailable: boolean
}

interface ServiceCatalogueModalProps {
  provider: Provider
  isOpen: boolean
  onClose: () => void
}

// Mock service catalogue data for each provider
const getProviderServices = (providerId: string) => {
  // This would typically come from an API call
  const serviceCatalogues = {
    // Default cleaning services for most providers
    default: [
      {
        id: 'house-cleaning',
        name: 'House Cleaning',
        description: 'Complete house cleaning including dusting, vacuuming, and sanitizing',
        price: 'From R350',
        duration: '2-3 hours',
        features: ['Dusting & wiping', 'Vacuum & mop', 'Bathroom cleaning', 'Kitchen cleaning'],
        category: 'Cleaning',
        isPopular: true,
        rating: 4.8,
        image: '/services/house-cleaning.jpg'
      },
      {
        id: 'deep-cleaning',
        name: 'Deep Cleaning',
        description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
        price: 'From R600',
        duration: '4-6 hours',
        features: ['Intensive cleaning', 'Appliance cleaning', 'Cabinet interiors', 'Sanitization'],
        category: 'Cleaning',
        isPopular: true,
        rating: 4.9,
        image: '/services/deep-cleaning.jpg'
      },
      {
        id: 'window-cleaning',
        name: 'Window Cleaning',
        description: 'Interior and exterior window cleaning services',
        price: 'From R300',
        duration: '1-2 hours',
        features: ['Streak-free shine', 'Interior & exterior', 'Frame wiping', 'Eco-friendly products'],
        category: 'Cleaning',
        isPopular: false,
        rating: 4.7,
        image: '/services/window-cleaning.jpg'
      },
      {
        id: 'carpet-cleaning',
        name: 'Carpet Cleaning',
        description: 'Professional carpet and upholstery cleaning services',
        price: 'From R400',
        duration: '2-4 hours',
        features: ['Stain removal', 'Deep steam cleaning', 'Odor elimination', 'Quick drying'],
        category: 'Cleaning',
        isPopular: true,
        rating: 4.8,
        image: '/services/carpet-cleaning.jpg'
      }
    ],
    // Specialized services for specific providers
    specialized: [
      {
        id: 'office-cleaning',
        name: 'Office Cleaning',
        description: 'Professional office cleaning services for businesses',
        price: 'From R500',
        duration: '3-4 hours',
        features: ['Desk sanitization', 'Floor cleaning', 'Restroom cleaning', 'Trash removal'],
        category: 'Commercial',
        isPopular: false,
        rating: 4.6,
        image: '/services/office-cleaning.jpg'
      },
      {
        id: 'post-construction',
        name: 'Post-Construction Cleaning',
        description: 'Specialized cleaning after construction or renovation work',
        price: 'From R800',
        duration: '6-8 hours',
        features: ['Dust removal', 'Paint cleanup', 'Debris removal', 'Final sanitization'],
        category: 'Specialized',
        isPopular: false,
        rating: 4.9,
        image: '/services/post-construction.jpg'
      }
    ]
  }

  // Return default services for most providers, with some specialized services mixed in
  return [...serviceCatalogues.default, ...serviceCatalogues.specialized.slice(0, 2)]
}

export function ServiceCatalogueModal({ provider, isOpen, onClose }: ServiceCatalogueModalProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [serviceSpecs, setServiceSpecs] = useState<{[key: string]: any}>({})
  const services = getProviderServices(provider.id)

  if (!isOpen) return null

  const formatExperience = (years: number) => {
    if (years === 1) return "1 year"
    return `${years} years`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate dynamic pricing based on service specifications
  const calculatePrice = (service: any, specs: any) => {
    const basePrice = parseInt(service.price.replace('From R', ''))
    let totalPrice = basePrice

    if (service.id === 'house-cleaning' || service.id === 'deep-cleaning') {
      // Room-based pricing
      const rooms = specs.rooms || 1
      const bathrooms = specs.bathrooms || 1
      const additionalRooms = Math.max(0, rooms - 2) // First 2 rooms included
      const additionalBathrooms = Math.max(0, bathrooms - 1) // First bathroom included
      
      totalPrice += (additionalRooms * 50) + (additionalBathrooms * 30)
    } else if (service.id === 'window-cleaning') {
      // Window-based pricing
      const windows = specs.windows || 5
      const additionalWindows = Math.max(0, windows - 5) // First 5 windows included
      totalPrice += additionalWindows * 20
    } else if (service.id === 'carpet-cleaning') {
      // Area-based pricing
      const area = specs.area || 50 // square meters
      const additionalArea = Math.max(0, area - 50) // First 50 sqm included
      totalPrice += additionalArea * 5
    }

    return totalPrice
  }

  const handleSpecChange = (serviceId: string, specKey: string, value: any) => {
    setServiceSpecs(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [specKey]: value
      }
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <Card className="shadow-2xl border-0 bg-black/95 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12 ring-2 ring-purple-500/30">
                  <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    {provider.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl text-white">
                    {provider.businessName || provider.user.name}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Service Catalogue • {provider.service.category}
                  </CardDescription>
                </div>
              </div>
            <Button
              variant="ghost"
              size="sm"
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10"
            >
                <X className="w-5 h-5" />
            </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 max-h-[70vh] overflow-y-auto">

            {/* Services Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Available Services</h3>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {services.length} Services
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service) => (
              <Card 
                key={service.id} 
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden ${
                      selectedService === service.id 
                        ? 'ring-2 ring-purple-500 bg-purple-500/10' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                  >
                    {/* Service Image with Price Overlay */}
                    <div className="relative h-48 overflow-hidden">
                        <img 
                          src={service.image} 
                          alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      
                      {/* Price Overlay */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-green-500/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                          <div className="text-white font-bold text-lg">{service.price}</div>
                        </div>
                      </div>

                      {/* Popular Badge */}
                        {service.isPopular && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="bg-yellow-500/90 text-yellow-100 border-yellow-400/50 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        </div>
                      )}

                      {/* Rating Badge */}
                      <div className="absolute bottom-4 left-4">
                        <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white text-sm font-medium">{service.rating}</span>
                        </div>
                      </div>
                      </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Service Title and Duration */}
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white text-lg">{service.name}</h4>
                          <div className="flex items-center space-x-1 text-white/60">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{service.duration}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-white/70 leading-relaxed">{service.description}</p>

                        {/* Features */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-white/80 uppercase tracking-wide">Key Features</h5>
                          <div className="space-y-1">
                            {service.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                <span className="text-xs text-white/70">{feature}</span>
                              </div>
                            ))}
                            {service.features.length > 3 && (
                              <div className="text-xs text-white/50 ml-5">
                                +{service.features.length - 3} more features
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className="flex justify-end">
                          <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                          {service.category}
                        </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

            {/* Service Specifications */}
            {selectedService && (
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Customize Your Service</h3>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {services.find(s => s.id === selectedService)?.name}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Specifications */}
                  <div className="space-y-4">
                    {selectedService === 'house-cleaning' || selectedService === 'deep-cleaning' ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">Number of Rooms</label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSpecChange(selectedService, 'rooms', Math.max(1, (serviceSpecs[selectedService]?.rooms || 2) - 1))}
                              className="border-white/30 text-white hover:bg-white/10"
                            >
                              -
                            </Button>
                            <span className="text-white font-semibold px-4 py-2 bg-white/10 rounded-lg min-w-[60px] text-center">
                              {serviceSpecs[selectedService]?.rooms || 2}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSpecChange(selectedService, 'rooms', (serviceSpecs[selectedService]?.rooms || 2) + 1)}
                              className="border-white/30 text-white hover:bg-white/10"
                            >
                              +
                            </Button>
                          </div>
                          <p className="text-xs text-white/60">First 2 rooms included in base price</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">Number of Bathrooms</label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSpecChange(selectedService, 'bathrooms', Math.max(1, (serviceSpecs[selectedService]?.bathrooms || 1) - 1))}
                              className="border-white/30 text-white hover:bg-white/10"
                            >
                              -
                            </Button>
                            <span className="text-white font-semibold px-4 py-2 bg-white/10 rounded-lg min-w-[60px] text-center">
                              {serviceSpecs[selectedService]?.bathrooms || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSpecChange(selectedService, 'bathrooms', (serviceSpecs[selectedService]?.bathrooms || 1) + 1)}
                              className="border-white/30 text-white hover:bg-white/10"
                            >
                              +
                            </Button>
                          </div>
                          <p className="text-xs text-white/60">First bathroom included in base price</p>
                        </div>
                      </>
                    ) : selectedService === 'window-cleaning' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Number of Windows</label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSpecChange(selectedService, 'windows', Math.max(1, (serviceSpecs[selectedService]?.windows || 5) - 1))}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            -
                          </Button>
                          <span className="text-white font-semibold px-4 py-2 bg-white/10 rounded-lg min-w-[60px] text-center">
                            {serviceSpecs[selectedService]?.windows || 5}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSpecChange(selectedService, 'windows', (serviceSpecs[selectedService]?.windows || 5) + 1)}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            +
                          </Button>
                        </div>
                        <p className="text-xs text-white/60">First 5 windows included in base price</p>
                      </div>
                    ) : selectedService === 'carpet-cleaning' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Area Size (sqm)</label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSpecChange(selectedService, 'area', Math.max(10, (serviceSpecs[selectedService]?.area || 50) - 10))}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            -10
                          </Button>
                          <span className="text-white font-semibold px-4 py-2 bg-white/10 rounded-lg min-w-[80px] text-center">
                            {serviceSpecs[selectedService]?.area || 50} sqm
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSpecChange(selectedService, 'area', (serviceSpecs[selectedService]?.area || 50) + 10)}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            +10
                          </Button>
                        </div>
                        <p className="text-xs text-white/60">First 50 sqm included in base price</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-white/70">No additional specifications needed for this service</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Pricing Summary */}
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-4">Pricing Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Base Price</span>
                          <span className="text-white font-semibold">{services.find(s => s.id === selectedService)?.price}</span>
                        </div>
                        
                        {selectedService === 'house-cleaning' || selectedService === 'deep-cleaning' ? (
                          <>
                            {(serviceSpecs[selectedService]?.rooms || 2) > 2 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-white/60">Additional Rooms ({(serviceSpecs[selectedService]?.rooms || 2) - 2})</span>
                                <span className="text-green-400">+R{((serviceSpecs[selectedService]?.rooms || 2) - 2) * 50}</span>
                              </div>
                            )}
                            {(serviceSpecs[selectedService]?.bathrooms || 1) > 1 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-white/60">Additional Bathrooms ({(serviceSpecs[selectedService]?.bathrooms || 1) - 1})</span>
                                <span className="text-green-400">+R{((serviceSpecs[selectedService]?.bathrooms || 1) - 1) * 30}</span>
                              </div>
                            )}
                          </>
                        ) : selectedService === 'window-cleaning' ? (
                          (serviceSpecs[selectedService]?.windows || 5) > 5 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-white/60">Additional Windows ({(serviceSpecs[selectedService]?.windows || 5) - 5})</span>
                              <span className="text-green-400">+R{((serviceSpecs[selectedService]?.windows || 5) - 5) * 20}</span>
                            </div>
                          )
                        ) : selectedService === 'carpet-cleaning' ? (
                          (serviceSpecs[selectedService]?.area || 50) > 50 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-white/60">Additional Area ({(serviceSpecs[selectedService]?.area || 50) - 50} sqm)</span>
                              <span className="text-green-400">+R{((serviceSpecs[selectedService]?.area || 50) - 50) * 5}</span>
                            </div>
                          )
                        ) : null}

                        <div className="border-t border-white/20 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-semibold text-lg">Total Price</span>
                            <span className="text-green-400 font-bold text-xl">
                              R{calculatePrice(services.find(s => s.id === selectedService)!, serviceSpecs[selectedService] || {})}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3"
                      onClick={() => {
                        // Here you would integrate with the booking flow
                        console.log('Service selected:', selectedService, 'Specs:', serviceSpecs[selectedService], 'Price:', calculatePrice(services.find(s => s.id === selectedService)!, serviceSpecs[selectedService] || {}))
                        onClose()
                      }}
                    >
                      Book This Service - R{calculatePrice(services.find(s => s.id === selectedService)!, serviceSpecs[selectedService] || {})}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Reviews */}
            {provider.recentReviews.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Recent Reviews</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {provider.recentReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating ? "text-yellow-400 fill-current" : "text-gray-500"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {review.client?.name || review.booking?.client?.name || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-xs text-white/60">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-white/80">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>

        {/* Footer */}
          <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
                Click on any service to learn more about pricing and availability
            </div>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Close Catalogue
              </Button>
            </div>
          </div>
        </Card>
          </div>
        </div>
  )
}