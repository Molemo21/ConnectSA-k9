"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, X, Calendar, ThumbsUp, MessageSquare } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment?: string
  client?: { name?: string }
  booking?: { client?: { name?: string } }
  createdAt: string
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
  recentReviews: Review[]
  isAvailable: boolean
}

interface ReviewsModalProps {
  provider: Provider
  isOpen: boolean
  onClose: () => void
}

export function ReviewsModal({ provider, isOpen, onClose }: ReviewsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getClientName = (review: Review) => {
    return review.client?.name || review.booking?.client?.name || 'Anonymous'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-black/95 border-white/20 text-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Reviews for {provider.businessName || provider.user.name}
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
            <Avatar className="w-12 h-12 ring-2 ring-purple-500/30">
              <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                {provider.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
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
              <p className="text-sm text-white/70">
                {provider.completedJobs} jobs completed
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {provider.recentReviews.length > 0 ? (
            provider.recentReviews.map((review) => (
              <div key={review.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {getClientName(review).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {getClientName(review)}
                      </p>
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-white/60">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                
                {review.comment && (
                  <div className="mt-3">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-white/80 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Reviews Yet</h3>
              <p className="text-white/60">
                This provider hasn't received any reviews yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-white/60">
            Showing {provider.recentReviews.length} of {provider.totalReviews} reviews
          </div>
          <Button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
