import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can review providers" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/review/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = reviewSchema.parse(body);

    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { 
        client: true,
        provider: true,
        review: true
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if user is the client for this booking
    if (booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if booking is completed
    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ error: "Can only review completed bookings" }, { status: 400 });
    }

    // Check if review already exists
    if (booking.review) {
      return NextResponse.json({ error: "Review already exists for this booking" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        bookingId: bookingId,
        providerId: booking.providerId,
        rating: validated.rating,
        comment: validated.comment,
      },
    });

    // TODO: Notify the provider (in-app/email)
    // TODO: Update average ratings for the provider

    return NextResponse.json({ 
      success: true, 
      review,
      message: "Review submitted successfully" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 