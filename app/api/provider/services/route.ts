import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

/**
 * GET /api/provider/services
 * Get only the services that the current provider has selected during onboarding
 */
export async function GET() {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log("🔍 Fetching provider's selected services...");

    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get provider with their selected services
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                basePrice: true,
                categoryId: true,
                isActive: true,
                category: {
                  select: {
                    name: true,
                    icon: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Extract only the services that the provider has selected and format them
    const selectedServices = provider.services
      .filter(ps => ps.service.isActive) // Only include active services
      .map(ps => ({
        id: ps.service.id,
        name: ps.service.name,
        description: ps.service.description,
        basePrice: ps.service.basePrice,
        categoryId: ps.service.categoryId,
        categoryName: ps.service.category.name,
        categoryIcon: ps.service.category.icon,
        isActive: ps.service.isActive
      }));

    console.log(`✅ Found ${selectedServices.length} selected services for provider ${provider.id}`);

    return NextResponse.json(selectedServices);

  } catch (error) {
    console.error("❌ Error fetching provider services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { db } from "@/lib/db-utils";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

/**
 * GET /api/provider/services
 * Get only the services that the current provider has selected during onboarding
 */
export async function GET() {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log("🔍 Fetching provider's selected services...");

    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get provider with their selected services
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                basePrice: true,
                categoryId: true,
                isActive: true,
                category: {
                  select: {
                    name: true,
                    icon: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Extract only the services that the provider has selected and format them
    const selectedServices = provider.services
      .filter(ps => ps.service.isActive) // Only include active services
      .map(ps => ({
        id: ps.service.id,
        name: ps.service.name,
        description: ps.service.description,
        basePrice: ps.service.basePrice,
        categoryId: ps.service.categoryId,
        categoryName: ps.service.category.name,
        categoryIcon: ps.service.category.icon,
        isActive: ps.service.isActive
      }));

    console.log(`✅ Found ${selectedServices.length} selected services for provider ${provider.id}`);

    return NextResponse.json(selectedServices);

  } catch (error) {
    console.error("❌ Error fetching provider services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
