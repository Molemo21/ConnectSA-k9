/**
 * Runtime validation utilities for booking objects
 * Provides type guards and validation functions
 */

import { NormalizedBooking } from './normalize-booking';

/**
 * Type guard to check if an object is a valid booking
 */
export function isBooking(obj: any): obj is NormalizedBooking {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required primitive fields
  const requiredFields = ['id', 'status', 'scheduledDate', 'totalAmount', 'address', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (typeof obj[field] !== 'string' && field !== 'totalAmount') {
      return false;
    }
    if (field === 'totalAmount' && typeof obj[field] !== 'number') {
      return false;
    }
  }

  // Check nested objects
  if (!isService(obj.service)) return false;
  if (!isClient(obj.client)) return false;
  if (!isProvider(obj.provider)) return false;

  // Optional fields
  if (obj.payment && !isPayment(obj.payment)) return false;
  if (obj.review && !isReview(obj.review)) return false;

  return true;
}

/**
 * Type guard for service object
 */
export function isService(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.basePrice === undefined || typeof obj.basePrice === 'number')
  );
}

/**
 * Type guard for client object
 */
export function isClient(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    (obj.phone === undefined || typeof obj.phone === 'string')
  );
}

/**
 * Type guard for provider object
 */
export function isProvider(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    (obj.businessName === undefined || typeof obj.businessName === 'string') &&
    isUser(obj.user)
  );
}

/**
 * Type guard for user object
 */
export function isUser(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    (obj.phone === undefined || typeof obj.phone === 'string')
  );
}

/**
 * Type guard for payment object
 */
export function isPayment(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.escrowAmount === 'number' &&
    typeof obj.platformFee === 'number' &&
    typeof obj.paystackRef === 'string' &&
    (obj.paidAt === undefined || typeof obj.paidAt === 'string') &&
    (obj.authorizationUrl === undefined || typeof obj.authorizationUrl === 'string') &&
    (obj.payout === undefined || isPayout(obj.payout))
  );
}

/**
 * Type guard for payout object
 */
export function isPayout(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    (obj.transferCode === undefined || typeof obj.transferCode === 'string')
  );
}

/**
 * Type guard for review object
 */
export function isReview(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.rating === 'number' &&
    typeof obj.createdAt === 'string' &&
    (obj.comment === undefined || typeof obj.comment === 'string')
  );
}

/**
 * Validate and sanitize booking data
 * Returns validated booking or throws error
 */
export function validateBooking(booking: any): NormalizedBooking {
  if (!isBooking(booking)) {
    const errors = getValidationErrors(booking);
    throw new Error(`Invalid booking object: ${errors.join(', ')}`);
  }
  
  return booking as NormalizedBooking;
}

/**
 * Get validation errors for a booking object
 */
export function getValidationErrors(obj: any): string[] {
  const errors: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    errors.push('Not an object');
    return errors;
  }

  // Check required fields
  const requiredFields = ['id', 'status', 'scheduledDate', 'totalAmount', 'address', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    } else if (field === 'totalAmount' && typeof obj[field] !== 'number') {
      errors.push(`Invalid type for ${field}: expected number, got ${typeof obj[field]}`);
    } else if (field !== 'totalAmount' && typeof obj[field] !== 'string') {
      errors.push(`Invalid type for ${field}: expected string, got ${typeof obj[field]}`);
    }
  }

  // Check nested objects
  if (!isService(obj.service)) {
    errors.push('Invalid service object');
  }
  if (!isClient(obj.client)) {
    errors.push('Invalid client object');
  }
  if (!isProvider(obj.provider)) {
    errors.push('Invalid provider object');
  }

  // Check optional objects
  if (obj.payment && !isPayment(obj.payment)) {
    errors.push('Invalid payment object');
  }
  if (obj.review && !isReview(obj.review)) {
    errors.push('Invalid review object');
  }

  return errors;
}

/**
 * Safe booking access with validation
 * Returns validated booking or null if invalid
 */
export function safeValidateBooking(booking: any): NormalizedBooking | null {
  try {
    return validateBooking(booking);
  } catch (error) {
    console.warn('Booking validation failed:', error);
    return null;
  }
}

/**
 * Validate array of bookings
 */
export function validateBookings(bookings: any[]): NormalizedBooking[] {
  if (!Array.isArray(bookings)) {
    throw new Error('Expected array of bookings');
  }

  const validatedBookings: NormalizedBooking[] = [];
  const errors: string[] = [];

  bookings.forEach((booking, index) => {
    try {
      validatedBookings.push(validateBooking(booking));
    } catch (error) {
      errors.push(`Booking at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  if (errors.length > 0) {
    console.warn('Some bookings failed validation:', errors);
  }

  return validatedBookings;
}

/**
 * Safe validation of booking array
 * Returns validated bookings, filtering out invalid ones
 */
export function safeValidateBookings(bookings: any[]): NormalizedBooking[] {
  if (!Array.isArray(bookings)) {
    console.warn('Expected array of bookings, got:', typeof bookings);
    return [];
  }

  return bookings
    .map(booking => safeValidateBooking(booking))
    .filter((booking): booking is NormalizedBooking => booking !== null);
}
