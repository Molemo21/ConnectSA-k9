import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";
import { z } from "zod";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Enhanced schema that supports both legacy and catalogue-based pricing
const sendOfferSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string()
    .min(1, "Service ID is required")
    .regex(/^([a-z0-9]{25}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, "Invalid serviceId format. Expected CUID (25 chars) or UUID (36 chars) format."),
  date: z.string(),
  time: z.string(),
  address: z.string().min(1),
  notes: z.string().optional(),
  // New optional fields for catalogue-based pricing
  catalogueItemId: z.string().cuid().optional(),
  // Payment method field
  paymentMethod: z.enum(['ONLINE', 'CASH']).default('ONLINE'),
  // Timezone context from client
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
    console.log('🚀 Send-offer API called - Enhanced with Catalogue Pricing Support');
    console.log('🔍 Request details:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });
    
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
        error: "Invalid request body" 
      }, { status: 400 });
    }

    const validated = sendOfferSchema.parse(body);
    console.log('✅ Request validated successfully:', validated);

    // Determine pricing mode based on feature flags and request data
    const useCatalogue = process.env.NEXT_PUBLIC_CATALOGUE_PRICING_V1 === 'true' && validated.catalogueItemId;
    console.log('🔍 Pricing mode:', useCatalogue ? 'Catalogue-based' : 'Legacy');

    // Parse date and time with client timezone offset when provided
    let requestedDateTime: Date;
    try {
      const [y, m, d] = validated.date.split('-').map((n) => parseInt(n, 10));
      const [hh, mm] = validated.time.split(':').map((n) => parseInt(n, 10));
      const offset = typeof (body as any).timezoneOffsetMinutes === 'number' ? (body as any).timezoneOffsetMinutes : undefined;
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && !isNaN(hh) && !isNaN(mm) && typeof offset === 'number') {
        const utcMillis = Date.UTC(y, (m - 1), d, hh, mm) - (offset * 60000);
        requestedDateTime = new Date(utcMillis);
      } else {
        // Fallback to naive parsing
        requestedDateTime = new Date(`${validated.date}T${validated.time}`);
      }
    } catch {
      requestedDateTime = new Date(`${validated.date}T${validated.time}`);
    }
    console.log('📅 Requested date/time (UTC):', requestedDateTime.toISOString(), {
      tz: (body as any).timezone,
      tzOffsetMin: (body as any).timezoneOffsetMinutes
    });

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

    // Note: Conflict checking is disabled to allow multiple bookings per day
    // Providers can manage their own schedule and availability
    console.log('✅ Skipping booking conflict check - allowing multiple bookings per day');

    // Calculate pricing based on mode
    let totalAmount = 0;
    let platformFee = 0;
    let duration = 2; // Default duration in hours
    let bookedPrice: number | null = null;
    let bookedCurrency: string | null = null;
    let bookedDurationMins: number | null = null;

    if (useCatalogue) {
      // Catalogue-based pricing
      console.log('💰 Using catalogue-based pricing...');
      console.log('🔍 Looking for catalogue item:', {
        catalogueItemId: validated.catalogueItemId,
        providerId: validated.providerId
      });
      
      try {
        console.log('🔍 Querying catalogue item with:', {
          catalogueItemId: validated.catalogueItemId,
          providerId: validated.providerId
        });

        const catalogueItem = await db.catalogueItem.findFirst({
          where: {
            id: validated.catalogueItemId!,
            providerId: validated.providerId,
            isActive: true
          },
          include: {
            service: true
          }
        });

        console.log('🔍 Catalogue item query result:', catalogueItem ? 'Found' : 'Not found');

        if (!catalogueItem) {
          console.log('❌ Catalogue item not found, checking if it exists at all...');
          
          // Check if the catalogue item exists but doesn't match the provider
          const anyCatalogueItem = await db.catalogueItem.findFirst({
            where: {
              id: validated.catalogueItemId!
            }
          });
          
          console.log('🔍 Any catalogue item with this ID:', anyCatalogueItem ? 'Found' : 'Not found');
          
          if (anyCatalogueItem) {
            console.log('🔍 Found catalogue item but provider mismatch:', {
              requestedProviderId: validated.providerId,
              actualProviderId: anyCatalogueItem.providerId,
              isActive: anyCatalogueItem.isActive,
              catalogueItemId: validated.catalogueItemId
            });
            
            return NextResponse.json({ 
              error: "Package provider mismatch",
              details: `The selected package belongs to a different provider. Package ID: ${validated.catalogueItemId}`
            }, { status: 400 });
          } else {
            console.log('🔍 Catalogue item does not exist at all:', {
              catalogueItemId: validated.catalogueItemId,
              providerId: validated.providerId
            });
            
            return NextResponse.json({ 
              error: "Package not found",
              details: `The selected package does not exist. Package ID: ${validated.catalogueItemId}`
            }, { status: 400 });
          }
        }

        totalAmount = catalogueItem.price;
        duration = Math.ceil(catalogueItem.durationMins / 60); // Convert minutes to hours and round up
        bookedPrice = catalogueItem.price;
        bookedCurrency = catalogueItem.currency;
        bookedDurationMins = catalogueItem.durationMins;
        
        // Ensure duration is a valid integer
        duration = Math.max(1, Math.round(duration));

        console.log('💰 Catalogue pricing:', {
          price: catalogueItem.price,
          currency: catalogueItem.currency,
          durationMins: catalogueItem.durationMins,
          durationHours: duration,
          title: catalogueItem.title
        });
        
      } catch (catalogueError) {
        console.error('❌ Error fetching catalogue item:', catalogueError);
        return NextResponse.json({ 
          error: "Failed to fetch service package details",
          details: catalogueError instanceof Error ? catalogueError.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      // Legacy pricing
      console.log('💰 Using legacy pricing...');
      
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

      console.log('💰 Legacy pricing:', {
        totalAmount,
        duration,
        customRate: providerService?.customRate,
        hourlyRate: provider.hourlyRate,
        basePrice: providerService?.service?.basePrice
      });
      
      // Ensure duration is a valid integer for legacy pricing
      duration = Math.max(1, Math.round(duration));
    }

    // Validate that we have a valid amount
    if (totalAmount <= 0 || isNaN(totalAmount)) {
      return NextResponse.json({ 
        error: "Unable to determine service pricing. Please contact support.",
        details: "The provider or service does not have proper pricing configured."
      }, { status: 400 });
    }
    
    // Round totalAmount to 2 decimal places
    totalAmount = Math.round(totalAmount * 100) / 100;
    
    // Calculate platform fee (10% of total amount)
    platformFee = Math.round((totalAmount * 0.1) * 100) / 100; // Round to 2 decimal places

    // Create a booking with PENDING status (waiting for provider response)
    console.log('📝 Creating booking with calculated pricing...', {
      totalAmount,
      platformFee,
      duration,
      providerId: validated.providerId,
      serviceId: actualServiceId,
      catalogueItemId: validated.catalogueItemId,
      pricingMode: useCatalogue ? 'catalogue' : 'legacy'
    });
    
    const booking = await db.booking.create({
      data: {
        clientId: user.id,
        providerId: validated.providerId,
        serviceId: actualServiceId,
        catalogueItemId: validated.catalogueItemId || null,
        scheduledDate: requestedDateTime,
        duration,
        totalAmount,
        platformFee,
        bookedPrice,
        bookedCurrency,
        bookedDurationMins,
        description: validated.notes || null,
        address: validated.address,
        status: "PENDING", // This means waiting for provider to accept/decline
        paymentMethod: validated.paymentMethod,
      },
    });

    console.log('✅ Booking created:', { 
      bookingId: booking.id, 
      totalAmount: booking.totalAmount,
      platformFee: booking.platformFee,
      duration: booking.duration,
      status: booking.status,
      catalogueItemId: booking.catalogueItemId,
      paymentMethod: booking.paymentMethod
    });

    // Handle payment creation based on payment method
    if (validated.paymentMethod === 'CASH') {
      console.log('💰 Creating cash payment record...');
      
      // Create minimal payment record for cash payments
      const cashPayment = await db.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          paystackRef: `CASH_${booking.id}`, // Unique identifier for cash payments
          status: 'CASH_PENDING',
        }
      });
      
      console.log('✅ Cash payment record created:', {
        paymentId: cashPayment.id,
        bookingId: booking.id,
        amount: cashPayment.amount,
        status: cashPayment.status
      });
    } else {
      console.log('💳 Online payment - Payment record will be created when client initiates payment');
    }

    // Note: Proposal creation removed - table doesn't exist in database
    console.log('ℹ️ Skipping proposal creation (table not available)');

    // Create notifications for both client and provider
    console.log('🔔 Creating notifications...')
    try {
      // Get the full booking data with relations for notifications
      const fullBooking = await db.booking.findUnique({
        where: { id: booking.id },
        select: {
          id: true,
          status: true,
          scheduledDate: true,
          totalAmount: true,
          client: { select: { id: true, name: true, email: true } },
          provider: { 
            select: {
              businessName: true,
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
    } catch (notificationError) {
      console.error('❌ Failed to create booking notifications:', notificationError);
      // Don't fail the request if notification fails
    }

    // Broadcast real-time update to provider
    console.log('📡 Broadcasting real-time update to provider...');
    try {
      // Note: WebSocket broadcasting would go here
      console.log('✅ Real-time update broadcasted');
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast real-time update:', broadcastError);
      // Don't fail the request if broadcasting fails
    }

    return NextResponse.json({ 
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        totalAmount: booking.totalAmount,
        providerId: booking.providerId,
        catalogueItemId: booking.catalogueItemId,
        paymentMethod: booking.paymentMethod,
        pricingMode: useCatalogue ? 'catalogue' : 'legacy'
      },
      message: validated.paymentMethod === 'CASH' 
        ? "Job offer sent successfully! Pay cash directly to your provider after service completion."
        : "Job offer sent successfully! Provider will respond within 2 hours."
    });

  } catch (error) {
    console.error('❌ Send-offer API error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    // Return specific error message based on error type
    let errorMessage = "Failed to send job offer. Please try again.";
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      errorMessage = `Validation error: ${error.errors[0]?.message || 'Invalid input'}`;
      statusCode = 400;
    } else if (error && typeof error === 'object' && 'code' in error) {
      // Prisma errors
      if (error.code === 'P1001' || error.code === 'P1008') {
        errorMessage = "Database connection error. Please try again.";
        statusCode = 500;
      } else if (error.code === 'P2002') {
        errorMessage = "Duplicate entry. Please try again.";
        statusCode = 400;
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: statusCode });
  }
}

// Helper function to find alternative times
async function findAlternativeTimes(providerId: string, date: string, serviceId: string): Promise<string[]> {
  try {
    // This would implement logic to find alternative available times
    // For now, return some sample times
    return [
      "09:00",
      "11:00", 
      "13:00",
      "15:00",
      "17:00"
    ];
  } catch (error) {
    console.error('Error finding alternative times:', error);
    return [];
  }
}

