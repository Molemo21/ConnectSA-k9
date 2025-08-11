import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendOfferSchema = z.object({
  providerId: z.string().uuid(),
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
    const validated = sendOfferSchema.parse(body);

    // Verify the provider is still available for this service
    const provider = await prisma.provider.findFirst({
      where: {
        id: validated.providerId,
        services: {
          some: { serviceId: validated.serviceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        services: {
          where: { serviceId: validated.serviceId }
        }
      }
    });

    if (!provider) {
      return NextResponse.json({ 
        error: "Provider is no longer available for this service" 
      }, { status: 400 });
    }

    // Check if provider is busy at the requested time
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        providerId: validated.providerId,
        scheduledDate: {
          gte: new Date(`${validated.date}T00:00:00`),
          lt: new Date(`${validated.date}T23:59:59`),
        },
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
    });

    if (conflictingBooking) {
      return NextResponse.json({ 
        error: "Provider is no longer available at the requested time" 
      }, { status: 400 });
    }

    // Create a booking with PENDING status (waiting for provider response)
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        providerId: validated.providerId,
        serviceId: validated.serviceId,
        scheduledDate: new Date(`${validated.date}T${validated.time}`),
        duration: 2, // default duration, can be adjusted
        totalAmount: provider.services[0]?.customRate || 0,
        platformFee: (provider.services[0]?.customRate || 0) * 0.1, // 10% platform fee
        description: validated.notes || null,
        address: validated.address,
        status: "PENDING", // This means waiting for provider to accept/decline
      },
    });

    // Create a proposal record for tracking
    await prisma.proposal.create({
      data: {
        bookingId: booking.id,
        providerId: validated.providerId,
        status: "PENDING",
        message: "Job offer sent by client",
      },
    });

    // TODO: Send notification to provider about new job offer
    // TODO: Send email notification to provider

    console.log(`Job offer sent: ${booking.id} to provider ${validated.providerId}`);

    return NextResponse.json({ 
      success: true,
      booking,
      message: "Job offer sent successfully! Provider will respond within 2 hours."
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Send job offer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 