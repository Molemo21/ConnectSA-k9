import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Import the configured Prisma client
import { db } from '@/lib/db-utils';

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
    let providers;
    try {
      providers = await db.provider.findMany({
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
                basePrice: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        catalogueItems: {
          where: {
            serviceId: actualServiceId,
            isActive: true
          },
          include: {
            service: {
              select: {
                name: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            bookings: {
              where: { status: "COMPLETED" }
            }
          }
        }
      },
    });
      console.log(`✅ Found ${providers.length} providers from database query`);
    } catch (queryError) {
      console.error("❌ Database query error:", queryError);
      throw queryError;
    }

    // Filter out providers who are busy on the requested date/time
    // Use raw query to avoid Prisma enum validation issues
    const availableProviders = [];
    
    for (const provider of providers) {
      try {
        // Check for conflicting bookings using raw query
        const conflictingBookings = await db.$queryRaw`
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
      try {
        // Get reviews from bookings using raw query to avoid Prisma enum issues
        const allReviews = []; // Simplified for now - reviews will be empty
        
        const totalRating = allReviews.length > 0 ? allReviews.reduce((sum, review) => sum + review.rating, 0) : 0;
        const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        
        // Format catalogue items - reviews will be fetched separately if needed
        const catalogueItems = (provider.catalogueItems || []).map(item => {
          try {
            return {
              id: item.id,
              title: item.title,
              price: item.price,
              currency: item.currency || 'ZAR',
              durationMins: item.durationMins,
              images: item.images || [],
              serviceId: item.serviceId,
              service: {
                name: item.service?.name || '',
                category: {
                  name: item.service?.category?.name || ''
                }
              },
              reviews: [] // Reviews will be empty for now - can be enhanced later to fetch from bookings
            }
          } catch (itemError) {
            console.error(`Error formatting catalogue item ${item.id}:`, itemError)
            return null
          }
        }).filter((item): item is NonNullable<typeof item> => item !== null)

        const providerData = {
          id: provider.id,
          businessName: provider.businessName,
          description: provider.description || '',
          experience: provider.experience || 0,
          status: provider.status,
          available: provider.available,
          location: provider.location,
          hourlyRate: provider.hourlyRate || 0,
          user: provider.user,
          service: {
            name: provider.services[0]?.service?.name || '',
            description: provider.services[0]?.service?.description || '',
            category: provider.services[0]?.service?.category?.name || ''
          },
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: allReviews.length,
          completedJobs: provider._count?.bookings || 0,
          recentReviews: allReviews.slice(0, 3), // Show only 3 recent reviews
          isAvailable: true,
          catalogueItems: catalogueItems
        };

        console.log('📊 Provider data prepared:', { 
          id: providerData.id, 
          businessName: providerData.businessName,
          serviceName: providerData.service?.name,
          hourlyRate: providerData.hourlyRate,
          catalogueItemsCount: catalogueItems.length
        });

        return providerData;
      } catch (providerError) {
        console.error(`Error processing provider ${provider.id}:`, providerError);
        return null;
      }
    }).filter((provider): provider is NonNullable<typeof provider> => provider !== null);

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
      error: error,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 });
  }
} 