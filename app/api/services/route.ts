import { NextResponse } from "next/server";
import { db } from "@/lib/db-utils";
import { logService } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: "Service temporarily unavailable during deployment" }, { status: 503 });
    }

    // Get all active services with their categories
    const services = await db.service.findMany({
      where: {
        isActive: true,
        category: {
          isActive: true
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the data to match the expected format
    const transformedServices = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      basePrice: service.basePrice,
      categoryId: service.categoryId,
      categoryName: service.category.name,
      categoryIcon: service.category.icon,
      isActive: service.isActive
    }));

    logService.info('fetch', `Successfully fetched ${services.length} services`);
    return NextResponse.json(transformedServices);
  } catch (error) {
    logService.error('fetch', 'Failed to fetch services', error as Error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}