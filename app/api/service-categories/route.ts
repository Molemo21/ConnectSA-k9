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

    // First check if the cleaning category exists
    const cleaningCategory = await db.serviceCategory.findFirst({
      where: {
        name: 'Cleaning Services'
      }
    });

    // If it doesn't exist, create it
    const category = cleaningCategory || await db.serviceCategory.create({
      data: {
        name: 'Cleaning Services',
        description: 'Professional cleaning services for homes and offices',
        icon: '🧹',
        isActive: true
      }
    });

    // Get all active services for this category
    const services = await db.service.findMany({
      where: {
        categoryId: category.id,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the response
    const response = {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        features: [
          'Professional service',
          'Quality guarantee',
          'Satisfaction guaranteed',
          'Experienced staff'
        ],
        duration: 60 // Default duration in minutes
      }))
    };

    logService.info('fetch', `Successfully fetched cleaning category with ${services.length} services`);
    return NextResponse.json([response]); // Return as array for future category additions

  } catch (error) {
    // Log the detailed error
    logService.error('fetch', 'Failed to fetch service categories', error as Error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('PrismaClient')) {
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    // Return a generic error for other cases
    return NextResponse.json(
      { error: "Failed to fetch service categories" },
      { status: 500 }
    );
  }
}