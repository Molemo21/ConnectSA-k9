import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Import the configured Prisma client
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'


const discoverProvidersSchema = z.object({
  serviceId: z.string()
    .min(1, "Service ID is required")
    .regex(/^([a-z0-9]{25}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, "Invalid serviceId format. Expected CUID (25 chars) or UUID (36 chars) format."),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  address: z.string().min(1, "Address is required"),
});

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Validate that PENDING_EXECUTION enum exists in the database
    try {
      const enumCheck = await prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumlabel = 'PENDING_EXECUTION' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      `;
      
      if (enumCheck.length === 0) {
        console.error('❌ PENDING_EXECUTION enum not found in database');
        return NextResponse.json({
          error: "Database schema issue: PENDING_EXECUTION enum missing",
          details: "Please contact support to update the database schema"
        }, { status: 500 });
      }
      
      console.log('✅ PENDING_EXECUTION enum validation passed');
    } catch (enumError) {
      console.error('❌ Enum validation failed:', enumError);
      return NextResponse.json({
        error: "Database schema validation failed",
        details: enumError instanceof Error ? enumError.message : 'Unknown error'
      }, { status: 500 });
    }
    // Provider discovery should be accessible without authentication
    // Users need to discover providers before they can book
    
    const body = await request.json();
    
    // Log the incoming request for debugging
    console.log('Discover providers request body:', JSON.stringify(body, null, 2));
    
    const validated = discoverProvidersSchema.parse(body);
    
    console.log('Validated request:', {
      serviceId: validated.serviceId,
      date: validated.date,
      time: validated.time,
      address: validated.address
    });

    // Use the serviceId directly (it's already the correct Prisma ID format)
    const actualServiceId = validated.serviceId;
    console.log('Using service ID:', actualServiceId);

    // Find available providers for the service
    const providers = await prisma.provider.findMany({
      where: {
        services: {
          some: { serviceId: actualServiceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        services: {
          where: { serviceId: actualServiceId },
          include: {
            service: {
              select: {
                name: true,
                description: true,
                basePrice: true,
              }
            }
          }
        },
        // Note: Removed bookings query to avoid Prisma enum validation issues
        // Availability will be checked separately using a raw query
        _count: {
          select: {
            bookings: {
              where: { status: "COMPLETED" }
            }
          }
        }
      },
    });

    // Filter out providers who are busy on the requested date/time
    // Use raw query to avoid Prisma enum validation issues
    const availableProviders = [];
    
    for (const provider of providers) {
      try {
        // Check for conflicting bookings using raw query
        const conflictingBookings = await prisma.$queryRaw`
          SELECT id, "scheduledDate", status 
          FROM "Booking" 
          WHERE "providerId" = ${provider.id}
          AND status NOT IN ('CANCELLED', 'COMPLETED')
          AND DATE("scheduledDate") = DATE(${validated.date}T${validated.time}::timestamp)
          AND ABS(EXTRACT(EPOCH FROM ("scheduledDate" - ${validated.date}T${validated.time}::timestamp))) <= 7200
        `;
        
        // If no conflicting bookings, provider is available
        if (conflictingBookings.length === 0) {
          availableProviders.push(provider);
        }
      } catch (conflictError) {
        console.error(`Error checking conflicts for provider ${provider.id}:`, conflictError);
        // If we can't check conflicts, assume provider is available
        availableProviders.push(provider);
      }
    }

    // Calculate provider ratings and stats
    const providersWithStats = availableProviders.map(provider => {
      // Get reviews from bookings using raw query to avoid Prisma enum issues
      const allReviews = []; // Simplified for now - reviews will be empty
      
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
      
      const providerData = {
        id: provider.id,
        businessName: provider.businessName,
        status: provider.status,
        available: provider.available,
        location: provider.location,
        hourlyRate: provider.hourlyRate || 0,
        user: provider.user,
        service: provider.services[0]?.service,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: allReviews.length,
        completedJobs: provider._count.bookings,
        recentReviews: allReviews.slice(0, 3), // Show only 3 recent reviews
        isAvailable: true,
      };

      console.log('📊 Provider data prepared:', { 
        id: providerData.id, 
        businessName: providerData.businessName,
        serviceName: providerData.service?.name,
        hourlyRate: providerData.hourlyRate
      });

      return providerData;
    });

    // Sort by rating (highest first), then by completed jobs
    providersWithStats.sort((a, b) => {
      if (a.averageRating !== b.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.completedJobs - a.completedJobs;
    });

    if (providersWithStats.length === 0) {
      return NextResponse.json({ 
        error: "No providers are currently available for this service at the requested time. Please try a different time or contact support." 
      }, { status: 404 });
    }

    console.log(`Found ${providersWithStats.length} available providers for service ${validated.serviceId}`);

    return NextResponse.json({ 
      providers: providersWithStats,
      totalCount: providersWithStats.length,
      message: `Found ${providersWithStats.length} available providers for your service`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    
    console.error("Provider discovery error:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 