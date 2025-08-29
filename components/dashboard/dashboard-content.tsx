"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, Star, MapPin, Plus, Home, Wrench, Paintbrush, Zap, Car, Scissors, TrendingUp, DollarSign, CheckCircle, AlertCircle, BarChart3, RefreshCw, AlertTriangle, Loader2 } from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ReviewSection } from "@/components/review-section"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { EnhancedStatsDashboard } from "@/components/dashboard/enhanced-stats-dashboard"
import { BookingManagement } from "@/components/dashboard/booking-management"
import { showToast, handleApiError } from "@/lib/toast"
import { LoadingCard } from "@/components/ui/loading-spinner"
import { useBookingData } from "@/hooks/use-booking-data"
import { PerformanceMonitor } from "@/components/ui/performance-monitor"

// Helper function to get service icon
function getServiceIcon(serviceName: string) {
  const name = serviceName.toLowerCase()
  if (name.includes('clean') || name.includes('house')) return Home
  if (name.includes('plumb')) return Wrench
  if (name.includes('paint')) return Paintbrush
  if (name.includes('electr')) return Zap
  if (name.includes('car') || name.includes('wash')) return Car
  if (name.includes('hair') || name.includes('beauty') || name.includes('makeup')) return Scissors
  return Home // default icon
}

