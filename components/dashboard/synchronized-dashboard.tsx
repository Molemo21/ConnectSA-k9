/**
 * Synchronized Dashboard Component
 * 
 * This component implements robust payment and booking synchronization:
 * - Always fetches fresh data from API
 * - Implements proper cache invalidation
 * - Handles loading and error states
 * - Provides manual refresh capabilities
 * - Never displays stale payment data
 * - Uses SWR-like patterns for data fetching
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Loader2,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SynchronizedBookingCard } from './synchronized-booking-card';
import { invalidatePaymentCache } from '@/hooks/use-payment-sync';
import { showToast } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Booking {
  id: string;
  status: string;
  scheduledDate: string;
  duration: number;
  totalAmount: number;
  description?: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  service?: {
    name: string;
    category: string;
  };
  provider?: {
    id: string;
    businessName?: string;
    user: {
      name: string;
      phone?: string;
    };
  };
  client?: {
    name: string;
    email: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    paystackRef: string;
    createdAt: string;
    updatedAt: string;
  };
  review?: {
    rating: number;
    comment?: string;
  };
}

interface SynchronizedDashboardProps {
  initialBookings?: Booking[];
  initialUser?: User;
}

export function SynchronizedDashboard({ 
  initialBookings = [], 
  initialUser 
}: SynchronizedDashboardProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshQueue, setRefreshQueue] = useState<Set<string>>(new Set());

  const searchParams = useSearchParams();
  const router = useRouter();

  // Fetch user data
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }, []);

  // Fetch bookings data with cache invalidation
  const fetchBookings = useCallback(async (forceRefresh = false): Promise<Booking[]> => {
    try {
      const url = '/api/bookings/my-bookings';
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };

      // Add cache-busting parameter if forcing refresh
      const finalUrl = forceRefresh ? `${url}?t=${Date.now()}` : url;

      const response = await fetch(finalUrl, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.bookings) {
        throw new Error('Invalid response format');
      }

      return data.bookings;
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      throw error;
    }
  }, []);

  // Handle payment success callback
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment');
    const bookingId = searchParams.get('booking');
    const trxref = searchParams.get('trxref');
    const reference = searchParams.get('reference');

    if (paymentSuccess === 'success' && bookingId) {
      console.log('🎉 Payment success callback detected:', { paymentSuccess, bookingId, trxref, reference });
      
      // Show success message
      showToast.success('Payment completed successfully! Refreshing booking status...');
      
      // Invalidate cache for this booking
      invalidatePaymentCache(bookingId);
      
      // Refresh all bookings to ensure consistency
      setTimeout(async () => {
        try {
          await refreshAllBookings(true);
        } catch (error) {
          console.error('Failed to refresh after payment success:', error);
        }
      }, 1000);
      
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('booking');
      url.searchParams.delete('trxref');
      url.searchParams.delete('reference');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Refresh all bookings
  const refreshAllBookings = useCallback(async (forceRefresh = false) => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const freshBookings = await fetchBookings(forceRefresh);
      setBookings(freshBookings);
      setLastRefresh(new Date());
      
      if (forceRefresh) {
        showToast.success('Booking data refreshed successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh bookings';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, fetchBookings]);

  // Refresh specific booking
  const refreshBooking = useCallback(async (bookingId: string) => {
    if (refreshQueue.has(bookingId)) return;

    setRefreshQueue(prev => new Set(prev).add(bookingId));
    setError(null);

    try {
      // Invalidate cache for this booking
      invalidatePaymentCache(bookingId);
      
      // Refresh all bookings to get the latest data
      await refreshAllBookings(true);
      
      showToast.success('Booking status refreshed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh booking';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setRefreshQueue(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  }, [refreshAllBookings]);

  // Handle booking updates
  const handleBookingUpdate = useCallback((bookingId: string) => {
    // Refresh the specific booking
    refreshBooking(bookingId);
  }, [refreshBooking]);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user if not provided
        if (!user) {
          const userData = await fetchUser();
          setUser(userData);
        }

        // Fetch bookings if not provided or if we need fresh data
        if (initialBookings.length === 0 || Date.now() - new Date(initialBookings[0]?.createdAt || 0).getTime() > 30000) {
          const freshBookings = await fetchBookings(true);
          setBookings(freshBookings);
        }

        setLastRefresh(new Date());
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize dashboard';
        setError(errorMessage);
        showToast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user, initialBookings, fetchUser, fetchBookings]);

  // Auto-refresh for pending payments
  useEffect(() => {
    const hasPendingPayments = bookings.some(booking => 
      booking.payment && booking.payment.status === 'PENDING'
    );

    if (!hasPendingPayments) return;

    const interval = setInterval(() => {
      refreshAllBookings(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [bookings, refreshAllBookings]);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'payment-cache-invalidated') {
        refreshAllBookings(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAllBookings]);

  // Listen for focus events (refresh when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      const hasRecentActivity = bookings.some(booking => 
        booking.payment && booking.payment.status === 'PENDING'
      );
      
      if (hasRecentActivity) {
        refreshAllBookings(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [bookings, refreshAllBookings]);

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    inProgress: bookings.filter(b => b.status === 'IN_PROGRESS').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    pendingPayments: bookings.filter(b => b.payment && b.payment.status === 'PENDING').length,
    paidBookings: bookings.filter(b => b.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(b.payment.status)).length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Failed to load dashboard data</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAllBookings(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Retry
              </Button>
            </div>
            <p className="text-sm mt-2">{error}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Manage your bookings and track payments in real-time
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {lastRefresh && (
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshAllBookings(true)}
            disabled={isRefreshing}
            title="Refresh all data"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Synchronization Error</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAllBookings(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Retry
              </Button>
            </div>
            <p className="text-sm mt-1">{error}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">Total Bookings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Paid Bookings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.paidBookings}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>
        
        {stats.pendingPayments > 0 && (
          <div className="bg-white p-4 rounded-lg border border-orange-200 bg-orange-50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">Pending Payments</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats.pendingPayments}</p>
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600">Start by booking a service to see your bookings here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <SynchronizedBookingCard
                key={booking.id}
                booking={booking}
                onUpdate={handleBookingUpdate}
                onRefresh={refreshBooking}
                className={refreshQueue.has(booking.id) ? 'opacity-50' : ''}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading overlay for individual bookings */}
      {refreshQueue.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">
              Refreshing {refreshQueue.size} booking{refreshQueue.size > 1 ? 's' : ''}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
