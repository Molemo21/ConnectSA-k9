"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, Clock, DollarSign, CheckCircle, XCircle, Eye } from "lucide-react"
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
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                {provider.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl text-gray-900">
                {provider.businessName || provider.user.name}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {provider.service.name} • {provider.service.category}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Available
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Provider Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span>{provider.location || "Location not specified"}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatExperience(provider.experience)} experience</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span>${provider.hourlyRate}/hr</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{provider.averageRating}</span>
            <span>({provider.totalReviews} reviews)</span>
          </div>
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-gray-700 text-sm leading-relaxed">
            {provider.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{provider.completedJobs}</div>
            <span className="text-xs text-gray-600">Jobs Completed</span>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{provider.averageRating}</div>
            <span className="text-xs text-gray-600">Average Rating</span>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{provider.totalReviews}</div>
            <span className="text-xs text-gray-600">Total Reviews</span>
          </div>
        </div>

        {/* Recent Reviews */}
        {provider.recentReviews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Recent Reviews</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReviews(!showReviews)}
                className="text-purple-600 hover:text-purple-700"
              >
                {showReviews ? "Hide" : "Show"} Reviews
              </Button>
            </div>
            
            {showReviews && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {provider.recentReviews.map((review) => (
                  <div key={review.id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              role="img"
                              aria-label={i < review.rating ? 'star-filled' : 'star-empty'}
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {review.client?.name || review.booking?.client?.name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(provider)}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={isProcessing}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 