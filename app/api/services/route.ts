import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
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