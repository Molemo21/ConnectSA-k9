import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookingSchema = z.object({
  serviceId: z.string().regex(/^[a-z0-9]{25}$/i, "Service ID must be 25 alphanumeric characters"),
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

    // Find available providers for the service
    const providers = await prisma.provider.findMany({
      where: {
        services: {
          some: { serviceId: validated.serviceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        bookings: {
          where: {
            scheduledDate: {
              gte: new Date(`${validated.date}T00:00:00`),
              lt: new Date(`${validated.date}T23:59:59`),
            },
            status: {
              notIn: ["CANCELLED"],
            },
          },
        },
      },
    });

    // Find the first available provider (not double-booked)
    let assignedProvider = null;
    for (const provider of providers) {
      if (provider.bookings.length === 0) {
        assignedProvider = provider;
        break;
      }
    }

    // If no provider is available, return an error
    if (!assignedProvider) {
      console.log(`No providers available for service ${validated.serviceId} on ${validated.date}`);
      console.log(`Found ${providers.length} providers, but all are busy`);
      return NextResponse.json({ 
        error: "No providers are currently available for this service. Please try again later or contact support." 
      }, { status: 400 });
    }

    // Create booking with assigned provider
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        providerId: assignedProvider.id,
        serviceId: validated.serviceId,
        scheduledDate: new Date(`${validated.date}T${validated.time}`),
        duration: 2, // default duration, can be adjusted
        totalAmount: 0, // to be set after provider acceptance/payment
        platformFee: 0,
        description: validated.notes || null,
        address: validated.address,
        status: "PENDING",
      },
    });

    console.log(`Booking created successfully: ${booking.id} with provider ${assignedProvider.id}`);

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