import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";
import { z } from "zod";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'




const sendOfferSchema = z.object({
  providerId: z.string().min(1), // Accept any non-empty string, not just UUIDs
  serviceId: z.string()
    .min(1, "Service ID is required")
    .regex(/^([a-z0-9]{25}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, "Invalid serviceId format. Expected CUID (25 chars) or UUID (36 chars) format."),
  date: z.string(), // ISO date string
  time: z.string(), // e.g. "14:00"
  address: z.string().min(1),
  notes: z.string().optional(),
  // Timezone context from client (optional for backward compatibility)
  timezone: z.string().optional(),
  timezoneOffsetMinutes: z.number().optional(),
});

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log('🚀 Send-offer API called - Updated Schema Version');
    
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', { userId: user.id, role: user.role });

    const body = await request.json();
    console.log('📥 Request body received:', JSON.stringify(body, null, 2));

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      console.error('❌ Invalid request body:', body);
      return NextResponse.json({ 
        error: "Invalid request body format" 
      }, { status: 400 });
    }

    // Check for required fields before validation
    const requiredFields = ['providerId', 'serviceId', 'date', 'time', 'address'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    const validated = sendOfferSchema.parse(body);
    console.log('✅ Zod validation passed:', validated);

    // Additional validation
    if (!validated.providerId || !validated.serviceId || !validated.date || !validated.time || !validated.address) {
      console.log('❌ Missing required fields:', { 
        providerId: !!validated.providerId, 
        serviceId: !!validated.serviceId, 
        date: !!validated.date, 
        time: !!validated.time, 
        address: !!validated.address 
      });
      return NextResponse.json({ 
        error: "Missing required fields: providerId, serviceId, date, time, address" 
      }, { status: 400 });
    }

    // Validate date is not in the past
    console.log('📅 Starting date validation...');
    console.log('📅 Raw date and time:', { date: validated.date, time: validated.time });
    
    // Parse date and time with client timezone offset when provided
    // getTimezoneOffset() returns negative values for timezones ahead of UTC (e.g., -120 for SAST UTC+2)
    // To convert local time to UTC: UTC = Local + offset (since offset is negative, adding it subtracts time)
    let requestedDateTime: Date;
    try {
      const [y, m, d] = validated.date.split('-').map((n) => parseInt(n, 10));
      const [hh, mm] = validated.time.split(':').map((n) => parseInt(n, 10));
      const offset = typeof (body as any).timezoneOffsetMinutes === 'number' ? (body as any).timezoneOffsetMinutes : undefined;
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && !isNaN(hh) && !isNaN(mm) && typeof offset === 'number') {
        // Fix: use + instead of - because offset is already negative for timezones ahead of UTC
        const utcMillis = Date.UTC(y, (m - 1), d, hh, mm) + (offset * 60000);
        requestedDateTime = new Date(utcMillis);
      } else {
        // Fallback: Assume South African timezone (UTC+2) if no offset provided
        // This ensures consistent behavior even if client doesn't send timezone info
        const saOffsetMinutes = -120; // SAST is UTC+2, so offset is -120 minutes
        const utcMillis = Date.UTC(y, (m - 1), d, hh, mm) + (saOffsetMinutes * 60000);
        requestedDateTime = new Date(utcMillis);
      }
    } catch {
      // Last resort fallback to naive parsing (not ideal but prevents crashes)
      requestedDateTime = new Date(`${validated.date}T${validated.time}`);
    }
    
    const now = new Date();
    
    console.log('📅 Date validation details:', { 
      requested: requestedDateTime.toISOString(), 
      now: now.toISOString(), 
      isPast: requestedDateTime <= now,
      requestedTimestamp: requestedDateTime.getTime(),
      nowTimestamp: now.getTime(),
      difference: requestedDateTime.getTime() - now.getTime(),
      timezoneOffset: (body as any).timezoneOffsetMinutes
    });
    
    if (requestedDateTime <= now) {
      console.log('❌ Date is in the past');
      return NextResponse.json({ 
        error: "Cannot book services in the past" 
      }, { status: 400 });
    }
    
    console.log('✅ Date validation passed');

    console.log(`🎯 Job offer request: Client ${user.id} requesting provider ${validated.providerId} for service ${validated.serviceId} on ${validated.date} at ${validated.time}`);

    // Use the serviceId directly (it's already the correct Prisma ID format)
    const actualServiceId = validated.serviceId;
    console.log('🔄 Using service ID directly:', actualServiceId);

    // Verify the provider is still available for this service
    console.log('🔍 Starting provider verification...');
    console.log('🔍 Query parameters:', {
      providerId: validated.providerId,
      serviceId: actualServiceId,
      expectedStatus: "APPROVED",
      expectedAvailable: true
    });
    
    const provider = await db.provider.findFirst({
      where: {
        id: validated.providerId,
        services: {
          some: { serviceId: actualServiceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        services: {
          where: { serviceId: actualServiceId }
        }
      }
    });

    console.log('🔍 Provider query completed, result:', provider ? 'Found' : 'Not found');

    if (!provider) {
      console.log(`❌ Provider ${validated.providerId} not found or not available for service ${actualServiceId}`);
      console.log('🔍 Provider query details:', {
        providerId: validated.providerId,
        serviceId: actualServiceId,
        expectedStatus: "APPROVED",
        expectedAvailable: true
      });
      return NextResponse.json({ 
        error: "Provider is no longer available for this service" 
      }, { status: 400 });
    }

    console.log('✅ Provider verified:', { 
      providerId: provider.id, 
      businessName: provider.businessName,
      available: provider.available,
      status: provider.status,
      serviceCount: provider.services.length,
      services: provider.services.map(s => ({
        serviceId: s.serviceId
      }))
    });

    // Check if provider is busy at the requested time
    console.log('🔍 Checking for booking conflicts...');
    
    // Parse the requested time (reuse existing requestedDateTime from above)
    const requestedTime = validated.time;
    const [requestedHour, requestedMinute] = requestedTime.split(':').map(Number);
    
    // Check for time-specific conflicts (within 2 hours of requested time)
    const conflictStart = new Date(requestedDateTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const conflictEnd = new Date(requestedDateTime.getTime() + 2 * 60 * 60 * 1000);   // 2 hours after
    
    console.log('🔍 Conflict check details:', {
      requestedTime: requestedTime,
      requestedDateTime: requestedDateTime.toISOString(),
      conflictStart: conflictStart.toISOString(),
      conflictEnd: conflictEnd.toISOString(),
      timeWindow: '4 hours (2 hours before and after)'
    });
    
    const conflictingBooking = await db.booking.findFirst({
      where: {
        providerId: validated.providerId,
        scheduledDate: {
          gte: conflictStart,
          lte: conflictEnd,
        },
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    });

    if (conflictingBooking) {
      console.log(`❌ Provider ${validated.providerId} has conflicting booking ${conflictingBooking.id}`);
      console.log('🔍 Conflict details:', {
        conflictingTime: conflictingBooking.scheduledDate.toISOString(),
        requestedTime: requestedDateTime.toISOString(),
        timeDifference: Math.abs(conflictingBooking.scheduledDate.getTime() - requestedDateTime.getTime()) / (1000 * 60 * 60) + ' hours'
      });
      
      // Find alternative available times for the same provider
      console.log('🔍 Looking for alternative times...');
      const alternativeTimes = await findAlternativeTimes(validated.providerId, validated.date, validated.serviceId);
      
      return NextResponse.json({ 
        error: "Provider has a conflicting booking at this time. Please select a different time or provider.",
        details: {
          conflictingTime: conflictingBooking.scheduledDate.toISOString(),
          requestedTime: requestedDateTime.toISOString(),
          alternativeTimes: alternativeTimes
        }
      }, { status: 400 });
    }

    console.log('✅ No booking conflicts found');

    // Calculate proper pricing for the booking
    let totalAmount = 0;
    let platformFee = 0;
    const duration = 2; // Default duration in hours

    // Get provider's custom rate for this service
    const providerService = await db.providerService.findFirst({
      where: {
        providerId: validated.providerId,
        serviceId: actualServiceId
      },
      include: {
        service: true
      }
    });

    if (providerService?.customRate) {
      totalAmount = providerService.customRate * duration;
    } else if (provider.hourlyRate) {
      totalAmount = provider.hourlyRate * duration;
    } else if (providerService?.service?.basePrice) {
      totalAmount = providerService.service.basePrice * duration;
    } else {
      // Fallback to default pricing
      totalAmount = 150 * duration; // R150 per hour default
    }

    // Calculate platform fee (10% of total amount)
    platformFee = totalAmount * 0.1;

    // Validate that we have a valid amount
    if (totalAmount <= 0) {
      return NextResponse.json({ 
        error: "Unable to determine service pricing. Please contact support.",
        details: "The provider or service does not have proper pricing configured."
      }, { status: 400 });
    }

    // Create a booking with PENDING status (waiting for provider response)
    console.log('📝 Creating booking with calculated pricing...', {
      totalAmount,
      platformFee,
      duration,
      providerId: validated.providerId,
      serviceId: actualServiceId
    });
    
    const booking = await db.booking.create({
      data: {
        clientId: user.id,
        providerId: validated.providerId,
        serviceId: actualServiceId,
        scheduledDate: requestedDateTime,
        duration,
        totalAmount,
        platformFee,
        description: validated.notes || null,
        address: validated.address,
        status: "PENDING", // This means waiting for provider to accept/decline
      },
    });

    console.log('✅ Booking created:', { 
      bookingId: booking.id, 
      totalAmount: booking.totalAmount,
      platformFee: booking.platformFee,
      duration: booking.duration,
      status: booking.status
    });

    // Note: Proposal creation removed - table doesn't exist in database
    console.log('ℹ️ Skipping proposal creation (table not available)');

    // Create notifications for both client and provider
    // Note: Notification system temporarily disabled - model not available in database
    try {
      console.log('ℹ️ Skipping notification creation (Notification model not available)');
      // TODO: Re-enable when Notification model is added to database
      /*
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
          service: { 
            select: { 
              name: true, 
              category: { select: { name: true } }
            } 
          }
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

        console.log(`🔔 Notifications sent: Provider ${fullBooking.provider.user.email}, Client ${fullBooking.client.email}`);
      }
      */
    } catch (notificationError) {
      console.error('❌ Failed to create booking notifications:', notificationError);
      // Don't fail the request if notification fails
    }

    console.log(`✅ Job offer sent successfully: Booking ${booking.id} to provider ${validated.providerId} for client ${user.id}`);
    console.log(`✅ Booking created with status PENDING`);

    return NextResponse.json({ 
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        totalAmount: booking.totalAmount,
        providerId: booking.providerId
      },
      message: "Job offer sent successfully! Provider will respond within 2 hours."
    });

  } catch (error) {
    console.error('❌ Send job offer error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });

    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    // Check for Prisma connection errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('❌ Database error code:', error.code);
      if (error.code === 'P1001' || error.code === 'P1008') {
        return NextResponse.json({ error: "Database connection error. Please try again." }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to find alternative available times
async function findAlternativeTimes(providerId: string, date: string, serviceId: string) {
  try {
    console.log('🔍 Finding alternative times for provider:', providerId, 'on date:', date);
    
    // Get all bookings for this provider on this date
    const existingBookings = await db.booking.findMany({
      where: {
        providerId: providerId,
        scheduledDate: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
      select: {
        scheduledDate: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    console.log('📅 Existing bookings:', existingBookings.map(b => b.scheduledDate.toISOString()));

    // Define business hours (9 AM to 10 PM for flexibility)
    const businessHours = {
      start: 9,  // 9 AM
      end: 22,   // 10 PM (extended for evening services)
    };

    // Generate available time slots
    const availableSlots = [];
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 60) { // Every hour
        const timeSlot = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        
        // Check if this time slot conflicts with existing bookings
        const hasConflict = existingBookings.some(booking => {
          const timeDiff = Math.abs(booking.scheduledDate.getTime() - timeSlot.getTime());
          return timeDiff < 2 * 60 * 60 * 1000; // 2 hours buffer
        });

        if (!hasConflict && timeSlot > new Date()) {
          availableSlots.push({
            time: timeSlot.toTimeString().slice(0, 5), // HH:MM format
            available: true,
          });
        }
      }
    }

    console.log('✅ Available time slots:', availableSlots);
    return availableSlots.slice(0, 5); // Return up to 5 alternatives

  } catch (error) {
    console.error('❌ Error finding alternative times:', error);
    return [];
  }
} 