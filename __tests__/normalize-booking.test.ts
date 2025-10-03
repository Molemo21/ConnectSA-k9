/**
 * Tests for booking normalization utilities
 * Ensures consistent booking object shapes
 */

import { 
  normalizeBooking, 
  normalizeBookings, 
  isValidBooking, 
  safeBooking 
} from '@/lib/normalize-booking';
import { safeValidateBookings } from '@/lib/validate-booking';

describe('normalizeBooking', () => {
  it('should handle empty object', () => {
    const result = normalizeBooking({});
    expect(result.id).toBe('');
    expect(result.status).toBe('UNKNOWN');
    expect(result.service.name).toBe('Unknown Service');
    expect(result.client.name).toBe('Unknown Client');
  });

  it('should normalize a complete booking object', () => {
    const booking = {
      id: 'test-id',
      status: 'PENDING',
      scheduledDate: '2024-01-01T10:00:00Z',
      duration: 120,
      totalAmount: 500,
      platformFee: 50,
      address: '123 Test St',
      service: {
        id: 'service-id',
        name: 'Test Service',
        category: 'Cleaning'
      },
      client: {
        id: 'client-id',
        name: 'Test Client',
        email: 'test@example.com'
      },
      provider: {
        id: 'provider-id',
        user: {
          id: 'user-id',
          name: 'Test Provider',
          email: 'provider@example.com'
        }
      }
    };

    const result = normalizeBooking(booking);
    expect(result.id).toBe('test-id');
    expect(result.status).toBe('PENDING');
    expect(result.service.name).toBe('Test Service');
    expect(result.client.name).toBe('Test Client');
    expect(result.provider.user.name).toBe('Test Provider');
  });

  it('should handle missing nested objects', () => {
    const booking = {
      id: 'test-id',
      status: 'PENDING'
    };

    const result = normalizeBooking(booking);
    expect(result.service.name).toBe('Unknown Service');
    expect(result.client.name).toBe('Unknown Client');
    expect(result.provider.user.name).toBe('Unknown Provider');
  });

  it('should handle payment object', () => {
    const booking = {
      id: 'test-id',
      payment: {
        id: 'payment-id',
        status: 'PENDING',
        amount: 500,
        escrowAmount: 450,
        platformFee: 50,
        paystackRef: 'ref123'
      }
    };

    const result = normalizeBooking(booking);
    expect(result.payment?.id).toBe('payment-id');
    expect(result.payment?.status).toBe('PENDING');
    expect(result.payment?.amount).toBe(500);
  });

  it('should handle payout object', () => {
    const booking = {
      id: 'test-id',
      payment: {
        id: 'payment-id',
        payout: {
          id: 'payout-id',
          status: 'PENDING',
          transferCode: 'transfer123'
        }
      }
    };

    const result = normalizeBooking(booking);
    expect(result.payment?.payout?.id).toBe('payout-id');
    expect(result.payment?.payout?.status).toBe('PENDING');
  });

  it('should handle review object', () => {
    const booking = {
      id: 'test-id',
      review: {
        id: 'review-id',
        rating: 5,
        comment: 'Great service!'
      }
    };

    const result = normalizeBooking(booking);
    expect(result.review?.id).toBe('review-id');
    expect(result.review?.rating).toBe(5);
    expect(result.review?.comment).toBe('Great service!');
  });
});

describe('normalizeBookings', () => {
  it('should handle empty array', () => {
    const result = normalizeBookings([]);
    expect(result).toEqual([]);
  });

  it('should handle non-array input', () => {
    const result = normalizeBookings(null as any);
    expect(result).toEqual([]);
  });

  it('should normalize array of bookings', () => {
    const bookings = [
      { id: 'booking1', status: 'PENDING' },
      { id: 'booking2', status: 'CONFIRMED' }
    ];

    const result = normalizeBookings(bookings);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('booking1');
    expect(result[1].id).toBe('booking2');
  });

  it('should filter out invalid bookings', () => {
    const bookings = [
      { id: 'booking1', status: 'PENDING' },
      null,
      { id: 'booking2', status: 'CONFIRMED' },
      undefined
    ];

    const result = normalizeBookings(bookings);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('booking1');
    expect(result[1].id).toBe('booking2');
  });
});

describe('isValidBooking', () => {
  it('should return false for null/undefined', () => {
    expect(isValidBooking(null)).toBe(false);
    expect(isValidBooking(undefined)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isValidBooking('string')).toBe(false);
    expect(isValidBooking(42)).toBe(false);
  });

  it('should return false for incomplete bookings', () => {
    expect(isValidBooking({})).toBe(false);
    expect(isValidBooking({ id: 'test' })).toBe(false);
  });

  it('should return true for valid bookings', () => {
    const validBooking = {
      id: 'test-id',
      status: 'PENDING',
      service: { name: 'Test Service' },
      client: { name: 'Test Client' },
      provider: { user: { name: 'Test Provider' } }
    };

    expect(isValidBooking(validBooking)).toBe(true);
  });
});

describe('safeBooking', () => {
  it('should return null for invalid bookings', () => {
    expect(safeBooking(null)).toBe(null);
    expect(safeBooking({})).toBe(null);
  });

  it('should return normalized booking for valid input', () => {
    const validBooking = {
      id: 'test-id',
      status: 'PENDING',
      service: { name: 'Test Service' },
      client: { name: 'Test Client' },
      provider: { user: { name: 'Test Provider' } }
    };

    const result = safeBooking(validBooking);
    expect(result).not.toBe(null);
    expect(result?.id).toBe('test-id');
  });
});

describe('Integration with validation', () => {
  it('should validate normalized bookings', () => {
    const bookings = [
      { id: 'booking1', status: 'PENDING' },
      { id: 'booking2', status: 'CONFIRMED' }
    ];

    const normalized = normalizeBookings(bookings);
    const validated = safeValidateBookings(normalized);
    
    expect(validated).toHaveLength(2);
    expect(validated[0].id).toBe('booking1');
    expect(validated[1].id).toBe('booking2');
  });

  it('should filter out invalid normalized bookings', () => {
    const bookings = [
      { id: 'booking1', status: 'PENDING' },
      { id: '', status: 'CONFIRMED' }, // Invalid: empty id
      { id: 'booking3', status: 'CONFIRMED' }
    ];

    const normalized = normalizeBookings(bookings);
    const validated = safeValidateBookings(normalized);
    
    // Should filter out the booking with empty id
    expect(validated).toHaveLength(2);
    expect(validated[0].id).toBe('booking1');
    expect(validated[1].id).toBe('booking3');
  });
});
