import { NextResponse } from 'next/server';
import { db } from '@/lib/db-utils';
import { ProviderStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const { id } = params;

  // Get the admin user from the request
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = await db.provider.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            createdAt: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        bookings: {
          include: {
            service: { select: { name: true } },
            client: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Calculate stats
    const stats = {
      totalBookings: provider.bookings?.length || 0,
      completedBookings: provider.bookings?.filter(b => b.status === 'COMPLETED').length || 0,
      totalEarnings: provider.payouts?.reduce((sum, p) => sum + p.amount, 0) || 0,
      averageRating: provider.reviews?.length > 0
        ? provider.reviews.reduce((sum, r) => sum + r.rating, 0) / provider.reviews.length
        : 0,
      totalReviews: provider.reviews?.length || 0
    }

    return NextResponse.json({
      ...provider,
      stats
    });
  } catch (error) {
    console.error('Error fetching provider details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const { id } = params;
  const { status, comment } = await request.json();

  if (!Object.values(ProviderStatus).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Get the admin user from the request
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Update provider status
    const updatedProvider = await db.provider.update({
      where: { id },
      data: { status },
    });

    // Create a ProviderReview record
    await db.providerReview.create({
      data: {
        providerId: id,
        adminId: admin.id,
        comment: comment || '',
        status,
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 