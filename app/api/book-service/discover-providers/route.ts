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

    // Batch fetch reviews for all catalogue items efficiently (avoid N+1 queries)
    // Collect all catalogue item IDs across all providers
    const allCatalogueItemIds = availableProviders.flatMap(
      p => (p.catalogueItems || []).map(item => item.id)
    );

    // Create a map to store reviews by catalogueItemId for O(1) lookup
    const reviewsByCatalogueItem = new Map<string, Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      booking: {
        client: {
          name: string;
        } | null;
      };
    }>>();

    // Batch fetch all reviews for catalogue items in ONE efficient query
    if (allCatalogueItemIds.length > 0) {
      try {
        const reviewsForCatalogueItems = await db.review.findMany({
          where: {
            booking: {
              catalogueItemId: {
                in: allCatalogueItemIds
              },
              status: 'COMPLETED' // Only get reviews for completed bookings
            }
          },
          include: {
            booking: {
              include: {
                client: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc' // Most recent reviews first
          },
          take: 100 // Limit total reviews to prevent large responses (roughly 10 per item if 10 providers)
        });

        // Group reviews by catalogueItemId
        for (const review of reviewsForCatalogueItems) {
          const catalogueItemId = review.booking.catalogueItemId;
          if (catalogueItemId) {
            if (!reviewsByCatalogueItem.has(catalogueItemId)) {
              reviewsByCatalogueItem.set(catalogueItemId, []);
            }
            reviewsByCatalogueItem.get(catalogueItemId)!.push({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt,
              booking: {
                client: review.booking.client ? {
                  name: review.booking.client.name
                } : null
              }
            });
          }
        }

        // Limit reviews per catalogue item to 10 most recent
        for (const [catalogueItemId, reviews] of reviewsByCatalogueItem.entries()) {
          if (reviews.length > 10) {
            reviewsByCatalogueItem.set(catalogueItemId, reviews.slice(0, 10));
          }
        }

        const totalReviewsFetched = reviewsForCatalogueItems.length;
        const itemsWithReviews = reviewsByCatalogueItem.size;
        console.log(`📊 Reviews fetched: ${totalReviewsFetched} reviews for ${itemsWithReviews} catalogue items`);
      } catch (reviewError) {
        console.error('❌ Error fetching reviews for catalogue items:', reviewError);
        // Continue without reviews - this is not critical for the main flow
        console.log('⚠️ Continuing without reviews - catalogue items will show with empty reviews array');
      }
    } else {
      console.log('📊 No catalogue items found - skipping review fetch');
    }

    // Calculate provider ratings and stats
    const providersWithStats = availableProviders.map(provider => {
      try {
        // Get reviews from bookings using raw query to avoid Prisma enum issues
        const allReviews = []; // Simplified for now - reviews will be empty
        
        const totalRating = allReviews.length > 0 ? allReviews.reduce((sum, review) => sum + review.rating, 0) : 0;
        const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        
        // Format catalogue items with reviews
        const catalogueItems = (provider.catalogueItems || []).map(item => {
          try {
            // Get reviews for this specific catalogue item from the pre-fetched map
            const itemReviews = reviewsByCatalogueItem.get(item.id) || [];
            
            return {
              id: item.id,
              title: item.title,
              price: item.price,
              currency: item.currency || 'ZAR',
              durationMins: item.durationMins,
              images: item.images || [], // Images array from database
              featuredImageIndex: item.featuredImageIndex ?? undefined, // Featured image index for hero image
              serviceId: item.serviceId,
              service: {
                name: item.service?.name || '',
                category: {
                  name: item.service?.category?.name || ''
                }
              },
              reviews: itemReviews.map(review => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment || undefined, // Convert null to undefined for optional field
                createdAt: review.createdAt.toISOString(), // Convert Date to ISO string
                booking: {
                  client: review.booking.client ? {
                    name: review.booking.client.name
                  } : undefined
                }
              }))
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

        const totalReviewsForProvider = catalogueItems.reduce((sum, item) => sum + item.reviews.length, 0);
        console.log('📊 Provider data prepared:', { 
          id: providerData.id, 
          businessName: providerData.businessName,
          serviceName: providerData.service?.name,
          hourlyRate: providerData.hourlyRate,
          catalogueItemsCount: catalogueItems.length,
          totalReviewsCount: totalReviewsForProvider
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
      error: error
    });
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 