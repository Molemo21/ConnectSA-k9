export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db-utils";

export async function GET() {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    // Temporary fix: Map invalid service IDs to proper UUIDs
    const mappedServices = services.map(service => {
      let mappedId = service.id;
      
      // Map the known invalid IDs to proper UUIDs
      if (service.id === 'haircut-service') {
        mappedId = '123e4567-e89b-12d3-a456-426614174000';
      } else if (service.id === 'garden-service') {
        mappedId = '987fcdeb-51a2-43d1-9f12-345678901234';
      }
      
      return {
        ...service,
        id: mappedId
      };
    });

    return NextResponse.json(mappedServices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
} 