export function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [initialBookings, setInitialBookings] = useState<any[]>([])

  // Get search params to detect payment success callback
  const searchParams = useSearchParams()

  // Use the optimized booking data hook
  const { 
    bookings, 
    refreshBooking, 
    refreshAllBookings, 
    isLoading: isRefreshing, 
    error: refreshError 
  } = useBookingData(initialBookings)

  // Handle payment success callback
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment')
    const bookingId = searchParams.get('booking')
    const trxref = searchParams.get('trxref')
    const reference = searchParams.get('reference')
    
    if (paymentSuccess === 'success' && bookingId) {
      console.log('🎉 Payment success callback detected:', { paymentSuccess, bookingId, trxref, reference })
      
      // Show success message
      showToast.success('Payment completed successfully! Refreshing booking status...')
      
      // Refresh the specific booking to get updated status
      if (refreshBooking) {
        refreshBooking(bookingId)
      }
      
      // Also refresh all bookings to ensure consistency
      setTimeout(() => {
        if (refreshAllBookings) {
          refreshAllBookings()
          setLastRefresh(new Date())
        }
      }, 1000)
      
      // Clean up URL params
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('booking')
      url.searchParams.delete('trxref')
      url.searchParams.delete('reference')
      window.history.replaceState({}, '', url.toString())
      
      // Start aggressive polling for payment status update
      const pollInterval = setInterval(async () => {
        try {
          console.log('🔄 Polling for payment status update for booking:', bookingId)
          
          // First try to get booking status
          const response = await fetch(`/api/book-service/${bookingId}/status`)
          if (response.ok) {
            const data = await response.json()
            console.log('📊 Current booking status:', data)
            
            if (data.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED'].includes(data.payment.status)) {
              console.log('✅ Payment status updated to:', data.payment.status)
              clearInterval(pollInterval)
              
              // Refresh all bookings to show updated status
              if (refreshAllBookings) {
                refreshAllBookings()
                setLastRefresh(new Date())
              }
              
              // Show final success message
              showToast.success(`Payment confirmed! Status: ${data.payment.status}`)
            } else if (data.payment && data.payment.status === 'PENDING') {
              console.log('⏳ Payment still pending, continuing to poll...')
            } else {
              console.log('ℹ️ Payment status:', data.payment?.status || 'No payment found')
            }
          } else {
            console.error('❌ Failed to get booking status:', response.status)
          }
        } catch (error) {
          console.error('Payment status check error:', error)
        }
      }, 2000) // Check every 2 seconds for faster response
      
      // Stop polling after 3 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        console.log('⏰ Payment status polling stopped after timeout')
      }, 180000)
    }
  }, [searchParams, refreshBooking, refreshAllBookings])

  // Auto-refresh mechanism for payment status updates
  useEffect(() => {
    // Only start polling if we have bookings and user is authenticated
    if (!bookings.length || !user) return;

    // Check if any bookings are in payment-related states that need monitoring
    const hasPaymentBookings = bookings.some(booking => 
      booking.payment && ['PENDING', 'ESCROW'].includes(booking.payment.status)
    );

    if (!hasPaymentBookings) return;

    console.log('🔄 Starting payment status polling for bookings with pending payments...');
    
    // Poll every 8 seconds for payment status updates (more frequent for better UX)
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling for payment status updates...');
        
        // Check if any payments have changed status
        const currentBookings = await fetch('/api/bookings/my-bookings').then(res => res.json()).catch(() => null);
        
        if (currentBookings && currentBookings.bookings) {
          // Compare current status with stored status
          let hasChanges = false;
          
          currentBookings.bookings.forEach((currentBooking: any) => {
            const storedBooking = bookings.find(b => b.id === currentBooking.id);
            if (storedBooking && storedBooking.payment && currentBooking.payment) {
              if (storedBooking.payment.status !== currentBooking.payment.status) {
                console.log(`🔄 Payment status changed for booking ${currentBooking.id}:`, {
                  from: storedBooking.payment.status,
                  to: currentBooking.payment.status
                });
                hasChanges = true;
              }
            }
          });
          
          if (hasChanges) {
            console.log('✅ Payment status changes detected, refreshing dashboard...');
            if (refreshAllBookings) {
              await refreshAllBookings();
              setLastRefresh(new Date());
            }
          }
        }
      } catch (error) {
        console.error('❌ Payment status polling error:', error);
      }
    }, 8000); // 8 seconds

    // Cleanup interval on unmount or when dependencies change
    return () => {
      console.log('🧹 Cleaning up payment status polling interval');
      clearInterval(pollInterval);
    };
  }, [bookings, user, refreshAllBookings]);

  // Manual refresh function with proper error handling
  const handleManualRefresh = async () => {
    if (isRefreshing) {
      showToast.info("Refresh already in progress. Please wait.")
      return
    }

    try {
      await refreshAllBookings()
      setLastRefresh(new Date())
      showToast.success("Payment statuses refreshed successfully!")
    } catch (error) {
      console.error('Manual refresh error:', error)
      showToast.error("Failed to refresh payment statuses. Please try again.")
    }
  }

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        // Fetch user data
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          window.location.href = '/login'
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        // Check user role and redirect if needed
        if (userData.user.role === "PROVIDER") {
          const providerRes = await fetch('/api/provider/status')
          if (providerRes.ok) {
            const providerData = await providerRes.json()
            if (!providerData.provider || providerData.provider.status === "INCOMPLETE" || providerData.provider.status === "REJECTED") {
              window.location.href = '/provider/onboarding'
              return
            } else if (providerData.provider.status === "PENDING") {
              window.location.href = '/provider/pending'
              return
            } else if (providerData.provider.status === "APPROVED") {
              window.location.href = '/provider/dashboard'
              return
            }
          }
        } else if (userData.user.role === "ADMIN") {
          window.location.href = '/admin'
          return
        } else if (userData.user.role !== "CLIENT") {
          window.location.href = '/'
          return
        }

        if (!userData.user.emailVerified) {
          window.location.href = '/verify-email'
          return
        }

        // Fetch bookings
        console.log('🔍 Fetching bookings from API...')
        const bookingsRes = await fetch('/api/bookings/my-bookings', {
          credentials: 'include' // Include cookies for authentication
        })
        console.log('📥 Bookings API response:', {
          status: bookingsRes.status,
          statusText: bookingsRes.statusText,
          ok: bookingsRes.ok
        })
        
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          console.log('✅ Bookings data received:', {
            count: bookingsData.bookings?.length || 0,
            bookings: bookingsData.bookings
          })
          
          // Additional debugging - log each booking
          if (bookingsData.bookings) {
            console.log('📋 Individual bookings:')
            bookingsData.bookings.forEach((booking: any, index: number) => {
              console.log(`  ${index + 1}. ID: ${booking.id}, Status: ${booking.status}, Service: ${booking.service?.name}, Date: ${booking.scheduledDate}`)
            })
          }
          
          // Initialize the useBookingData hook with fetched data
          setInitialBookings(bookingsData.bookings || [])
        } else {
          console.error('❌ Failed to fetch bookings:', bookingsRes.status, bookingsRes.statusText)
          const errorText = await bookingsRes.text()
          console.error('❌ Error response body:', errorText)
        }

        // Fetch services
        const servicesRes = await fetch('/api/services', {
          credentials: 'include' // Include cookies for authentication
        })
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData)
        } else {
          console.error('Failed to fetch services:', servicesRes.status, servicesRes.statusText)
        }

      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Dashboard data fetch error:', err)
        showToast.error('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <LoadingCard text="Loading your dashboard..." />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Calculate real stats with enhanced details
  const totalBookings = bookings.length
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED").length
  const inProgressBookings = bookings.filter(b => b.status === "IN_PROGRESS").length
  const cancelledBookings = bookings.filter(b => b.status === "CANCELLED").length
  
  // Calculate recent bookings (created within last 24 hours)
  const recentBookings = bookings.filter(b => {
    if (!b.createdAt) return false
    const now = new Date()
    const created = new Date(b.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }).length
  
  const totalSpent = bookings
    .filter(b => b.payment)
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
  
  const averageRating = bookings
    .filter(b => b.review)
    .reduce((sum, b) => sum + (b.review?.rating || 0), 0) / 
    bookings.filter(b => b.review).length || 0

  // Calculate monthly trends (simplified)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduledDate)
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
  }).length

  const lastMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduledDate)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear
  }).length

  const bookingGrowth = lastMonthBookings > 0 
    ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
    : thisMonthBookings > 0 ? 100 : 0

  // Process services with real data
  const popularServices = services.map((service: any) => {
    const providerCount = service.providers?.length || 0
    const allRatings = (service.providers || []).flatMap((ps: any) => 
      (ps.provider?.reviews || []).map((r: any) => r.rating)
    )
    const averageServiceRating = allRatings.length > 0 
      ? allRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allRatings.length 
      : 0

    return {
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      providerCount,
      averageRating: Math.round(averageServiceRating * 10) / 10,
      icon: getServiceIcon(service.name),
    }
  }).filter(service => service.providerCount > 0).slice(0, 6) // Show top 6 services with providers

  const enhancedStats = [
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: `${bookingGrowth >= 0 ? '+' : ''}${bookingGrowth}%`,
      changeType: bookingGrowth >= 0 ? "positive" : "negative",
      details: [
        { label: "This Month", value: thisMonthBookings, trend: bookingGrowth >= 0 ? "up" : "down" },
        { label: "Last Month", value: lastMonthBookings, trend: "stable" },
        { label: "Completed", value: completedBookings, trend: "up" },
        { label: "Cancelled", value: cancelledBookings, trend: "down" }
      ]
    },
    {
      title: "Completed Jobs",
      value: completedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: `${Math.round((completedBookings / totalBookings) * 100)}%`,
      changeType: "positive",
      details: [
        { label: "Success Rate", value: `${Math.round((completedBookings / totalBookings) * 100)}%`, trend: "up" },
        { label: "Average Rating", value: averageRating.toFixed(1), trend: "up" },
        { label: "Total Reviews", value: bookings.filter(b => b.review).length, trend: "up" }
      ]
    },
    {
      title: "Active Bookings",
      value: pendingBookings + confirmedBookings + inProgressBookings,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "Active",
      changeType: "neutral",
      details: [
        { label: "Pending", value: pendingBookings, trend: "stable" },
        { label: "Confirmed", value: confirmedBookings, trend: "up" },
        { label: "In Progress", value: inProgressBookings, trend: "up" }
      ]
    },
    {
      title: "Total Spent",
      value: `R${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "+25%",
      changeType: "positive",
      details: [
        { label: "This Month", value: `R${(totalSpent * 0.3).toFixed(2)}`, trend: "up" },
        { label: "Average per Booking", value: `R${totalBookings > 0 ? (totalSpent / totalBookings).toFixed(2) : '0.00'}`, trend: "up" },
        { label: "Payment Received", value: bookings.filter(b => b.payment).length, trend: "up" }
      ]
    },
    {
      title: "Recent Bookings",
      value: recentBookings,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "Last 24h",
      changeType: "neutral",
      details: [
        { label: "New Today", value: recentBookings, trend: "up" },
        { label: "Pending Review", value: bookings.filter(b => b.status === "COMPLETED" && !b.review).length, trend: "stable" },
        { label: "Active Now", value: pendingBookings + confirmedBookings + inProgressBookings, trend: "up" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
              <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user.name || user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
              
              {/* Debug Section */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/webhooks/paystack');
                      const data = await response.json();
                      console.log('Webhook debug info:', data);
                      showToast.success('Webhook debug info logged to console');
                    } catch (error) {
                      console.error('Webhook debug error:', error);
                      showToast.error('Failed to get webhook debug info');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Test Webhook
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      // Force refresh all bookings
                      if (refreshAllBookings) {
                        await refreshAllBookings();
                        setLastRefresh(new Date());
                        showToast.success('Forced refresh completed');
                      }
                    } catch (error) {
                      console.error('Forced refresh error:', error);
                      showToast.error('Forced refresh failed');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Force Refresh
                </Button>
                
                <Button 
                  onClick={async () => {
                    try {
                      // Find any PENDING payments and attempt recovery
                      const pendingPayments = bookings.filter(b => 
                        b.payment && b.payment.status === 'PENDING'
                      );
                      
                      if (pendingPayments.length === 0) {
                        showToast.info('No pending payments found');
                        return;
                      }
                      
                      showToast.info(`Found ${pendingPayments.length} pending payment(s). Attempting recovery...`);
                      
                      // Attempt recovery for each pending payment
                      for (const booking of pendingPayments) {
                        try {
                          console.log(`🔄 Attempting payment recovery for booking ${booking.id}, payment ${booking.payment.id}`);
                          
                          const response = await fetch('/api/payment/recover-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paymentId: booking.payment.id })
                          });
                          
                          console.log(`📡 Recovery API response status:`, response.status);
                          console.log(`📡 Recovery API response headers:`, Object.fromEntries(response.headers.entries()));
                          
                          const result = await response.json();
                          console.log(`📡 Recovery API response body:`, result);
                          
                          if (!response.ok) {
                            console.error(`❌ Recovery API error response:`, {
                              status: response.status,
                              statusText: response.statusText,
                              result
                            });
                            
                            const errorMessage = result.error || result.message || `HTTP ${response.status}: ${response.statusText}`;
                            showToast.error(`Payment recovery failed for booking ${booking.id}: ${errorMessage}`);
                            continue;
                          }
                          
                          if (result.success) {
                            console.log(`✅ Payment recovery successful for booking ${booking.id}:`, result);
                            showToast.success(`Payment recovered for booking ${booking.id}`);
                          } else {
                            console.error(`❌ Payment recovery failed for booking ${booking.id}:`, result);
                            const errorMessage = result.message || result.error || 'Unknown error';
                            showToast.error(`Payment recovery failed for booking ${booking.id}: ${errorMessage}`);
                          }
                        } catch (error) {
                          console.error(`❌ Payment recovery error for booking ${booking.id}:`, error);
                          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                          showToast.error(`Payment recovery error for booking ${booking.id}: ${errorMessage}`);
                        }
                      }
                      
                      // Refresh bookings after recovery attempts
                      setTimeout(() => {
                        if (refreshAllBookings) {
                          refreshAllBookings();
                          setLastRefresh(new Date());
                        }
                      }, 2000);
                      
                    } catch (error) {
                      console.error('Payment recovery error:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                      showToast.error(`Payment recovery failed: ${errorMessage}`);
                    }
                  }}
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Recover Payments
                </Button>
                
                {user?.role === 'ADMIN' && (
                  <Button
                    onClick={async () => {
                      try {
                        showToast.info('Cleaning up duplicate payout records...');
                        
                        const response = await fetch('/api/payment/cleanup-orphaned-payouts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                          console.log('🧹 Cleanup result:', result);
                          showToast.success(`Cleanup completed! Cleaned ${result.cleanedCount} items.`);
                          
                          // Refresh bookings after cleanup
                          setTimeout(() => {
                            if (refreshAllBookings) {
                              refreshAllBookings();
                              setLastRefresh(new Date());
                            }
                          }, 1000);
                        } else {
                          console.error('❌ Cleanup failed:', result);
                          showToast.error(`Cleanup failed: ${result.message}`);
                        }
                      } catch (error) {
                        console.error('Cleanup error:', error);
                        showToast.error('Cleanup failed');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Cleanup Payouts
                  </Button>
                )}
                
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <a href="/payment-debug">
                    Payment Debug
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Status Summary */}
          {bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status)) && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">
                    {bookings.filter(b => b.payment && b.payment.status === 'PENDING').length} payment(s) processing
                  </span>
                  <span className="text-xs text-blue-600">
                    • {bookings.filter(b => b.payment && b.payment.status === 'ESCROW').length} payment(s) in escrow
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                  {isRefreshing && (
                    <span className="flex items-center">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Refreshing...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <a href="/book-service">
                <Plus className="w-5 h-5 mr-2" />
                Book New Service
              </a>
            </Button>
          </div>

          {/* Stats Dashboard */}
          <EnhancedStatsDashboard 
            stats={enhancedStats}
            bookings={bookings}
            totalSpent={totalSpent}
            averageRating={averageRating}
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Bookings */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Recent Bookings</span>
                  </CardTitle>
                  <CardDescription>
                    Track the status of your service bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                      <p className="text-gray-600 mb-6">
                        You haven't made any bookings yet. Start by exploring our available services!
                      </p>
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <a href="/book-service">Book Your First Service</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Payment Troubleshooting Info */}
                      {bookings.some(b => b.payment && b.payment.status === 'PENDING') && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-amber-800 mb-1">
                                Payment Processing Information
                              </h4>
                              <p className="text-sm text-amber-700 mb-2">
                                Some of your payments are currently being processed. Here's what to expect:
                              </p>
                              <div className="text-xs text-amber-600 space-y-1">
                                <p>• <strong>Normal processing time:</strong> 2-5 minutes</p>
                                <p>• <strong>If you completed payment:</strong> Refresh this page or wait for automatic update</p>
                                <p>• <strong>If payment is taking longer:</strong> This is usually normal - wait up to 10 minutes</p>
                                <p>• <strong>Payment stuck after 10 minutes:</strong> Use the "Check Status" button on each booking</p>
                                <p>• <strong>Still having issues:</strong> Contact support only after trying the above steps</p>
                              </div>
                              <div className="mt-3 pt-2 border-t border-amber-200">
                                <p className="text-xs text-amber-600">
                                  <strong>💡 Pro tip:</strong> You can safely close the payment tab after completing payment. 
                                  The status will update automatically on this page.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Debug info - remove this later */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Debug:</strong> Total bookings: {bookings.length} | 
                          Recent (24h): {recentBookings} | 
                          Showing: {Math.min(bookings.length, 5)} | 
                          Statuses: {bookings.map(b => b.status).join(', ')}
                        </p>
                      </div>
                      
                      {bookings.slice(0, 5).map((booking) => (
                        <EnhancedBookingCard
                          key={booking.id}
                          booking={booking}
                          onStatusChange={(bookingId, newStatus) => {
                            // This functionality is now handled by useBookingData
                          }}
                          onRefresh={refreshBooking}
                        />
                      ))}
                      
                      {/* Show "View All" button if there are more than 5 bookings */}
                      {bookings.length > 5 && (
                        <div className="text-center pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => window.location.href = '/bookings'}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            View All {bookings.length} Bookings
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Popular Services */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Available Services</span>
                  </CardTitle>
                  <CardDescription>
                    Explore our most popular services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {popularServices.length > 0 ? (
                      popularServices.map((service, index) => {
                        const Icon = service.icon
                        return (
                          <div 
                            key={service.id} 
                            className="group p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer"
                            onClick={() => window.location.href = `/book-service?service=${service.id}`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg mb-1">{service.name}</h3>
                                <p className="text-gray-600 mb-2">{service.category}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-gray-600">{service.averageRating.toFixed(1)}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">{service.providerCount} providers</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <Button 
                                size="sm" 
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = `/book-service?service=${service.id}`
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Book Now
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
                        <p className="text-gray-600">
                          There are currently no active service providers in your area.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/book-service">
                        <Plus className="w-4 h-4 mr-2" />
                        Book New Service
                      </a>
                    </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/bookings">
                        <Calendar className="w-4 h-4 mr-2" />
                        View All Bookings
                      </a>
                    </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/analytics">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </a>
                    </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/reviews">
                        <Star className="w-4 h-4 mr-2" />
                        My Reviews
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Management */}
              {bookings.length > 0 && (
                <BookingManagement
                  booking={bookings[0]} // Show management for the most recent booking
                  onUpdate={(bookingId, updates) => {
                    // This functionality is now handled by useBookingData
                  }}
                />
              )}

              {/* Account Status */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Verified</span>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Bookings</span>
                      <span className="font-semibold">{totalBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed Jobs</span>
                      <span className="font-semibold">{completedBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Spent</span>
                      <span className="font-semibold">R{totalSpent.toFixed(2)}</span>
                    </div>
                    {averageRating > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Rating</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Monitor */}
              <PerformanceMonitor />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 