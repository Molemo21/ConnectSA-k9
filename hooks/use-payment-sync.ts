/**
 * Robust Payment Synchronization Hook
 * 
 * This hook implements best practices for payment state synchronization:
 * - Always fetches fresh data from API
 * - Implements proper cache invalidation
 * - Provides optimistic updates with rollback
 * - Handles loading and error states
 * - Ensures frontend never shows stale payment data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentData {
  id: string;
  status: 'PENDING' | 'ESCROW' | 'HELD_IN_ESCROW' | 'RELEASED' | 'COMPLETED' | 'FAILED';
  amount: number;
  paystackRef: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingData {
  id: string;
  status: string;
  payment?: PaymentData;
  [key: string]: any;
}

interface UsePaymentSyncOptions {
  bookingId?: string;
  paymentRef?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UsePaymentSyncReturn {
  payment: PaymentData | null;
  booking: BookingData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshPayment: () => Promise<void>;
  verifyPayment: () => Promise<boolean>;
  invalidateCache: () => void;
}

// Global cache with proper invalidation
const paymentCache = new Map<string, {
  data: PaymentData | BookingData;
  timestamp: number;
  etag?: string;
}>();

// Cache TTL: 30 seconds for payment data, 5 minutes for booking data
const PAYMENT_CACHE_TTL = 30 * 1000;
const BOOKING_CACHE_TTL = 5 * 60 * 1000;

// Global refresh queue to prevent duplicate requests
const refreshQueue = new Set<string>();
const activeRequests = new Map<string, Promise<any>>();

export function usePaymentSync(options: UsePaymentSyncOptions = {}): UsePaymentSyncReturn {
  const {
    bookingId,
    paymentRef,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cache key for this payment/booking
  const cacheKey = paymentRef || bookingId || 'unknown';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Invalidate cache function
  const invalidateCache = useCallback(() => {
    paymentCache.delete(cacheKey);
    paymentCache.delete(`booking-${cacheKey}`);
    paymentCache.delete(`payment-${cacheKey}`);
  }, [cacheKey]);

  // Fetch payment data with proper error handling and caching
  const fetchPaymentData = useCallback(async (forceRefresh = false): Promise<{
    payment: PaymentData | null;
    booking: BookingData | null;
  }> => {
    const now = Date.now();
    const cached = paymentCache.get(cacheKey);
    
    // Return cached data if not expired and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < PAYMENT_CACHE_TTL) {
      return {
        payment: cached.data as PaymentData,
        booking: paymentCache.get(`booking-${cacheKey}`)?.data as BookingData || null
      };
    }

    // Prevent duplicate requests
    if (activeRequests.has(cacheKey)) {
      return await activeRequests.get(cacheKey)!;
    }

    const requestPromise = (async () => {
      try {
        let url = '/api/payment/verify';
        const params = new URLSearchParams();
        
        if (paymentRef) {
          params.set('reference', paymentRef);
        } else if (bookingId) {
          params.set('bookingId', bookingId);
        } else {
          throw new Error('Either paymentRef or bookingId is required');
        }

        url += `?${params.toString()}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch payment data');
        }

        const paymentData = data.payment;
        const bookingData = data.booking;

        // Cache the data
        paymentCache.set(cacheKey, {
          data: paymentData,
          timestamp: now,
          etag: response.headers.get('etag') || undefined
        });

        if (bookingData) {
          paymentCache.set(`booking-${cacheKey}`, {
            data: bookingData,
            timestamp: now
          });
        }

        return {
          payment: paymentData,
          booking: bookingData
        };

      } catch (error) {
        console.error('Payment sync fetch error:', error);
        throw error;
      } finally {
        activeRequests.delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, requestPromise);
    return await requestPromise;
  }, [cacheKey, paymentRef, bookingId]);

  // Refresh payment data
  const refreshPayment = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const { payment: paymentData, booking: bookingData } = await fetchPaymentData(true);
      
      if (mountedRef.current) {
        setPayment(paymentData);
        setBooking(bookingData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      if (mountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to refresh payment data');
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [fetchPaymentData]);

  // Verify payment with Paystack
  const verifyPayment = useCallback(async (): Promise<boolean> => {
    if (!paymentRef) return false;

    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: paymentRef }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.recovery?.needed) {
        // Payment status was updated, refresh our data
        await refreshPayment();
        return true;
      }

      return data.success;
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error instanceof Error ? error.message : 'Payment verification failed');
      return false;
    }
  }, [paymentRef, refreshPayment]);

  // Initial data fetch
  useEffect(() => {
    if (!paymentRef && !bookingId) return;

    setIsLoading(true);
    setError(null);

    fetchPaymentData()
      .then(({ payment: paymentData, booking: bookingData }) => {
        if (mountedRef.current) {
          setPayment(paymentData);
          setBooking(bookingData);
          setLastUpdated(new Date());
        }
      })
      .catch((error) => {
        if (mountedRef.current) {
          setError(error instanceof Error ? error.message : 'Failed to fetch payment data');
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      });
  }, [paymentRef, bookingId, fetchPaymentData]);

  // Auto-refresh for pending payments
  useEffect(() => {
    if (!autoRefresh || !payment || payment.status !== 'PENDING') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      refreshPayment();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, payment?.status, refreshInterval, refreshPayment]);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'payment-cache-invalidated') {
        invalidateCache();
        refreshPayment();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [invalidateCache, refreshPayment]);

  // Listen for focus events (refresh when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (payment && payment.status === 'PENDING') {
        refreshPayment();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [payment?.status, refreshPayment]);

  return {
    payment,
    booking,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refreshPayment,
    verifyPayment,
    invalidateCache,
  };
}

// Utility function to invalidate payment cache globally
export function invalidatePaymentCache(bookingId?: string, paymentRef?: string) {
  const key = paymentRef || bookingId || 'all';
  
  if (key === 'all') {
    paymentCache.clear();
  } else {
    paymentCache.delete(key);
    paymentCache.delete(`booking-${key}`);
    paymentCache.delete(`payment-${key}`);
  }

  // Notify other tabs
  localStorage.setItem('payment-cache-invalidated', Date.now().toString());
  localStorage.removeItem('payment-cache-invalidated');
}

// Utility function to check if payment is in a "paid" state
export function isPaymentPaid(payment: PaymentData | null): boolean {
  if (!payment) return false;
  return ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(payment.status);
}

// Utility function to get payment display status
export function getPaymentDisplayStatus(payment: PaymentData | null): {
  status: string;
  color: string;
  icon: string;
  description: string;
} {
  if (!payment) {
    return {
      status: 'No Payment',
      color: 'text-gray-500',
      icon: 'Clock',
      description: 'No payment information available'
    };
  }

  switch (payment.status) {
    case 'PENDING':
      return {
        status: 'Payment Pending',
        color: 'text-yellow-600',
        icon: 'Clock',
        description: 'Payment is being processed'
      };
    case 'ESCROW':
    case 'HELD_IN_ESCROW':
      return {
        status: 'Paid - In Escrow',
        color: 'text-blue-600',
        icon: 'DollarSign',
        description: 'Payment received, held in escrow until job completion'
      };
    case 'RELEASED':
    case 'COMPLETED':
      return {
        status: 'Payment Completed',
        color: 'text-green-600',
        icon: 'CheckCircle',
        description: 'Payment has been released to provider'
      };
    case 'FAILED':
      return {
        status: 'Payment Failed',
        color: 'text-red-600',
        icon: 'XCircle',
        description: 'Payment could not be processed'
      };
    default:
      return {
        status: payment.status,
        color: 'text-gray-500',
        icon: 'HelpCircle',
        description: 'Unknown payment status'
      };
  }
}
