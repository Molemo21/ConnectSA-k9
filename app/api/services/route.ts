export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db-utils";

export async function GET() {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Only return services that have at least one approved provider
    const services = await db.service.findMany({
      where: { 
        isActive: true,
        providers: {
          some: {
            provider: {
              status: "APPROVED",
              available: true
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        _count: {
          select: {
            providers: {
              where: {
                provider: {
                  status: "APPROVED",
                  available: true
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Filter out services with zero providers (double-check)
    const servicesWithProviders = services.filter(service => service._count.providers > 0);

    // Remove the _count field from the response
    const cleanServices = servicesWithProviders.map(service => ({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
    }));

    console.log(`📊 Returning ${cleanServices.length} services with providers (filtered from ${services.length} total active services)`);

    return NextResponse.json(cleanServices);
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
} 