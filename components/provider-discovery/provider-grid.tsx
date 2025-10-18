"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Eye, 
  Package,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { ServiceCatalogueModal } from "./provider-catalogue-modal"
import { showToast } from "@/lib/toast"

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

interface ProviderGridProps {
  providers: Provider[]
  onProviderSelected: (providerId: string) => void
  onBack: () => void
  isProcessing?: boolean
  declinedProviders?: string[]
  onRetryDeclined?: () => void
}

export function ProviderGrid({ 
  providers, 
  onProviderSelected, 
  onBack, 
  isProcessing = false,
  declinedProviders = [],
  onRetryDeclined
}: ProviderGridProps) {
  const [showCatalogue, setShowCatalogue] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)

  const formatExperience = (years: number) => {
    if (years === 1) return "1 year"
    return `${years} years`
  }

  const scrollLeft = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  const handleAcceptProvider = async (providerId: string) => {
    try {
      onProviderSelected(providerId)
    } catch (error) {
      showToast.error("Failed to select provider. Please try again.")
    }
  }

  const handleViewCatalogue = (provider: Provider) => {
    setSelectedProvider(provider)
    setShowCatalogue(provider.id)
  }

  const handleCloseCatalogue = () => {
    setShowCatalogue(null)
    setSelectedProvider(null)
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl text-white">Choose Your Provider</CardTitle>
                <CardDescription className="text-white/80 text-sm sm:text-base">
                  Browse and select from {providers.length} available providers
                </CardDescription>
              </div>
              <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-white/70">
              <span>
                {providers.length} providers available
              </span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  {providers[0]?.service.name}
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  {providers[0]?.service.category?.name || 'No Category'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Providers Grid - Horizontal Scroll */}
        <div className="relative">
          {/* Navigation Arrows */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              className="bg-black/50 border-white/20 text-white hover:bg-white/10 w-10 h-10 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white/70 text-xs sm:text-sm text-center px-4">
              Swipe or use arrows to browse providers
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              className="bg-black/50 border-white/20 text-white hover:bg-white/10 w-10 h-10 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Scroll container */}
          <div 
            ref={setScrollContainer}
            className="flex overflow-x-auto hide-scrollbar gap-6 pb-4 snap-x snap-mandatory scroll-smooth"
          >
            {providers.map((provider, index) => (
              <Card 
                key={provider.id} 
                className="group flex-shrink-0 w-72 sm:w-80 md:w-96 snap-center shadow-xl border-0 bg-black/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-purple-500/30">
                        <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
                        <AvatarFallback className="text-sm sm:text-lg font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                          {provider.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg sm:text-xl text-white truncate">
                          {provider.businessName || provider.user.name}
                        </CardTitle>
                        <CardDescription className="text-white/70 text-xs sm:text-sm truncate">
                          {provider.service.name} • {provider.service.category?.name || 'No Category'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs flex-shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Provider Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-white/70">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{provider.location || "Location not specified"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-white/70">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                      <span className="truncate">{formatExperience(provider.experience)} experience</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-white/70">
                      <span className="text-green-400 font-semibold">R{provider.hourlyRate}/hr</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-white/70">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />
                      <span className="truncate">{provider.averageRating} ({provider.totalReviews})</span>
                    </div>
                  </div>

                  {/* Description */}
                  {provider.description && (
                    <p className="text-white/80 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      {provider.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-center">
                      <div className="text-sm sm:text-lg font-semibold text-white">{provider.completedJobs}</div>
                      <span className="text-xs text-white/60">Jobs</span>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-lg font-semibold text-white">{provider.averageRating}</div>
                      <span className="text-xs text-white/60">Rating</span>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-lg font-semibold text-white">{provider.totalReviews}</div>
                      <span className="text-xs text-white/60">Reviews</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCatalogue(provider)}
                        className="text-blue-400 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Services
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-purple-400 border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-400 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAcceptProvider(provider.id)}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scroll indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {providers.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-white/30"
              />
            ))}
          </div>
        </div>

        {/* Retry Declined Providers */}
        {declinedProviders.length > 0 && onRetryDeclined && (
          <Card className="shadow-xl border-0 bg-orange-500/10 border-orange-500/30 animate-slide-in-up">
            <CardContent className="p-4 text-center">
              <p className="text-orange-300 mb-4">
                You've declined {declinedProviders.length} providers. Would you like to see them again?
              </p>
              <Button
                onClick={onRetryDeclined}
                variant="outline"
                className="text-orange-400 border-orange-500/50 hover:bg-orange-500/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Declined Providers
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Catalogue Modal */}
      {selectedProvider && (
        <ServiceCatalogueModal
          provider={selectedProvider}
          isOpen={showCatalogue === selectedProvider.id}
          onClose={handleCloseCatalogue}
        />
      )}
    </>
  )
}
