"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { ProviderCatalogueGrid } from "./provider-catalogue-grid"
import { ProviderDetailsModal } from "./provider-details-modal"
import { BookingSummaryDrawer } from "@/components/booking/BookingSummaryDrawer"
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
    booking: {
      client: {
        name: string
      }
    }
    createdAt: string
  }>
  isAvailable: boolean
}

interface ProviderDiscoveryProps {
  serviceId: string
  date: string
  time: string
  address: string
  notes?: string
  paymentMethod: "ONLINE" | "CASH"
  onProviderSelected?: (providerId: string, providerData?: any) => void
  onPackageSelected?: (providerId: string, catalogueItemId: string, providerData?: any, packageData?: any) => void
  onBack: () => void
  onLoginSuccess?: () => void
  onCancelBooking?: () => void
}

export function ProviderDiscovery({ 
  serviceId, 
  date, 
  time, 
  address, 
  notes,
  paymentMethod,
  onProviderSelected, 
  onPackageSelected,
  onBack, 
  onLoginSuccess, 
  onCancelBooking 
}: ProviderDiscoveryProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [declinedProviders, setDeclinedProviders] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [alternativeTimes, setAlternativeTimes] = useState<Array<{time: string, available: boolean}>>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [discoveryTime, setDiscoveryTime] = useState<string>(time)

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 [ProviderDiscovery] Modal state changed:', { showLoginModal, isUnauthorized })
  }, [showLoginModal, isUnauthorized])

  useEffect(() => {
    discoverProviders()
  }, [])

  const discoverProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [ProviderDiscovery] Starting provider discovery...')
      console.log('🔍 [ProviderDiscovery] ServiceId:', serviceId)
      console.log('🔍 [ProviderDiscovery] Date:', date)
      console.log('🔍 [ProviderDiscovery] Time:', discoveryTime)
      console.log('🔍 [ProviderDiscovery] Address:', address)
      
      // Validate required fields before making API call
      if (!serviceId || !date || !discoveryTime || !address) {
        setError('Missing required booking information')
        return
      }

      // Validate serviceId format (accept both CUID and UUID formats)
      const cuidRegex = /^[a-z0-9]{25}$/i;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!cuidRegex.test(serviceId) && !uuidRegex.test(serviceId)) {
        console.error('Invalid serviceId format:', serviceId);
        setError(`Invalid service ID format: ${serviceId}`)
        showToast.error('Invalid service selection. Please try again.')
        return
      }

      console.log('Sending provider discovery request:', {
        serviceId,
        date,
        time,
        address
      });

      const response = await fetch('/api/book-service/discover-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, date, time: discoveryTime, address })
      })

      if (!response || typeof response.ok !== 'boolean') {
        throw new Error('Network error')
      }

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to discover providers'
        console.error('❌ [ProviderDiscovery] API error:', errorData);
        console.log('❌ [ProviderDiscovery] Response status:', response.status);
        console.log('❌ [ProviderDiscovery] Error message:', errorMessage);
        
        if (response.status === 503) {
          setError('The system is briefly updating. Please try again in a moment.')
          showToast.info('Temporarily unavailable during update. Please try again shortly.')
          return
        }

        // Check if it's an unauthorized error
        if (response.status === 401 && errorMessage === 'Unauthorized') {
          console.log('🔐 [ProviderDiscovery] Unauthorized detected - showing login modal');
          setIsUnauthorized(true)
          setShowLoginModal(true)
          return
        }
        
        setError(errorMessage)
        showToast.error(errorMessage)
        return
      }

      const data = await response.json()
      
      if (!data.providers || data.providers.length === 0) {
        setError('No providers available for this service at the requested time')
        showToast.info('No providers available. Please try a different time or service.')
        return
      }

      setProviders(data.providers)
      setCurrentIndex(0)
      setDeclinedProviders([])
      
      // Different success messages based on context
      if (isUnauthorized) {
        showToast.success(`Great! Found ${data.totalCount} available providers for your booking!`)
      } else {
        showToast.success(`Found ${data.totalCount} available providers!`)
      }
    } catch (error) {
      console.error('Provider discovery error:', error)
      setError('Failed to load providers. Please try again.')
      showToast.error('Failed to load providers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptProvider = async (providerId: string, catalogueItemId?: string) => {
    setIsProcessing(true)
    try {
      // Validate that we have all required data
      if (!serviceId || !date || !time || !address) {
        showToast.error('Missing required booking information')
        return
      }

      // Validate serviceId format (accept both CUID and UUID formats)
      const cuidRegex = /^[a-z0-9]{25}$/i;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!cuidRegex.test(serviceId) && !uuidRegex.test(serviceId)) {
        console.error('Invalid serviceId format:', serviceId);
        showToast.error('Invalid service selection. Please try again.')
        return
      }

      const requestData = {
        providerId, 
        serviceId, 
        date, 
        time, 
        address, 
        notes,
        paymentMethod,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        // Include catalogueItemId when a package is selected (catalogue-based pricing)
        ...(catalogueItemId && { catalogueItemId })
      };

      console.log('🚀 Sending job offer with data:', {
        ...requestData,
        catalogueItemId: catalogueItemId || 'not provided (using legacy pricing)'
      });

      const response = await fetch('/api/book-service/send-offer-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      console.log('📥 Send-offer response status:', response && 'status' in response ? (response as any).status : 'unknown');

      if (!response || typeof response.ok !== 'boolean') {
        throw new Error('Network error')
      }

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorData = { error: `Failed to parse error response: ${response.status}` };
        }
        
        console.error('❌ Send-offer API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.status === 503) {
          showToast.info('Temporarily unavailable during update. Please try again shortly.')
          return;
        }

        // Handle authentication errors by showing login modal
        if (response.status === 401) {
          console.log('🔐 Authentication required, showing login modal');
          setShowLoginModal(true);
          setIsUnauthorized(true);
          return;
        }
        
        // Try to get more details about the error
        let errorMessage = 'Failed to send job offer';
        let alternativeTimes = null;
        
        if (errorData && typeof errorData === 'object') {
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (Object.keys(errorData).length === 0) {
            errorMessage = `API returned ${response.status} with no error details`;
          }
          
                  // Check for alternative times
        if (errorData.details && errorData.details.alternativeTimes) {
          alternativeTimes = errorData.details.alternativeTimes;
          setAlternativeTimes(alternativeTimes);
          setLastError(errorMessage);
        } else {
          setAlternativeTimes([]);
          setLastError(errorMessage);
        }
      }
      
      // Show error with alternative times if available
      if (alternativeTimes && alternativeTimes.length > 0) {
        const timeList = alternativeTimes.map(t => t.time).join(', ');
        showToast.error(`${errorMessage} Alternative times: ${timeList}`);
      } else {
        showToast.error(errorMessage);
      }
      
      return;
      }

      const data = await response.json()
      console.log('✅ Send-offer success:', data);
      showToast.success(data.message)
      // Pass provider data if available
      const providerData = providers.find(p => p.id === providerId)
      onProviderSelected(providerId, providerData)
    } catch (error) {
      console.error('❌ Send offer error:', error)
      showToast.error('Failed to send job offer. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeclineProvider = (providerId: string) => {
    setDeclinedProviders(prev => [...prev, providerId])
    
    // Move to next provider
    if (currentIndex < providers.length - 1) {
      setCurrentIndex(prev => prev + 1)
      showToast.info('Provider declined. Moving to next available provider.')
    } else {
      // No more providers, show retry option
      showToast.info('No more providers available. You can retry declined providers or go back to modify your request.')
    }
  }

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider)
    setShowDetailsModal(true)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedProvider(null)
  }

  const goToNextProvider = () => {
    if (currentIndex < providers.length - 1) {
      setCurrentIndex(prev => prev + 1)
      // Clear error state when moving to next provider
      setAlternativeTimes([])
      setLastError(null)
    } else {
      showToast.info('This is the last provider.')
    }
  }

  const goToPreviousProvider = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      // Clear error state when moving to previous provider
      setAlternativeTimes([])
      setLastError(null)
    } else {
      showToast.info('This is the first provider.')
    }
  }

  const retryDeclinedProviders = () => {
    const remainingProviders = providers.filter(p => !declinedProviders.includes(p.id))
    if (remainingProviders.length > 0) {
      setProviders(remainingProviders)
      setCurrentIndex(0)
      setDeclinedProviders([])
      // Clear error state when retrying
      setAlternativeTimes([])
      setLastError(null)
      showToast.success('Showing declined providers again')
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    setIsUnauthorized(false)
    setError(null)
    setLoading(true) // Show loading state while retrying
    
    // Retry provider discovery after successful login
    console.log('🔄 [ProviderDiscovery] Retrying provider discovery after successful login...')
    discoverProviders()
    onLoginSuccess?.()
    showToast.success("Welcome back! Finding available providers for your booking...")
  }

  const handleCloseLoginModal = () => {
    setShowLoginModal(false)
    // If user closes modal without logging in, go back to previous step
    onBack()
  }

  const handleCancelBooking = () => {
    setShowCancelDialog(true)
  }

  const confirmCancelBooking = () => {
    setShowCancelDialog(false)
    showToast.info("Booking cancelled - starting over")
    
    // Use the onCancelBooking prop if provided, otherwise fall back to page reload
    if (onCancelBooking) {
      onCancelBooking()
    } else {
      // Fallback: Navigate to the book-service page to start fresh
      window.location.href = '/book-service'
    }
  }

  if (loading) {
    return (
      <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Discovering available providers...</p>
        </CardContent>
      </Card>
    )
  }

  if (error && !isUnauthorized) {
    return (
      <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Provider Discovery Failed</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={onBack} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={discoverProviders} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Utility: compute next 3 half-hour slots from provided time
  const computeNextSlots = (t: string) => {
    const [hh, mm] = t.split(':').map(n => parseInt(n, 10))
    const base = new Date()
    base.setHours(hh || 8, mm || 0, 0, 0)
    const slots: string[] = []
    for (let i = 1; i <= 3; i++) {
      const d = new Date(base.getTime() + i * 30 * 60000)
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
    return slots
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
          {/* Quick next-time suggestions */}
          <div className="mb-4">
            <p className="text-white/80 mb-2">Try a nearby time:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {computeNextSlots(discoveryTime || '08:00').map((slot) => (
                <Button key={slot} variant="outline" className="border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => { setDiscoveryTime(slot); setLoading(true); setTimeout(discoverProviders, 50) }}>
                  {slot}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-x-2">
            <Button onClick={onBack} className="!bg-white !text-black hover:!bg-gray-100 !border-0 font-medium px-4 py-2 rounded-md transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={discoverProviders} className="!bg-blue-600 hover:!bg-blue-700 !text-white font-medium px-4 py-2 rounded-md transition-all duration-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentProvider = providers[currentIndex]
  const isLastProvider = currentIndex === providers.length - 1
  const hasDeclinedProviders = declinedProviders.length > 0

  return (
    <>
      {/* Login Modal */}
      <BookingLoginModal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleLoginSuccess}
        bookingData={{
          serviceId,
          date,
          time,
          address,
          notes
        }}
      />

      <div className="space-y-6 animate-fade-in">
      {/* Providers Grid */}
      <ProviderCatalogueGrid
        providers={providers}
        serviceId={serviceId}
        onProviderSelected={onPackageSelected ? undefined : (onProviderSelected ? (providerId: string, catalogueItemId: string) => {
          // Only use old flow if onPackageSelected is not provided
          handleAcceptProvider(providerId, catalogueItemId)
        } : undefined)}
        onPackageSelected={onPackageSelected}
        onBack={onBack}
        isProcessing={onPackageSelected ? false : isProcessing}
        providerCount={providers.length}
      />

      {/* Alternative Times Display */}
      {alternativeTimes.length > 0 && lastError && (
        <Card className="shadow-xl border-0 bg-orange-500/10 border-orange-500/30 animate-slide-in-up">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-300 mb-2">Time Conflict Detected</h4>
                <p className="text-sm text-orange-200 mb-3">{lastError}</p>
                <div className="bg-black/20 rounded-lg p-3 border border-orange-500/30">
                  <p className="text-sm font-medium text-orange-300 mb-2">Alternative Available Times:</p>
                  <div className="flex flex-wrap gap-2">
                    {alternativeTimes.map((timeSlot, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-orange-500/20 text-orange-200 border-orange-400/50 hover:bg-orange-500/30 cursor-pointer"
                        onClick={() => {
                          // Update the time and retry
                          const newTime = timeSlot.time;
                          showToast.info(`Time updated to ${newTime}. Please try again.`);
                          // You could add a callback here to update the parent component's time
                        }}
                      >
                        {timeSlot.time}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-orange-300 mt-2">
                  Click on a time to select it, or try a different provider
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Processing State */}
      {isProcessing && (
        <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
          <CardContent className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
            <p className="text-white">Sending job offer...</p>
            <p className="text-sm text-white/70 mt-1">Please wait while we process your request</p>
          </CardContent>
        </Card>
      )}


      {/* Provider Details Modal */}
      {selectedProvider && (
        <ProviderDetailsModal
          provider={selectedProvider}
          isOpen={showDetailsModal}
          onClose={handleCloseDetailsModal}
          onAccept={onPackageSelected ? undefined : handleAcceptProvider}
          onDecline={handleDeclineProvider}
        />
      )}
      </div>
      {/* Only show BookingSummaryDrawer for old flow (when onPackageSelected is not provided) */}
      {showSummary && selectedProvider && selectedPackage && !onPackageSelected && (
        <BookingSummaryDrawer
          onClose={() => setShowSummary(false)}
          data={{
            provider: selectedProvider,
            serviceId,
            scheduled: { date, time },
            address,
            notes,
            package: selectedPackage
          }}
          onConfirm={async () => {
            const payload = {
              providerId: selectedProvider.id,
              serviceId,
              date, time, address, notes,
              catalogueItemId: selectedPackage.id,
              paymentMethod,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              timezoneOffsetMinutes: new Date().getTimezoneOffset()
            }
            const res = await fetch('/api/book-service/send-offer-enhanced', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            if (!res.ok) {
              const e = await res.json().catch(() => ({}))
              throw new Error(e.error || 'Failed to create booking')
            }
            await res.json()
            setShowSummary(false)
            onProviderSelected?.(selectedProvider.id, selectedProvider)
          }}
        />
      )}
    </>
  )
}