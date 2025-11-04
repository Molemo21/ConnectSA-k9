"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, Clock, CheckCircle, XCircle, Eye, Package } from "lucide-react"
import { showToast } from "@/lib/toast"
import { ServiceCatalogueModal } from "./provider-catalogue-modal"

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
    // Support both shapes: direct client or nested booking.client
    client?: { name?: string }
    booking?: { client?: { name?: string } }
    createdAt: string
  }>
  isAvailable: boolean
}

interface ProviderCardProps {
  provider: Provider
  onAccept: (providerId: string) => void
  onDecline: (providerId: string) => void
  onViewDetails: (provider: Provider) => void
}

export function ProviderCard({ provider, onAccept, onDecline, onViewDetails }: ProviderCardProps) {
  const [showReviews, setShowReviews] = useState(false)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      onAccept(provider.id)
    } catch (error) {
      showToast.error("Failed to accept provider. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecline = async () => {
    setIsProcessing(true)
    try {
      onDecline(provider.id)
    } catch (error) {
      showToast.error("Failed to decline provider. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatExperience = (years: number) => {
    if (years === 1) return "1 year"
    return `${years} years`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <>
    <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 animate-slide-in-up">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 ring-2 ring-purple-500/30">
              <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                {provider.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl text-white">
                {provider.businessName || provider.user.name}
              </CardTitle>
              <CardDescription className="text-white/70">
                {provider.service.name} • {provider.service.category}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Available
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Provider Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-white/70">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span>{provider.location || "Location not specified"}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/70">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{formatExperience(provider.experience)} experience</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/70">
            <span className="text-green-400 font-semibold">R{provider.hourlyRate}/hr</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/70">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>{provider.averageRating}</span>
            <span>({provider.totalReviews} reviews)</span>
          </div>
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-white/80 text-sm leading-relaxed">
            {provider.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{provider.completedJobs}</div>
            <span className="text-xs text-white/60">Jobs Completed</span>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{provider.averageRating}</div>
            <span className="text-xs text-white/60">Average Rating</span>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{provider.totalReviews}</div>
            <span className="text-xs text-white/60">Total Reviews</span>
          </div>
        </div>

        {/* Recent Reviews */}
        {provider.recentReviews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">Recent Reviews</h4>
              <div className="flex items-center space-x-2">
                {/* Buttons removed as requested */}
              </div>
            </div>
            
            {showReviews && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {provider.recentReviews.map((review) => (
                  <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              role="img"
                              aria-label={i < review.rating ? 'star-filled' : 'star-empty'}
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
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCatalogue(true)}
              className="text-blue-400 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400"
            >
              <Package className="w-4 h-4 mr-1" />
              View Catalogue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(provider)}
              className="text-purple-400 border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-400"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Portfolio
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={isProcessing}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Service Catalogue Modal */}
    <ServiceCatalogueModal
      provider={provider}
      isOpen={showCatalogue}
      onClose={() => setShowCatalogue(false)}
    />
  </>
  )
} 