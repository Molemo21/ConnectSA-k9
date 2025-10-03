/**
 * Booking normalization utility
 * Ensures consistent booking object shapes from API responses
 */

import { safeValidateBookings } from './validate-booking';

export interface NormalizedBooking {
  id: string
  status: string
  scheduledDate: string
  duration: number
  totalAmount: number
  platformFee: number
  description?: string
  address: string
  createdAt: string
  updatedAt: string
  service: {
    id: string
    name: string
    description?: string
    category: string
    basePrice?: number
  }
  client: {
    id: string
    name: string
    email: string
    phone?: string
  }
  provider: {
    id: string
    businessName?: string
    user: {
      id: string
      name: string
      email: string
      phone?: string
    }
  }
  payment?: {
    id: string
    status: string
    amount: number
    escrowAmount: number
    platformFee: number
    paystackRef: string
    paidAt?: string
    authorizationUrl?: string
    payout?: {
      id: string
      status: string
      transferCode?: string
      createdAt: string
      updatedAt: string
    }
  }
  review?: {
    id: string
    rating: number
    comment?: string
    createdAt: string
  }
}

/**
 * Normalize a booking object from API response
 * Provides safe defaults for all required fields
 */
export function normalizeBooking(booking: any = {}): NormalizedBooking {
  return {
    id: booking.id || '',
    status: booking.status || 'UNKNOWN',
    scheduledDate: booking.scheduledDate || new Date().toISOString(),
    duration: typeof booking.duration === 'number' ? booking.duration : 60,
    totalAmount: typeof booking.totalAmount === 'number' ? booking.totalAmount : 0,
    platformFee: typeof booking.platformFee === 'number' ? booking.platformFee : 0,
    description: booking.description || undefined,
    address: booking.address || 'No address provided',
    createdAt: booking.createdAt || new Date().toISOString(),
    updatedAt: booking.updatedAt || new Date().toISOString(),
    
    service: {
      id: booking.service?.id || 'unknown-service',
      name: booking.service?.name || 'Unknown Service',
      description: booking.service?.description || undefined,
      category: booking.service?.category || 'General',
      basePrice: typeof booking.service?.basePrice === 'number' ? booking.service.basePrice : undefined,
    },
    
    client: {
      id: booking.client?.id || 'unknown-client',
      name: booking.client?.name || 'Unknown Client',
      email: booking.client?.email || 'no-email@example.com',
      phone: booking.client?.phone || undefined,
    },
    
    provider: {
      id: booking.provider?.id || 'unknown-provider',
      businessName: booking.provider?.businessName || undefined,
      user: {
        id: booking.provider?.user?.id || 'unknown-user',
        name: booking.provider?.user?.name || 'Unknown Provider',
        email: booking.provider?.user?.email || 'no-email@example.com',
        phone: booking.provider?.user?.phone || undefined,
      },
    },
    
    payment: booking.payment ? {
      id: booking.payment.id || 'unknown-payment',
      status: booking.payment.status || 'UNKNOWN',
      amount: typeof booking.payment.amount === 'number' ? booking.payment.amount : 0,
      escrowAmount: typeof booking.payment.escrowAmount === 'number' ? booking.payment.escrowAmount : 0,
      platformFee: typeof booking.payment.platformFee === 'number' ? booking.payment.platformFee : 0,
      paystackRef: booking.payment.paystackRef || '',
      paidAt: booking.payment.paidAt || undefined,
      authorizationUrl: booking.payment.authorizationUrl || undefined,
      payout: booking.payment.payout ? {
        id: booking.payment.payout.id || 'unknown-payout',
        status: booking.payment.payout.status || 'UNKNOWN',
        transferCode: booking.payment.payout.transferCode || undefined,
        createdAt: booking.payment.payout.createdAt || new Date().toISOString(),
        updatedAt: booking.payment.payout.updatedAt || new Date().toISOString(),
      } : undefined,
    } : undefined,
    
    review: booking.review ? {
      id: booking.review.id || 'unknown-review',
      rating: typeof booking.review.rating === 'number' ? booking.review.rating : 0,
      comment: booking.review.comment || undefined,
      createdAt: booking.review.createdAt || new Date().toISOString(),
    } : undefined,
  };
}

/**
 * Normalize an array of bookings
 */
export function normalizeBookings(bookings: any[] = []): NormalizedBooking[] {
  if (!Array.isArray(bookings)) {
    console.warn('normalizeBookings: Expected array, got:', typeof bookings);
    return [];
  }

  const normalized = bookings
    .filter(booking => booking && typeof booking === 'object')
    .map(normalizeBooking);

  // Validate the normalized bookings
  return safeValidateBookings(normalized);
}

/**
 * Validate booking object structure
 * Returns true if booking has minimum required fields
 */
export function isValidBooking(booking: any): boolean {
  if (!booking || typeof booking !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['id', 'status', 'service', 'client', 'provider'];
  
  for (const field of requiredFields) {
    if (!booking[field]) {
      return false;
    }
  }

  // Check nested required fields
  if (!booking.service?.name || !booking.client?.name || !booking.provider?.user?.name) {
    return false;
  }

  return true;
}

/**
 * Safe booking access with validation
 * Returns normalized booking or null if invalid
 */
export function safeBooking(booking: any): NormalizedBooking | null {
  if (!isValidBooking(booking)) {
    console.warn('Invalid booking object:', booking);
    return null;
  }

  return normalizeBooking(booking);
}
