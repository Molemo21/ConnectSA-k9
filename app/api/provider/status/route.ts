import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET() {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Ensure Prisma connection before any database operations
    try {
      const { prisma } = await import('@/lib/prisma');
      if (typeof (prisma as any).connect === 'function') {
        await (prisma as any).connect();
      } else {
        await prisma.$connect();
      }
    } catch (connectError) {
      const errorMessage = connectError instanceof Error ? connectError.message : String(connectError);
      if (!errorMessage.includes('already connected') && !errorMessage.includes('already been connected')) {
        console.warn('⚠️ Prisma connection check failed in provider status route:', errorMessage);
      }
    }
    
    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await db.provider.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        businessName: true,
      }
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Get provider status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 