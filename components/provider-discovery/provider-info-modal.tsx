"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { 
  X, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Award, 
  Shield, 
  Users, 
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  Minus,
  ShoppingCart
} from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  price: number
  image?: string
  category: string
  duration?: string
}

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

interface ProviderInfoModalProps {
  provider: Provider
  isOpen: boolean
  onClose: () => void
  onSelectProvider: (providerId: string, selectedServices: Array<{serviceId: string, quantity: number, price: number}>) => void
}

export function ProviderInfoModal({ provider, isOpen, onClose, onSelectProvider }: ProviderInfoModalProps) {
  const [showCatalogue, setShowCatalogue] = useState(false)
  const [selectedServices, setSelectedServices] = useState<Array<{serviceId: string, quantity: number, price: number}>>([])

  // Mock services data - in real app, this would come from API
  const services: Service[] = [
    {
      id: "svc1",
      name: "Basic Cleaning",
      description: "Standard home cleaning service",
      price: 50,
      image: "/services/cleaning1.jpg",
      category: "Cleaning",
      duration: "2 hours"
    },
    {
      id: "svc2", 
      name: "Deep Cleaning",
      description: "Comprehensive deep cleaning",
      price: 120,
      image: "/services/cleaning2.jpg",
      category: "Cleaning",
      duration: "4 hours"
    },
    {
      id: "svc3",
      name: "Window Cleaning",
      description: "Professional window cleaning",
      price: 80,
      image: "/services/windows.jpg",
      category: "Cleaning",
      duration: "2 hours"
    },
    {
      id: "svc4",
      name: "Carpet Cleaning",
      description: "Steam carpet cleaning",
      price: 100,
      image: "/services/carpet.jpg",
      category: "Cleaning",
      duration: "3 hours"
    }
  ]

  const handleServiceToggle = (service: Service) => {
    const existingIndex = selectedServices.findIndex(s => s.serviceId === service.id)
    
    if (existingIndex >= 0) {
      // Remove service if already selected
      setSelectedServices(prev => prev.filter((_, index) => index !== existingIndex))
    } else {
      // Add service with quantity 1
      setSelectedServices(prev => [...prev, {
        serviceId: service.id,
        quantity: 1,
        price: service.price
      }])
    }
  }

  const handleQuantityChange = (serviceId: string, change: number) => {
    setSelectedServices(prev => prev.map(service => {
      if (service.serviceId === serviceId) {
        const newQuantity = Math.max(1, service.quantity + change)
        return { ...service, quantity: newQuantity }
      }
      return service
    }))
  }

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + (service.price * service.quantity), 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getClientName = (review: any) => {
    return review.client?.name || review.booking?.client?.name || 'Anonymous'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 border-white/20 text-white overflow-hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              {provider.businessName || provider.user.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Provider Summary */}
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <Avatar className="w-16 h-16 ring-2 ring-purple-500/30">
              <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                {provider.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(provider.averageRating) 
                          ? "text-yellow-400 fill-current" 
                          : "text-gray-500"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-white">
                  {provider.averageRating}
                </span>
                <span className="text-white/60">
                  ({provider.totalReviews} reviews)
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-white/70">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{provider.completedJobs} jobs</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{provider.experience}y exp</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{provider.location}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex space-x-6 overflow-hidden">
          {/* Left Panel - Provider Info */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[50vh]">
            {/* Description */}
            {provider.description && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="font-semibold text-white mb-2">About</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {provider.description}
                </p>
              </div>
            )}

            {/* Recent Reviews */}
            {provider.recentReviews.length > 0 && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="font-semibold text-white mb-3">Recent Reviews</h3>
                <div className="space-y-3">
                  {provider.recentReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating 
                                    ? "text-yellow-400 fill-current" 
                                    : "text-gray-500"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {getClientName(review)}
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
          </div>

          {/* Right Panel - Services Catalogue */}
          <div className="w-80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Services</h3>
              <Button
                onClick={() => setShowCatalogue(!showCatalogue)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                {showCatalogue ? 'Hide' : 'Show'} Catalogue
              </Button>
            </div>

            {showCatalogue && (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {services.map((service) => {
                  const isSelected = selectedServices.some(s => s.serviceId === service.id)
                  const selectedService = selectedServices.find(s => s.serviceId === service.id)
                  
                  return (
                    <Card 
                      key={service.id}
                      className={`cursor-pointer transition-all duration-200 border-0 bg-white/5 backdrop-blur-sm ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 bg-purple-500/10' 
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => handleServiceToggle(service)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          {/* Service Image */}
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            {service.image ? (
                              <img 
                                src={service.image} 
                                alt={service.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {service.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Service Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm mb-1">
                              {service.name}
                            </h4>
                            <p className="text-xs text-white/70 mb-2 line-clamp-2">
                              {service.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-green-400">
                                ${service.price}
                              </span>
                              {service.duration && (
                                <span className="text-xs text-white/60">
                                  {service.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        {isSelected && selectedService && (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                            <span className="text-sm text-white/70">Quantity:</span>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleQuantityChange(service.id, -1)
                                }}
                                className="w-6 h-6 p-0 text-white border-white/20 hover:bg-white/10"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium text-white w-6 text-center">
                                {selectedService.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleQuantityChange(service.id, 1)
                                }}
                                className="w-6 h-6 p-0 text-white border-white/20 hover:bg-white/10"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Selected Services Summary */}
            {selectedServices.length > 0 && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-semibold text-white mb-3">Selected Services</h4>
                <div className="space-y-2 mb-3">
                  {selectedServices.map((selectedService) => {
                    const service = services.find(s => s.id === selectedService.serviceId)
                    return service ? (
                      <div key={selectedService.serviceId} className="flex items-center justify-between text-sm">
                        <span className="text-white/80">
                          {service.name} x{selectedService.quantity}
                        </span>
                        <span className="text-green-400 font-medium">
                          ${selectedService.price * selectedService.quantity}
                        </span>
                      </div>
                    ) : null
                  })}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="font-semibold text-white">Total:</span>
                  <span className="font-bold text-green-400 text-lg">
                    ${getTotalPrice()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-white/60">
            {selectedServices.length > 0 
              ? `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} selected`
              : 'No services selected'
            }
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSelectProvider(provider.id, selectedServices)
                onClose()
              }}
              disabled={selectedServices.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Select Provider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
