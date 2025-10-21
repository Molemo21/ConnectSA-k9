import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { useCataloguePricing } from '@/lib/feature-flags';

const discoverCatalogueSchema = z.object({
  serviceId: z.string().cuid().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  durationMin: z.number().min(15).optional(),
  durationMax: z.number().min(15).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0)
});

export async function GET(request: NextRequest) {
  try {
    // Check if catalogue pricing is enabled
    if (!useCataloguePricing()) {
      return NextResponse.json({ 
        error: 'Catalogue pricing is not enabled' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const params = {
      serviceId: searchParams.get('serviceId') || undefined,
      priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
      priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
      durationMin: searchParams.get('durationMin') ? Number(searchParams.get('durationMin')) : undefined,
      durationMax: searchParams.get('durationMax') ? Number(searchParams.get('durationMax')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0
    };

    const validated = discoverCatalogueSchema.parse(params);

    // Build where clause
    const where: any = {
      isActive: true,
      provider: {
        status: 'APPROVED',
        available: true
      }
    };

    if (validated.serviceId) {
      where.serviceId = validated.serviceId;
    }

    if (validated.priceMin !== undefined || validated.priceMax !== undefined) {
      where.price = {};
      if (validated.priceMin !== undefined) where.price.gte = validated.priceMin;
      if (validated.priceMax !== undefined) where.price.lte = validated.priceMax;
    }

    if (validated.durationMin !== undefined || validated.durationMax !== undefined) {
      where.durationMins = {};
      if (validated.durationMin !== undefined) where.durationMins.gte = validated.durationMin;
      if (validated.durationMax !== undefined) where.durationMins.lte = validated.durationMax;
    }

    const [catalogueItems, totalCount] = await Promise.all([
      prisma.catalogueItem.findMany({
        where,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  avatar: true
                }
              },
              reviews: {
                select: {
                  rating: true
                }
              }
            }
          },
          service: {
            select: {
              name: true,
              description: true
            }
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: 'COMPLETED'
                }
              }
            }
          }
        },
        orderBy: [
          { price: 'asc' },
          { createdAt: 'desc' }
        ],
        take: validated.limit,
        skip: validated.offset
      }),
      prisma.catalogueItem.count({ where })
    ]);

    // Calculate average ratings for providers
    const itemsWithRatings = catalogueItems.map(item => {
      const ratings = item.provider.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        ...item,
        provider: {
          ...item.provider,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: ratings.length
        }
      };
    });

    return NextResponse.json({
      items: itemsWithRatings,
      pagination: {
        total: totalCount,
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < totalCount
      }
    });
  } catch (error) {
    console.error('Failed to discover catalogue items:', error);
    return NextResponse.json(
      { error: 'Failed to discover catalogue items' }, 
      { status: 500 }
    );
  }
}


