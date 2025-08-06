import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await prisma.provider.findUnique({
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