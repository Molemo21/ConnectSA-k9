import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string(), // ISO date string
  time: z.string(), // e.g. "14:00"
  address: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = bookingSchema.parse(body);

    // Find available provider for the service (simple: first available, not double-booked)
    const providers = await prisma.provider.findMany({
      where: {
        services: {
          some: { serviceId: validated.serviceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        bookings: true,
      },
    });

    // Check for provider availability (not double-booked at the same date/time)
    let assignedProvider = null;
    for (const provider of providers) {
      const hasConflict = provider.bookings.some(
        (b) =>
          b.scheduledDate.toISOString().slice(0, 10) === validated.date &&
          b.status !== "CANCELLED"
      );
      if (!hasConflict) {
        assignedProvider = provider;
        break;
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        providerId: assignedProvider ? assignedProvider.id : null,
        serviceId: validated.serviceId,
        scheduledDate: new Date(`${validated.date}T${validated.time}`),
        duration: 2, // default duration, can be adjusted
        totalAmount: 0, // to be set after provider acceptance/payment
        platformFee: 0,
        description: validated.notes || null,
        address: validated.address,
        status: assignedProvider ? "PENDING" : "WAITING_FOR_PROVIDER",
      },
    });

    // TODO: Send notifications to provider and client (in-app/email)

    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 