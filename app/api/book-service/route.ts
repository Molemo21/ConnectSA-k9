export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bookingSchema } from "./validation";
import { BookingService } from "@/lib/services/booking-service";
import { logBooking } from "@/lib/logger";

export async function POST(request: Request) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Verify user authentication
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      logBooking.error('create', 'Unauthorized booking attempt', new Error('Unauthorized'), {
        userId: user?.id,
        userRole: user?.role,
        error_code: 'UNAUTHORIZED'
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validated = bookingSchema.parse(body);

    try {
      // Create booking
      const booking = await BookingService.createBooking({
      userId: user.id,
      serviceId: validated.serviceId,
        date: validated.date,
        time: validated.time,
        address: validated.address,
        notes: validated.notes
      });

      // Find available providers
      const providers = await BookingService.findAvailableProviders({
        serviceId: validated.serviceId,
        date: validated.date,
        time: validated.time,
        address: validated.address
      });

      return NextResponse.json({ 
        booking,
        availableProviders: providers
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Service not found') {
          return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }
        if (error.message === 'Only cleaning services are available') {
          return NextResponse.json({ error: "Only cleaning services are available" }, { status: 400 });
        }
        if (error.message === 'Service is not active') {
          return NextResponse.json({ error: "Service is not currently available" }, { status: 400 });
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('Failed to create booking:', error);
    
    if (error instanceof Error) {
      logBooking.error('create', 'Booking creation failed', error, {
        error_code: 'UNKNOWN_ERROR',
        error_message: error.message
      });
    }

    return NextResponse.json(
      { error: "Failed to create booking" }, 
      { status: 500 }
    );
  }
} 