import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { useCataloguePricing } from '@/lib/feature-flags';

const updateCatalogueItemSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  shortDesc: z.string().min(10).max(200).optional(),
  longDesc: z.string().max(1000).optional(),
  price: z.number().min(1).max(100000).optional(),
  currency: z.string().optional(),
  durationMins: z.number().min(15).max(480).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  isActive: z.boolean().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if catalogue pricing is enabled
    if (!useCataloguePricing()) {
      return NextResponse.json({ 
        error: 'Catalogue pricing is not enabled' 
      }, { status: 503 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateCatalogueItemSchema.parse(body);

    // Get provider
    const provider = await prisma.provider.findUnique({
      where: { userId: user.id }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Verify catalogue item belongs to provider
    const catalogueItem = await prisma.catalogueItem.findFirst({
      where: {
        id: params.id,
        providerId: provider.id
      }
    });

    if (!catalogueItem) {
      return NextResponse.json({ error: 'Catalogue item not found' }, { status: 404 });
    }

    // Update catalogue item
    const updatedItem = await prisma.catalogueItem.update({
      where: { id: params.id },
      data: validated,
      include: {
        service: true
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Failed to update catalogue item:', error);
    return NextResponse.json(
      { error: 'Failed to update catalogue item' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if catalogue pricing is enabled
    if (!useCataloguePricing()) {
      return NextResponse.json({ 
        error: 'Catalogue pricing is not enabled' 
      }, { status: 503 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: user.id }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Verify catalogue item belongs to provider
    const catalogueItem = await prisma.catalogueItem.findFirst({
      where: {
        id: params.id,
        providerId: provider.id
      }
    });

    if (!catalogueItem) {
      return NextResponse.json({ error: 'Catalogue item not found' }, { status: 404 });
    }

    // Check if item has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        catalogueItemId: params.id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      }
    });

    if (activeBookings > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete catalogue item with active bookings' 
      }, { status: 400 });
    }

    // Delete catalogue item
    await prisma.catalogueItem.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete catalogue item:', error);
    return NextResponse.json(
      { error: 'Failed to delete catalogue item' }, 
      { status: 500 }
    );
  }
}


