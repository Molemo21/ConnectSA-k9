import { db } from "@/lib/db-utils";
import { validateCleaningService } from "@/app/api/book-service/validation";
import { createSADateTime } from "@/lib/date-utils";
import { BookingStatus } from "@prisma/client";
import { logBooking } from "@/lib/logger";

interface CreateBookingParams {
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  address: string;
  notes?: string;
}

interface FindProvidersParams {
  serviceId: string;
  date: string;
  time: string;
  address: string;
}

export class BookingService {
  /**
   * Find available providers for a cleaning service
   */
  static async findAvailableProviders({
    serviceId,
    date,
    time,
    address
  }: FindProvidersParams) {
    // Validate service first
    await validateCleaningService(serviceId);

    // Find providers that offer this service and are available
    const providers = await db.provider.findMany({
      where: {
        services: {
          some: { serviceId }
        },
        available: true,
        status: "APPROVED"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        services: {
          where: { serviceId },
          include: {
            service: {
              select: {
                name: true,
                description: true,
                category: true
              }
            }
          }
        },
        reviews: {
          include: {
            booking: {
              include: {
                client: {
                  select: { name: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        bookings: {
          where: {
            scheduledDate: {
              gte: new Date(`${date}T00:00:00`),
              lt: new Date(`${date}T23:59:59`)
            },
            status: {
              notIn: ["CANCELLED"]
            }
          }
        },
        _count: {
          select: {
            reviews: true,
            bookings: {
              where: { status: "COMPLETED" }
            }
          }
        }
      }
    });

    return providers;
  }

  /**
   * Create a new booking for a cleaning service
   */
  static async createBooking({
    userId,
    serviceId,
    date,
    time,
    address,
    notes
  }: CreateBookingParams) {
    // Validate service
    const service = await validateCleaningService(serviceId);

    // Create date object in SA timezone
    const scheduledDate = createSADateTime(date, time);

    try {
      // Create the booking
      const booking = await db.booking.create({
        data: {
          clientId: userId,
          serviceId,
          scheduledDate,
          address,
          notes,
          status: "PENDING" as BookingStatus,
          totalAmount: 0, // Will be set when provider accepts
        },
        include: {
          service: true,
          client: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      logBooking.success('create', 'Booking created successfully', {
        bookingId: booking.id,
        userId,
        serviceId,
        scheduledDate: date,
        scheduledTime: time
      });

      return booking;
    } catch (error) {
      logBooking.error('create', 'Failed to create booking', error as Error, {
        userId,
        serviceId,
        scheduledDate: date,
        scheduledTime: time,
        error_code: 'DB_ERROR'
      });
      throw error;
    }
  }

  /**
   * Get booking details
   */
  static async getBookingDetails(bookingId: string, userId: string) {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify access
    const isClient = booking.client.id === userId;
    const isProvider = booking.provider?.user.id === userId;

    if (!isClient && !isProvider) {
      throw new Error('Unauthorized access to booking');
    }

    return booking;
  }
}
