import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { useCataloguePricing, useCataloguePricingForProvider } from '@/lib/feature-flags';

const createCatalogueItemSchema = z.object({
  serviceId: z.string().cuid(),
  title: z.string().min(1).max(100),
  shortDesc: z.string().min(10).max(200),
  longDesc: z.string().max(1000).optional(),
  price: z.number().min(1).max(100000),
  currency: z.string().default('ZAR'),
  durationMins: z.number().min(15).max(480), // 15 mins to 8 hours
  images: z.array(z.string().url()).max(10).optional()
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
        isActive: true
      },
      include: {
        service: true
      }
    });

    return NextResponse.json(catalogueItem);
  } catch (error) {
    console.error('Failed to create catalogue item:', error);
    return NextResponse.json(
      { error: 'Failed to create catalogue item' }, 
      { status: 500 }
    );
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
    console.error('Failed to fetch catalogue items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalogue items' }, 
      { status: 500 }
    );
  }
}


