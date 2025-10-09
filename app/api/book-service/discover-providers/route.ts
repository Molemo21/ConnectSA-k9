import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-utils";
import { z } from "zod";

export const dynamic = 'force-dynamic'


const discoverProvidersSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
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
    // Provider discovery should be accessible without authentication
    // Users need to discover providers before they can book
    
    const body = await request.json();
    
    // Log the incoming request for debugging
    console.log('Discover providers request body:', JSON.stringify(body, null, 2));
    
    // Validate serviceId format (accept both CUID and UUID formats) before Zod validation
    if (body.serviceId) {
      const cuidRegex = /^[a-z0-9]{25}$/i;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!cuidRegex.test(body.serviceId) && !uuidRegex.test(body.serviceId)) {
        console.error('Invalid serviceId format received:', body.serviceId);
        return NextResponse.json({ 
          error: `Invalid serviceId format: ${body.serviceId}. Expected CUID (25 chars) or UUID (36 chars) format.` 
        }, { status: 400 });
      }
    }

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
    const providers = await db.provider.findMany({
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
            phone: true,
            avatar: true,
          }
        },
        services: {
          where: { serviceId: actualServiceId },
          include: {
            service: {
              select: {
                name: true,
                description: true,
                category: true,
              }
            }
          }
        },
        reviews: {
          include: {
            booking: {
              include: {
                client: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 reviews
        },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: {
            id: true,
            scheduledDate: true,
            status: true,
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
      },
    });

    // Filter out providers who are busy on the requested date/time
    const availableProviders = providers.filter(provider => {
      // Check if provider has any conflicting bookings
      const hasConflict = provider.bookings?.some(booking => {
        const bookingDate = new Date(booking.scheduledDate);
        const requestedDate = new Date(`${validated.date}T${validated.time}`);
        
        // Check if dates overlap (same day and within 2 hours)
        const sameDay = bookingDate.toDateString() === requestedDate.toDateString();
        const timeDiff = Math.abs(bookingDate.getTime() - requestedDate.getTime());
        const within2Hours = timeDiff <= 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        // Check for active bookings that would conflict
        const isActiveBooking = !["CANCELLED", "COMPLETED"].includes(booking.status); // Removed "DISPUTED" as it's not in the database enum
        
        return sameDay && within2Hours && isActiveBooking;
      });

      return !hasConflict;
    });

    // Calculate provider ratings and stats
    const providersWithStats = availableProviders.map(provider => {
      const totalRating = provider.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = provider.reviews.length > 0 ? totalRating / provider.reviews.length : 0;
      
      const providerData = {
        id: provider.id,
        businessName: provider.businessName,
        description: provider.description,
        experience: provider.experience,
        location: provider.location,
        hourlyRate: provider.services[0]?.customRate || 0,
        user: provider.user,
        service: provider.services[0]?.service,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: provider._count.reviews,
        completedJobs: provider._count.bookings,
        recentReviews: provider.reviews.slice(0, 3), // Show only 3 recent reviews
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
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Provider discovery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 