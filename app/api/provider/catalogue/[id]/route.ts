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
  featuredImageIndex: z.number().int().min(0).optional(), // Index of featured image (0-based)
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

    // Validate featuredImageIndex if provided
    let featuredImageIndex = validated.featuredImageIndex;
    if (featuredImageIndex !== undefined && validated.images) {
      if (featuredImageIndex < 0 || featuredImageIndex >= validated.images.length) {
        featuredImageIndex = 0; // Reset to first image if invalid
      }
    } else if (featuredImageIndex === undefined && validated.images && validated.images.length > 0) {
      // If images are updated but featuredImageIndex not provided, keep existing or default to 0
      featuredImageIndex = catalogueItem.featuredImageIndex ?? 0;
    }

    // Prepare update data
    const updateData: any = { ...validated };
    if (featuredImageIndex !== undefined) {
      updateData.featuredImageIndex = featuredImageIndex;
    }

    // Update catalogue item
    const updatedItem = await prisma.catalogueItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        service: true
      }
    });

    console.log('✅ Catalogue item updated successfully:', updatedItem.id);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('❌ Failed to update catalogue item:', error);
    
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', error.errors);
      const errorDetails = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return NextResponse.json({
        error: 'Validation failed',
        message: 'Please check the form fields and try again',
        details: errorDetails
      }, { status: 400 });
    }

    // Handle Prisma/database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string; meta?: any; message?: string };
      console.error('❌ Database error:', {
        code: prismaError.code,
        message: prismaError.message
      });
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json({
          error: 'Not found',
          message: 'Catalogue item not found or you do not have permission to update it'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        error: 'Database error',
        message: 'Failed to update catalogue item. Please try again.'
      }, { status: 500 });
    }

    // Generic error handling
    return NextResponse.json({
      error: 'Failed to update catalogue item',
      message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
    }, { status: 500 });
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

    console.log('✅ Catalogue item deleted successfully:', params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Failed to delete catalogue item:', error);
    
    // Handle Prisma/database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string; message?: string };
      console.error('❌ Database error:', {
        code: prismaError.code,
        message: prismaError.message
      });
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json({
          error: 'Not found',
          message: 'Catalogue item not found or you do not have permission to delete it'
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({
      error: 'Failed to delete catalogue item',
      message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
    }, { status: 500 });
  }
}


