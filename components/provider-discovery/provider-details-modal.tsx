"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Award, 
  Shield, 
  Users, 
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  ThumbsUp,
  Star as StarIcon
} from "lucide-react"
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

interface ProviderDetailsModalProps {
  provider: Provider
  isOpen: boolean
  onClose: () => void
  onAccept: (providerId: string) => void
  onDecline: (providerId: string) => void
}

export function ProviderDetailsModal({ 
  provider, 
  isOpen, 
  onClose, 
  onAccept, 
  onDecline 
}: ProviderDetailsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  if (!isOpen) return null

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      onAccept(provider.id)
      onClose()
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
      onClose()
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

  const displayReviews = showAllReviews ? provider.recentReviews : provider.recentReviews.slice(0, 3)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-4 border-white/20">
                <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
                <AvatarFallback className="text-xl font-bold bg-white/20 text-white">
                  {provider.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {provider.businessName || provider.user.name}
                </h2>
                <p className="text-white/90 text-lg">
                  {provider.service.name} • {provider.service.category}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available Now
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Award className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span>About {provider.businessName || provider.user.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {provider.description || `Professional ${provider.service.name} specialist with ${formatExperience(provider.experience)} of experience. Committed to delivering exceptional results and customer satisfaction.`}
                  </p>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center p-4 border-0 shadow-md">
                  <div className="text-2xl font-bold text-purple-600">{provider.completedJobs}</div>
                  <div className="text-sm text-gray-600">Jobs Completed</div>
                </Card>
                <Card className="text-center p-4 border-0 shadow-md">
                  <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center">
                    <Star className="w-5 h-5 mr-1" />
                    {provider.averageRating}
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </Card>
                <Card className="text-center p-4 border-0 shadow-md">
                  <div className="text-2xl font-bold text-blue-600">{provider.totalReviews}</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </Card>
                <Card className="text-center p-4 border-0 shadow-md">
                  <div className="text-2xl font-bold text-green-600">{formatExperience(provider.experience)}</div>
                  <div className="text-sm text-gray-600">Experience</div>
                </Card>
              </div>

              {/* Reviews */}
              {provider.recentReviews.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span>Customer Reviews</span>
                      </CardTitle>
                      {provider.recentReviews.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="text-purple-600"
                        >
                          {showAllReviews ? "Show Less" : `Show All ${provider.recentReviews.length} Reviews`}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayReviews.map((review) => (
                        <div key={review.id} className="border-l-4 border-purple-200 pl-4 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium text-gray-900">
                                {review.client?.name || review.booking?.client?.name || 'Anonymous'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 text-sm italic">"{review.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">{provider.location}</span>
                  </div>
                  {provider.user.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600">{provider.user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">{provider.user.email}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service</span>
                    <Badge variant="secondary">{provider.service.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category</span>
                    <Badge variant="outline">{provider.service.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rate</span>
                    <span className="font-semibold text-green-600">${provider.hourlyRate}/hr</span>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card className="border-0 shadow-lg bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">Trust & Safety</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">Background Verified</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">Insurance Covered</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">100% Satisfaction</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={isProcessing}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Choose This Provider
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}










