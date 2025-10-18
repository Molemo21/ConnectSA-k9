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

    // Get all active categories with their services
    const categories = await db.serviceCategory.findMany({
      where: {
        isActive: true
      },
      include: {
        services: {
          where: {
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // If no categories exist, create the default cleaning category for backward compatibility
    if (categories.length === 0) {
      const defaultCategory = await db.serviceCategory.create({
        data: {
          name: 'Cleaning Services',
          description: 'Professional cleaning services for homes and offices',
          icon: '🧹',
          isActive: true
        }
      });

      // Return the default category with empty services
      const response = {
        id: defaultCategory.id,
        name: defaultCategory.name,
        description: defaultCategory.description,
        icon: defaultCategory.icon,
        isActive: defaultCategory.isActive,
        services: []
      };

      logService.info('fetch', `Created default cleaning category with 0 services`);
      return NextResponse.json([response]);
    }

    // Transform the response for all categories
    const response = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive,
      services: category.services.map(service => ({
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
    }));

    const totalServices = categories.reduce((sum, cat) => sum + cat.services.length, 0);
    logService.info('fetch', `Successfully fetched ${categories.length} categories with ${totalServices} total services`);
    return NextResponse.json(response);

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