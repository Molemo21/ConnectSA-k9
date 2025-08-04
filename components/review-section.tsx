"use client"

import { useState } from "react"
import { ReviewForm } from "@/components/ui/review-form"
import { Star } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: Date
}

interface ReviewSectionProps {
  bookingId: string
  existingReview?: Review | null
}

export function ReviewSection({ bookingId, existingReview }: ReviewSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedReview, setSubmittedReview] = useState<Review | null>(existingReview || null)

  const handleSubmitReview = async (rating: number, comment: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/book-service/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubmittedReview(data.review)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit review')
      }
    } catch (error) {
      alert('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedReview) {
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Your Review</h4>
        <div className="flex items-center mb-2">
          {[...Array(submittedReview.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {submittedReview.rating}/5 stars
          </span>
        </div>
        {submittedReview.comment && (
          <p className="text-sm text-gray-700">{submittedReview.comment}</p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">Leave a Review</h4>
      <ReviewForm 
        bookingId={bookingId}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmitting}
      />
    </div>
  )
} 