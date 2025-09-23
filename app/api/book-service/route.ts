import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { z } from "zod";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";
import { logBooking } from "@/lib/logger";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'




const bookingSchema = z.object({
  serviceId: z.string().regex(/^[a-z0-9]{25}$/i, "Service ID must be 25 alphanumeric characters"),
  date: z.string(), // ISO date string
  time: z.string(), // e.g. "14:00"
  address: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      logBooking.error('create', 'Unauthorized booking attempt', new Error('Unauthorized'), {
        userId: user?.id,
        userRole: user?.role,
        error_code: 'UNAUTHORIZED'
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = bookingSchema.parse(body);

    logBooking.success('create', 'Booking creation started', {
      userId: user.id,
      serviceId: validated.serviceId,
      scheduledDate: validated.date,
      scheduledTime: validated.time,
      metadata: { address: validated.address, notes: validated.notes }
    });

    // Find available providers for the service
    const providers = await db.provider.findMany({
      where: {
        services: {
          some: { serviceId: validated.serviceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        bookings: {
          where: {
            scheduledDate: {
              gte: new Date(`${validated.date}T00:00:00`),
              lt: new Date(`${validated.date}T23:59:59`),
            },
            status: {
              notIn: ["CANCELLED"],
            },
          },
        },
      },
    });

    // Find the first available provider (not double-booked)
    let assignedProvider = null;
    for (const provider of providers) {
      if (provider.bookings.length === 0) {
        assignedProvider = provider;
        break;
      }
    }

    // If no provider is available, return an error
    if (!assignedProvider) {
      logBooking.error('create', 'No providers available for booking', new Error('No available providers'), {
        userId: user.id,
        serviceId: validated.serviceId,
        scheduledDate: validated.date,
        error_code: 'NO_PROVIDERS_AVAILABLE',
        metadata: { 
          totalProviders: providers.length,
          availableProviders: providers.filter(p => p.available).length,
          approvedProviders: providers.filter(p => p.status === 'APPROVED').length
        }
      });
      return NextResponse.json({ 
        error: "No providers are currently available for this service. Please try again later or contact support." 
      }, { status: 400 });
    }

    // Create booking with assigned provider
    const booking = await db.booking.create({
      data: {
        clientId: user.id,
        providerId: assignedProvider.id,
        serviceId: validated.serviceId,
        scheduledDate: new Date(`${validated.date}T${validated.time}`),
        duration: 2, // default duration, can be adjusted
        totalAmount: 0, // to be set after provider acceptance/payment
        platformFee: 0,
        description: validated.notes || null,
        address: validated.address,
        status: "PENDING",
      },
    });

    logBooking.success('create', 'Booking created successfully', {
      userId: user.id,
      bookingId: booking.id,
      providerId: assignedProvider.id,
      serviceId: validated.serviceId,
      metadata: {
        scheduledDate: booking.scheduledDate.toISOString(),
        duration: booking.duration,
        address: booking.address
      }
    });

    // Create notifications for both client and provider
    try {
      // Get the full booking data with relations for notifications
      const fullBooking = await db.booking.findUnique({
        where: { id: booking.id },
        include: {
          client: { select: { id: true, name: true, email: true } },
          provider: { 
            include: { 
              user: { select: { id: true, name: true, email: true } }
            }
          },
          service: { select: { name: true, category: true } }
        }
      });

      if (fullBooking) {
        // Notify provider about new booking
        const providerNotification = NotificationTemplates.BOOKING_CREATED(fullBooking);
        await createNotification({
          userId: fullBooking.provider.user.id,
          type: providerNotification.type,
          title: providerNotification.title,
          content: providerNotification.content
        });

        // Notify client about booking creation
        await createNotification({
          userId: fullBooking.client.id,
          type: 'BOOKING_CREATED',
          title: 'Booking Request Sent',
          content: `Your booking request for ${fullBooking.service?.name || 'service'} has been sent to ${fullBooking.provider?.businessName || 'the provider'}. You'll be notified when they respond.`
        });

        logBooking.success('create', 'Booking notifications sent successfully', {
          userId: user.id,
          bookingId: booking.id,
          providerId: assignedProvider.id,
          metadata: {
            providerEmail: fullBooking.provider.user.email,
            clientEmail: fullBooking.client.email,
            notificationType: 'BOOKING_CREATED'
          }
        });
      }
    } catch (notificationError) {
      logBooking.error('create', 'Failed to create booking notifications', notificationError as Error, {
        userId: user.id,
        bookingId: booking.id,
        providerId: assignedProvider.id,
        error_code: 'NOTIFICATION_FAILED',
        metadata: { notificationError: (notificationError as Error).message }
      });
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logBooking.error('create', 'Invalid booking input validation', error, {
        userId: user?.id,
        error_code: 'VALIDATION_ERROR',
        metadata: { validationErrors: error.errors }
      });
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    
    logBooking.error('create', 'Unexpected booking creation error', error as Error, {
      userId: user?.id,
      error_code: 'INTERNAL_ERROR',
      metadata: { errorMessage: (error as Error).message }
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 