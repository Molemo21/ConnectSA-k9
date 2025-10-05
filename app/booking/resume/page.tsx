"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, AlertCircle, CheckCircle } from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { showToast } from "@/lib/toast"

function BookingResumeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [draft, setDraft] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resumeBooking = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get draft ID from URL params or cookie
        const draftId = searchParams?.get('draftId') || 
                       document.cookie
                         .split('; ')
                         .find(row => row.startsWith('booking_draft_id='))
                         ?.split('=')[1]

        if (!draftId) {
          setError('No booking draft found. Please start a new booking.')
          return
        }

        // Import the draft utility
        const { getBookingDraft, clearBookingDraft } = await import('@/lib/booking-draft')
        
        // Get the draft
        const bookingDraft = await getBookingDraft(draftId)
        
        if (!bookingDraft) {
          setError('Booking draft not found or has expired. Please start a new booking.')
          return
        }

        setDraft(bookingDraft)
        console.log('📖 Booking draft loaded:', bookingDraft)

        // Clear the draft after loading
        await clearBookingDraft(draftId)
        console.log('🗑️ Booking draft cleared after loading')

        // Redirect to booking page with the draft data
        const bookingUrl = new URL('/book-service', window.location.origin)
        bookingUrl.searchParams.set('resume', 'true')
        
        // Store the draft data temporarily for the booking page to pick up
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('resumeBookingData', JSON.stringify(bookingDraft))
        }

        showToast.success('Booking draft restored successfully!')
        
        // Redirect to booking page
        router.push(bookingUrl.toString())
        
      } catch (error) {
        console.error('Error resuming booking:', error)
        setError('Failed to restore booking draft. Please start a new booking.')
      } finally {
        setIsLoading(false)
      }
    }

    resumeBooking()
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Restoring Your Booking</h2>
                  <p className="text-gray-600 mb-6">
                    Please wait while we restore your booking details...
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/book-service')} 
                      className="w-full"
                    >
                      Start New Booking
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/')} 
                      className="w-full"
                    >
                      Go Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (draft) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Restored</h2>
                  <p className="text-gray-600 mb-6">
                    Your booking details have been restored successfully. Redirecting you to continue...
                  </p>
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function BookingResumePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Loading booking resume...</p>
        </div>
      </div>
    }>
      <BookingResumeContent />
    </Suspense>
  )
}
