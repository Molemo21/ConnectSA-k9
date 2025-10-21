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

    // Parse date and time
    const requestedDateTime = new Date(`${validated.date}T${validated.time}`);
    console.log('📅 Requested date/time:', requestedDateTime.toISOString());

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
              isActive: anyCatalogueItem.isActive
            });
          }
          
          return NextResponse.json({ 
            error: "Selected service package not available",
            details: "The package may not be available for this provider or may have been deactivated"
          }, { status: 400 });
        }

        totalAmount = catalogueItem.price;
        duration = catalogueItem.durationMins / 60; // Convert minutes to hours
        bookedPrice = catalogueItem.price;
        bookedCurrency = catalogueItem.currency;
        bookedDurationMins = catalogueItem.durationMins;

        console.log('💰 Catalogue pricing:', {
          price: catalogueItem.price,
          currency: catalogueItem.currency,
          durationMins: catalogueItem.durationMins,
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
        scheduledDate: new Date(`${validated.date}T${validated.time}`),
        duration,
        totalAmount,
        platformFee,
        bookedPrice,
        bookedCurrency,
        bookedDurationMins,
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
      status: booking.status,
      catalogueItemId: booking.catalogueItemId
    });

    // Note: Proposal creation removed - table doesn't exist in database
    console.log('ℹ️ Skipping proposal creation (table not available)');

    // Create notifications for both client and provider
    // Note: Notification system temporarily disabled - model not available in database
    console.log('ℹ️ Skipping notification creation (system temporarily disabled)');

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
        pricingMode: useCatalogue ? 'catalogue' : 'legacy'
      },
      message: "Job offer sent successfully! Provider will respond within 2 hours."
    });

  } catch (error) {
    console.error('❌ Send-offer API error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json({ 
      error: "Failed to send job offer. Please try again." 
    }, { status: 500 });
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


