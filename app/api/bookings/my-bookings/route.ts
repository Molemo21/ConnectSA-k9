import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await db.booking.findMany({
      where: { clientId: user.id },
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' }, // Order by creation date (most recent first)
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 