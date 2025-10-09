import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { BookingService } from '@/lib/services/booking-service';
import { db } from '@/lib/db-utils';
import { createSADateTime } from '@/lib/date-utils';
import { SERVICES } from '@/config/services';

// Mock the database
jest.mock('@/lib/db-utils', () => ({
  db: {
    provider: {
      findMany: jest.fn()
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    service: {
      findUnique: jest.fn()
    }
  }
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logBooking: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAvailableProviders', () => {
    const mockParams = {
      serviceId: 'service_123',
      date: '2025-10-10',
      time: '10:00',
      address: '123 Test St'
    };

    it('should validate cleaning service before finding providers', async () => {
      // Mock service validation
      (db.service.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockParams.serviceId,
        name: SERVICES[0].name,
        category: 'CLEANING',
        isActive: true
      });

      // Mock providers query
      (db.provider.findMany as jest.Mock).mockResolvedValueOnce([]);

      await BookingService.findAvailableProviders(mockParams);

      // Verify service was validated
      expect(db.service.findUnique).toHaveBeenCalledWith({
        where: { id: mockParams.serviceId },
        select: expect.any(Object)
      });
    });

    it('should throw error for non-cleaning services', async () => {
      // Mock non-cleaning service
      (db.service.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockParams.serviceId,
        name: 'Non-cleaning Service',
        category: 'OTHER',
        isActive: true
      });

      await expect(
        BookingService.findAvailableProviders(mockParams)
      ).rejects.toThrow('Only cleaning services are available');
    });
  });

  describe('createBooking', () => {
    const mockParams = {
      userId: 'user_123',
      serviceId: 'service_123',
      date: '2025-10-10',
      time: '10:00',
      address: '123 Test St',
      notes: 'Test notes'
    };

    it('should create booking for valid cleaning service', async () => {
      // Mock service validation
      (db.service.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockParams.serviceId,
        name: SERVICES[0].name,
        category: 'CLEANING',
        isActive: true
      });

      // Mock booking creation
      const mockBooking = {
        id: 'booking_123',
        ...mockParams,
        scheduledDate: createSADateTime(mockParams.date, mockParams.time),
        status: 'PENDING',
        totalAmount: 0,
        service: SERVICES[0],
        client: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '1234567890'
        }
      };
      (db.booking.create as jest.Mock).mockResolvedValueOnce(mockBooking);

      const result = await BookingService.createBooking(mockParams);

      // Verify booking was created
      expect(db.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clientId: mockParams.userId,
          serviceId: mockParams.serviceId,
          address: mockParams.address,
          notes: mockParams.notes,
          status: 'PENDING',
          totalAmount: 0
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(mockBooking);
    });

    it('should throw error for inactive services', async () => {
      // Mock inactive service
      (db.service.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockParams.serviceId,
        name: SERVICES[0].name,
        category: 'CLEANING',
        isActive: false
      });

      await expect(
        BookingService.createBooking(mockParams)
      ).rejects.toThrow('Service is not active');
    });
  });

  describe('getBookingDetails', () => {
    const mockBookingId = 'booking_123';
    const mockUserId = 'user_123';

    it('should return booking details for authorized client', async () => {
      const mockBooking = {
        id: mockBookingId,
        client: { id: mockUserId, name: 'Test Client', email: 'client@test.com' },
        provider: null,
        service: SERVICES[0],
        payment: null,
        review: null
      };

      (db.booking.findUnique as jest.Mock).mockResolvedValueOnce(mockBooking);

      const result = await BookingService.getBookingDetails(mockBookingId, mockUserId);
      expect(result).toEqual(mockBooking);
    });

    it('should throw error for unauthorized access', async () => {
      const mockBooking = {
        id: mockBookingId,
        client: { id: 'other_user', name: 'Other Client', email: 'other@test.com' },
        provider: { user: { id: 'other_provider' } },
        service: SERVICES[0],
        payment: null,
        review: null
      };

      (db.booking.findUnique as jest.Mock).mockResolvedValueOnce(mockBooking);

      await expect(
        BookingService.getBookingDetails(mockBookingId, mockUserId)
      ).rejects.toThrow('Unauthorized access to booking');
    });
  });
});
