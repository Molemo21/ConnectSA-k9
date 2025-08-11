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

  useEffect(() => {
    discoverProviders()
  }, [])

  const discoverProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/book-service/discover-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, date, time, address })
      })

      if (!response.ok) {
        await handleApiError(response, 'Failed to discover providers')
        return
      }

      const data = await response.json()
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
      const response = await fetch('/api/book-service/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          providerId, 
          serviceId, 
          date, 
          time, 
          address, 
          notes 
        })
      })

      if (!response.ok) {
        await handleApiError(response, 'Failed to send job offer')
        return
      }

      const data = await response.json()
      showToast.success(data.message)
      onProviderSelected(providerId)
    } catch (error) {
      console.error('Send offer error:', error)
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
    } else {
      // No more providers, show retry option
      showToast.info('No more providers available. You can retry declined providers.')
    }
  }

  const handleViewDetails = (provider: Provider) => {
    // TODO: Implement detailed provider view modal
    showToast.info('Detailed provider view coming soon!')
  }

  const goToNextProvider = () => {
    if (currentIndex < providers.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const goToPreviousProvider = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const retryDeclinedProviders = () => {
    const remainingProviders = providers.filter(p => !declinedProviders.includes(p.id))
    if (remainingProviders.length > 0) {
      setProviders(remainingProviders)
      setCurrentIndex(0)
      setDeclinedProviders([])
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
            <p className="text-gray-600">Processing your selection...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 