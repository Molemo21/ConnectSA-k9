import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { useCataloguePricing, useCataloguePricingForProvider } from '@/lib/feature-flags';

// UUID regex pattern (matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// CUID regex pattern (matches CUID format - starts with 'c' followed by 24+ alphanumeric characters)
const cuidRegex = /^c[0-9a-z]{24,}$/i;

const createCatalogueItemSchema = z.object({
  serviceId: z.string()
    .min(1, "Service ID is required")
    .refine(
      (val) => uuidRegex.test(val) || cuidRegex.test(val),
      "Service ID must be a valid UUID or CUID format"
    ),
  title: z.string().min(1).max(100),
  shortDesc: z.string().min(10).max(200),
  longDesc: z.string().max(1000).optional(),
  price: z.number().min(1).max(100000),
  currency: z.string().default('ZAR'),
  durationMins: z.number().min(15).max(480), // 15 mins to 8 hours
  images: z.array(z.string().url()).max(10).optional(),
  featuredImageIndex: z.number().int().min(0).optional() // Index of featured image (0-based)
});

export async function POST(request: NextRequest) {
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
    console.log('📦 Received catalogue item creation request:', {
      userId: user.id,
      userEmail: user.email,
      bodyKeys: Object.keys(body),
      bodyData: {
        serviceId: body.serviceId,
        title: body.title,
        shortDesc: body.shortDesc,
        shortDescLength: body.shortDesc?.length || 0,
        price: body.price,
        priceType: typeof body.price,
        durationMins: body.durationMins,
        durationType: typeof body.durationMins,
        currency: body.currency,
        images: body.images
      }
    });

    const validated = createCatalogueItemSchema.parse(body);

    // Get provider
    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
      include: { services: true }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    if (provider.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Provider must be approved to create catalogue items' 
      }, { status: 403 });
    }

    // Verify provider offers this service
    const hasService = provider.services.some(ps => ps.serviceId === validated.serviceId);
    if (!hasService) {
      return NextResponse.json({ 
        error: 'Provider does not offer this service' 
      }, { status: 400 });
    }

    // Validate featuredImageIndex if provided
    let featuredImageIndex = validated.featuredImageIndex;
    if (featuredImageIndex !== undefined && validated.images) {
      if (featuredImageIndex < 0 || featuredImageIndex >= validated.images.length) {
        featuredImageIndex = 0; // Reset to first image if invalid
      }
    } else if (featuredImageIndex === undefined && validated.images && validated.images.length > 0) {
      featuredImageIndex = 0; // Default to first image
    }

    // Create catalogue item
    const catalogueItem = await prisma.catalogueItem.create({
      data: {
        providerId: provider.id,
        serviceId: validated.serviceId,
        title: validated.title,
        shortDesc: validated.shortDesc,
        longDesc: validated.longDesc,
        price: validated.price,
        currency: validated.currency,
        durationMins: validated.durationMins,
        images: validated.images || [],
        featuredImageIndex: featuredImageIndex ?? null,
        isActive: true
      },
      include: {
        service: true
      }
    });

    console.log('✅ Catalogue item created successfully:', catalogueItem.id);
    return NextResponse.json(catalogueItem);
  } catch (error) {
    console.error('❌ Failed to create catalogue item:', error);
    
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
        message: prismaError.message,
        meta: prismaError.meta
      });
      
      // Handle specific Prisma error codes
      if (prismaError.code === 'P2002') {
        return NextResponse.json({
          error: 'Duplicate entry',
          message: 'A catalogue item with these details already exists'
        }, { status: 409 });
      }
      
      if (prismaError.code === 'P2003') {
        return NextResponse.json({
          error: 'Invalid reference',
          message: 'The selected service or provider is invalid'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Database error',
        message: 'Failed to create catalogue item. Please try again.'
      }, { status: 500 });
    }

    // Handle other known error types
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Check for specific error messages
      if (error.message.includes('Catalogue pricing is not enabled')) {
        return NextResponse.json({
          error: 'Feature not available',
          message: 'Catalogue pricing is not enabled. Please contact support.'
        }, { status: 503 });
      }
    }

    // Generic error handling
    return NextResponse.json({
      error: 'Failed to create catalogue item',
      message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    const catalogueItems = await prisma.catalogueItem.findMany({
      where: { providerId: provider.id },
      include: {
        service: true,
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(catalogueItems);
  } catch (error) {
    console.error('❌ Failed to fetch catalogue items:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
    }
    
    return NextResponse.json({
      error: 'Failed to fetch catalogue items',
      message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
    }, { status: 500 });
  }
}


