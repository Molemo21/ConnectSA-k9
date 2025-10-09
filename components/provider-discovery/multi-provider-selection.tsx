"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ArrowLeft, ArrowRight, RefreshCw, AlertCircle, CheckCircle, Users, Star, DollarSign } from "lucide-react"
import { MultiProviderCard } from "./multi-provider-card"
import { BookingLoginModal } from "@/components/ui/booking-login-modal"
import { showToast, handleApiError } from "@/lib/toast"

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

interface MultiProviderSelectionProps {
  serviceId: string
  date: string
  time: string
  address: string
  notes?: string
  onProviderSelected: (providerId: string) => void
  onBack: () => void
  onLoginSuccess?: () => void
  onCancelBooking?: () => void
}

export function MultiProviderSelection({ 
  serviceId, 
  date, 
  time, 
  address, 
  notes, 
  onProviderSelected, 
  onBack,
  onLoginSuccess,
  onCancelBooking
}: MultiProviderSelectionProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience'>('rating')
  const [currentPage, setCurrentPage] = useState(0)
  const providersPerPage = 2

  useEffect(() => {
    discoverProviders()
  }, [])

  const discoverProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Validate required fields before making API call
      if (!serviceId || !date || !time || !address) {
        setError('Missing required booking information')
        return
      }

      // Validate serviceId format (Prisma custom ID format)
      const serviceIdRegex = /^[a-z0-9]{25}$/i;
      if (!serviceIdRegex.test(serviceId)) {
        console.error('Invalid serviceId format:', serviceId);
        setError(`Invalid service ID format: ${serviceId}`)
        return
      }
      
      const response = await fetch('/api/book-service/discover-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          date,
          time,
          address,
          notes
        }),
      })

      if (response.status === 401) {
        setIsUnauthorized(true)
        setShowLoginModal(true)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to discover providers'
        
        // Check if it's an unauthorized error
        if (response.status === 401 && errorMessage === 'Unauthorized') {
          setIsUnauthorized(true)
          setShowLoginModal(true)
          return
        }
        
        setError(errorMessage)
        return
      }

      const data = await response.json()
      
      if (!data.providers || data.providers.length === 0) {
        setError('No providers available for this service at the requested time')
        return
      }

      setProviders(data.providers)
      
    } catch (err: any) {
      console.error('Error discovering providers:', err)
      setError(err.message || 'Failed to discover providers')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(providerId)
  }

  const handleProviderSelectWithServices = (providerId: string, selectedServices: Array<{serviceId: string, quantity: number, price: number}>) => {
    setSelectedProviderId(providerId)
    // Store selected services for later use
    console.log('Provider selected with services:', { providerId, selectedServices })
  }

  const handleConfirmSelection = async () => {
    if (!selectedProviderId) return

    setIsProcessing(true)
    try {
      // Send offer to selected provider
      const response = await fetch('/api/bookings/send-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: selectedProviderId,
          serviceId,
          date,
          time,
          address,
          notes
        }),
      })

      if (response.status === 401) {
        setIsUnauthorized(true)
        setShowLoginModal(true)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send offer')
      }

      showToast.success("Job offer sent successfully!")
      onProviderSelected(selectedProviderId)
      
    } catch (err: any) {
      console.error('Error sending offer:', err)
      handleApiError(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsUnauthorized(false)
    setShowLoginModal(false)
    if (onLoginSuccess) {
      onLoginSuccess()
    }
  }

  const sortedProviders = [...providers].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.averageRating - a.averageRating
      case 'price':
        return a.hourlyRate - b.hourlyRate
      case 'experience':
        return b.experience - a.experience
      default:
        return 0
    }
  })

  // Pagination logic
  const totalPages = Math.ceil(sortedProviders.length / providersPerPage)
  const startIndex = currentPage * providersPerPage
  const endIndex = startIndex + providersPerPage
  const currentProviders = sortedProviders.slice(startIndex, endIndex)

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
      setSelectedProviderId(null) // Clear selection when changing pages
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      setSelectedProviderId(null) // Clear selection when changing pages
    }
  }

  if (loading) {
    return (
      <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Finding Providers...</h3>
          <p className="text-white/70">
            We're searching for the best providers in your area
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Unable to Find Providers</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={discoverProviders} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-all duration-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!providers || providers.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Providers Available</h3>
          <p className="text-white/70 mb-4">
            No providers are currently available for this service at the requested time.
          </p>
          <div className="space-x-2">
            <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={discoverProviders} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-all duration-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-xl text-white mb-1">Choose Your Provider</CardTitle>
              <CardDescription className="text-white/70">
                {providers.length > 0 ? (
                  <>
                    Showing {startIndex + 1}-{Math.min(endIndex, providers.length)} of {providers.length} providers
                    {totalPages > 1 && ` (Page ${currentPage + 1} of ${totalPages})`}
                  </>
                ) : (
                  'Select from available providers'
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Provider grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {currentProviders.map((provider) => (
              <MultiProviderCard
                key={provider.id}
                provider={provider}
                isSelected={selectedProviderId === provider.id}
                onSelect={handleProviderSelect}
                onSelectWithServices={handleProviderSelectWithServices}
                isProcessing={isProcessing}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i)
                      setSelectedProviderId(null)
                    }}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                      i === currentPage
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selection summary and confirm button */}
          {selectedProviderId && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Provider Selected</p>
                    <p className="text-white/70 text-sm">
                      {providers.find(p => p.id === selectedProviderId)?.businessName || 'Selected provider'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending Offer...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Send Job Offer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Modal */}
      <BookingLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        bookingData={{
          serviceId: serviceId || "",
          date: date || "",
          time: time || "",
          address: address || "",
          notes: notes || ""
        }}
      />

      {/* Cancel Booking Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-black/95 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onCancelBooking) {
                  onCancelBooking()
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
