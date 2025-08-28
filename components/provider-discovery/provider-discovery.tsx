"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { ProviderCard } from "./provider-card"
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
  onProviderSelected: (providerId: string) => void
  onBack: () => void
}

export function ProviderDiscovery({ 
  serviceId, 
  date, 
  time, 
  address, 
  notes, 
  onProviderSelected, 
  onBack 
}: ProviderDiscoveryProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [declinedProviders, setDeclinedProviders] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [alternativeTimes, setAlternativeTimes] = useState<Array<{time: string, available: boolean}>>([])
  const [lastError, setLastError] = useState<string | null>(null)

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
        body: JSON.stringify({ serviceId, date, time, address })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to discover providers'
        console.error('Provider discovery API error:', errorData);
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
      
      showToast.success(`Found ${data.totalCount} available providers!`)
    } catch (error) {
      console.error('Provider discovery error:', error)
      setError('Failed to load providers. Please try again.')
      showToast.error('Failed to load providers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptProvider = async (providerId: string) => {
    setIsProcessing(true)
    try {
      // Validate that we have all required data
      if (!serviceId || !date || !time || !address) {
        showToast.error('Missing required booking information')
        return
      }

      // Validate serviceId format (Prisma custom ID format)
      const serviceIdRegex = /^[a-z0-9]{25}$/i;
      if (!serviceIdRegex.test(serviceId)) {
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
        notes 
      };

      console.log('🚀 Sending job offer with data:', requestData);

      const response = await fetch('/api/book-service/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      console.log('📥 Send-offer response status:', response.status);

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
      onProviderSelected(providerId)
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
    // TODO: Implement detailed provider view modal
    showToast.info('Detailed provider view coming soon!')
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

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Discovering available providers...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider Discovery Failed</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={discoverProviders}>
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
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Providers Available</h3>
          <p className="text-gray-600 mb-4">
            No providers are currently available for this service at the requested time.
          </p>
          <div className="space-x-2">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={discoverProviders}>
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
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900">Choose Your Provider</CardTitle>
              <CardDescription>
                Review and select from available providers for your service
              </CardDescription>
            </div>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Provider {currentIndex + 1} of {providers.length}
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {currentProvider.service.name}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {currentProvider.service.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Provider */}
      <ProviderCard
        provider={currentProvider}
        onAccept={handleAcceptProvider}
        onDecline={handleDeclineProvider}
        onViewDetails={handleViewDetails}
      />

      {/* Alternative Times Display */}
      {alternativeTimes.length > 0 && lastError && (
        <Card className="shadow-lg border-0 bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800 mb-2">Time Conflict Detected</h4>
                <p className="text-sm text-orange-700 mb-3">{lastError}</p>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-sm font-medium text-orange-800 mb-2">Alternative Available Times:</p>
                  <div className="flex flex-wrap gap-2">
                    {alternativeTimes.map((timeSlot, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-white text-orange-700 border-orange-300 hover:bg-orange-50 cursor-pointer"
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
                <p className="text-xs text-orange-600 mt-2">
                  Click on a time to select it, or try a different provider
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPreviousProvider}
              disabled={currentIndex === 0 || isProcessing}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {hasDeclinedProviders && (
                <Button
                  onClick={retryDeclinedProviders}
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Declined ({declinedProviders.length})
                </Button>
              )}
            </div>

            <Button
              onClick={goToNextProvider}
              disabled={isLastProvider || isProcessing}
              variant="outline"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing State */}
      {isProcessing && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Sending job offer...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we process your request</p>
          </CardContent>
        </Card>
      )}

      {/* Provider Count and Progress */}
      {providers.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Provider {currentIndex + 1} of {providers.length}
              </span>
              <span className="text-purple-600 font-medium">
                {Math.round(((currentIndex + 1) / providers.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / providers.length) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 