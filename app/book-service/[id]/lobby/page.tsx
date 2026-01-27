"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Calendar,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { useBookingWebSocket } from "@/hooks/use-booking-websocket"
import { useToast } from "@/hooks/use-toast"
import { saveLobbyState, clearLobbyState, updateLobbyState } from "@/lib/lobby-state"
import { saveLobbyState, clearLobbyState, updateLobbyState } from "@/lib/lobby-state"

interface Booking {
  id: string
  status: string
  scheduledDate: string
  totalAmount: number
  address: string
  description?: string
  provider?: {
    id: string
    businessName: string
    user: {
      name: string
      email: string
      phone?: string
    }
  }
  service?: {
    name: string
    category?: string
  }
  payment?: {
    id: string
    status: string
  }
}

const TIMEOUT_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const POLLING_INTERVAL = 5000 // Poll every 5 seconds as fallback

export default function BookingLobbyPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.id as string
  const { toast } = useToast()
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch booking details
  const fetchBooking = useCallback(async () => {
    if (!bookingId) return

    try {
      const response = await fetch(`/api/book-service/${bookingId}/status`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Booking not found")
        }
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error("Failed to fetch booking status")
      }

      const data = await response.json()
      if (data.success && data.booking) {
        setBooking({
          id: data.booking.id,
          status: data.booking.status,
          scheduledDate: data.booking.scheduledDate,
          totalAmount: data.booking.totalAmount,
          address: data.booking.address,
          description: data.booking.description,
          provider: data.provider,
          service: data.service,
          payment: data.payment
        })
        setError(null)
      }
    } catch (err) {
      console.error("Error fetching booking:", err)
      setError(err instanceof Error ? err.message : "Failed to load booking")
    } finally {
      setLoading(false)
    }
  }, [bookingId, router])

  // Handle status changes
  const handleStatusChange = useCallback((newStatus: string) => {
    if (!booking) return

    setBooking(prev => prev ? { ...prev, status: newStatus } : null)

    if (newStatus === 'CONFIRMED') {
      toast({
        title: "🎉 Booking Confirmed!",
        description: "Provider has accepted your booking request.",
        duration: 5000,
      })
      
      // Auto-redirect after 3 seconds
      setRedirecting(true)
      redirectTimeoutRef.current = setTimeout(() => {
        router.push(`/dashboard?booking=confirmed&id=${bookingId}`)
      }, 3000)
    } else if (newStatus === 'CANCELLED') {
      toast({
        title: "Booking Declined",
        description: "Provider has declined your booking request.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }, [booking, bookingId, router, toast])

  // WebSocket connection for real-time updates
  const { isConnected, lastUpdate } = useBookingWebSocket({
    bookingId: bookingId,
    enabled: !!bookingId && booking?.status === 'PENDING',
    onStatusChange: (id, newStatus, bookingData) => {
      if (id === bookingId) {
        handleStatusChange(newStatus)
      }
    },
    onBookingUpdate: (bookingData) => {
      if (bookingData?.id === bookingId) {
        setBooking(prev => prev ? { ...prev, ...bookingData } : null)
      }
    }
  })

  // Polling fallback (runs every 5 seconds if WebSocket fails)
  useEffect(() => {
    if (!bookingId || booking?.status !== 'PENDING') return

    // Initial fetch
    fetchBooking()

    // Set up polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchBooking()
    }, POLLING_INTERVAL)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [bookingId, booking?.status, fetchBooking])

  // Timeout handling (5 minutes)
  useEffect(() => {
    if (!booking || booking.status !== 'PENDING') {
      // Clear timeout if booking is no longer pending
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true)
      toast({
        title: "⏰ No Response Yet",
        description: "It's been 5 minutes and the provider hasn't responded. You can wait longer or find another provider.",
        duration: 10000,
      })
    }, TIMEOUT_DURATION)

    // Track elapsed time
    elapsedIntervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1000
        if (newTime >= TIMEOUT_DURATION) {
          setIsTimedOut(true)
        }
        return newTime
      })
    }, 1000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current)
      }
    }
  }, [booking, toast])

  // Initial load
  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId, fetchBooking])

  // Track lobby state for recovery after logout/login
  useEffect(() => {
    if (bookingId && booking) {
      // Save lobby state when entering lobby
      saveLobbyState({
        bookingId: booking.id,
        enteredAt: new Date().toISOString(),
        status: booking.status,
        serviceName: booking.service?.name,
        providerName: booking.provider?.businessName
      })

      // Update state when booking status changes
      if (booking.status !== 'PENDING') {
        updateLobbyState({ status: booking.status })
      }

      // Clean up when booking is confirmed or cancelled (after redirect delay)
      if (booking.status === 'CONFIRMED' || booking.status === 'CANCELLED') {
        const cleanupTimer = setTimeout(() => {
          clearLobbyState()
        }, 5000) // Clear 5 seconds after status change

        return () => clearTimeout(cleanupTimer)
      }
    }
  }, [bookingId, booking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const timeRemaining = Math.max(0, TIMEOUT_DURATION / 1000 - timeElapsed / 1000)

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading booking details...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                <h2 className="text-xl font-bold mb-2">Error Loading Booking</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="space-y-2">
                  <Button onClick={() => router.push('/dashboard')} className="w-full">
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={fetchBooking} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) return null

  const isPending = booking.status === 'PENDING'
  const isConfirmed = booking.status === 'CONFIRMED'
  const isCancelled = booking.status === 'CANCELLED'

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/booker.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                {isPending && (
                  <>
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Waiting for Provider Response
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      Your booking request has been sent. We'll notify you when the provider responds.
                    </p>
                  </>
                )}
                
                {isConfirmed && (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-green-600">
                      Booking Confirmed! 🎉
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      Provider has accepted your booking request!
                    </p>
                    {redirecting && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                        <p className="text-sm text-gray-600">
                          Taking you to your dashboard...
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                {isCancelled && (
                  <>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-600">
                      Booking Declined
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      Provider has declined your booking request.
                    </p>
                  </>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Provider</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {booking.provider?.businessName || 'Loading...'}
                    </span>
                  </div>
                  
                  {booking.service && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Service</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {booking.service.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Date & Time</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(booking.scheduledDate).toLocaleString('en-ZA', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Amount</span>
                    <span className="text-sm font-semibold text-gray-900">
                      R {booking.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Address
                    </span>
                    <span className="text-sm text-gray-900 text-right max-w-xs">
                      {booking.address}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <Badge 
                    variant={
                      isConfirmed ? "default" : 
                      isCancelled ? "destructive" : 
                      "secondary"
                    }
                    className="text-sm px-4 py-1"
                  >
                    {booking.status}
                  </Badge>
                </div>

                {/* Pending State - Time & Connection Status */}
                {isPending && (
                  <div className="space-y-4">
                    {/* Connection Status */}
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-gray-600">
                        {isConnected ? 'Real-time updates active' : 'Polling for updates...'}
                      </span>
                    </div>

                    {/* Time Remaining */}
                    {!isTimedOut && (
                      <div className="text-center">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">
                            Waiting: {formatTime(Math.floor(timeRemaining))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Timeout Message */}
                    {isTimedOut && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800">
                              No Response Yet
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              It's been 5 minutes and the provider hasn't responded. You can wait longer or find another provider.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  {isConfirmed && (
                    <Button 
                      onClick={() => router.push(`/dashboard?booking=confirmed&id=${bookingId}`)}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  
                  {isCancelled && (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                              Booking Declined
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              Don't worry! You can find another provider to complete your service.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => router.push('/book-service')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Find Another Provider
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                  
                  {isPending && (
                    <>
                      {isTimedOut && (
                        <Button 
                          onClick={() => router.push('/book-service')}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          Find Another Provider
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                      {!isTimedOut && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">
                            Please wait for the provider to respond... You'll be notified automatically.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
