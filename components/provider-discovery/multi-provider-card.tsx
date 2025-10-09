"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, Clock, DollarSign, CheckCircle, Users, Award, Info } from "lucide-react"
import { ProviderInfoModal } from "./provider-info-modal"

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

interface MultiProviderCardProps {
  provider: Provider
  isSelected: boolean
  onSelect: (providerId: string) => void
  onSelectWithServices: (providerId: string, selectedServices: Array<{serviceId: string, quantity: number, price: number}>) => void
  isProcessing?: boolean
}

export function MultiProviderCard({ 
  provider, 
  isSelected, 
  onSelect, 
  onSelectWithServices,
  isProcessing = false 
}: MultiProviderCardProps) {
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const handleSelect = () => {
    if (!isProcessing) {
      onSelect(provider.id)
    }
  }

  const handleViewDetails = () => {
    setShowReviewsModal(true)
  }

  const handleInfoClick = () => {
    setShowInfoModal(true)
  }

  return (
    <>
      <Card 
        className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-black/90 backdrop-blur-sm group ${
          isSelected 
            ? 'ring-2 ring-purple-500 shadow-purple-500/20 shadow-xl scale-[1.02]' 
            : 'hover:shadow-lg hover:scale-[1.01]'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={handleSelect}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center z-10">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start space-x-4 mb-4">
            <Avatar className="w-16 h-16 ring-2 ring-purple-500/30 flex-shrink-0">
              <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                {provider.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg leading-tight mb-1">
                {provider.businessName || provider.user.name}
              </h3>
              <p className="text-white/60 text-sm truncate">
                {provider.service.name}
              </p>
            </div>
          </div>

          {/* Key metrics */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <div 
                className="flex items-center space-x-2 text-white/70 cursor-pointer hover:text-white transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDetails()
                }}
              >
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-medium">{provider.averageRating}</span>
                <span>({provider.totalReviews})</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-lg">${provider.hourlyRate}/hr</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-white/70">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{provider.completedJobs} jobs</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{provider.experience}y exp</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-2 text-sm text-white/60 mb-4">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{provider.location || "Location not specified"}</span>
          </div>

          {/* Description preview */}
          {provider.description && (
            <p className="text-sm text-white/70 leading-relaxed mb-4 line-clamp-3">
              {provider.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleInfoClick()
              }}
              className="text-sm px-3 py-2 h-auto text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            >
              <Info className="w-4 h-4 mr-2" />
              Info
            </Button>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleSelect()
              }}
              disabled={isProcessing}
              className={`text-sm px-4 py-2 h-auto transition-all duration-200 ${
                isSelected
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {isSelected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Selected
                </>
              ) : (
                'Select'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Modal */}
      <ReviewsModal
        provider={provider}
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
      />

      {/* Provider Info Modal */}
      <ProviderInfoModal
        provider={provider}
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onSelectProvider={onSelectWithServices}
      />
    </>
  )
}
