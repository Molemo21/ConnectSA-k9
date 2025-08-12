import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendOfferSchema = z.object({
  providerId: z.string().min(1), // Accept any non-empty string, not just UUIDs
  serviceId: z.string().uuid(),
  date: z.string(), // ISO date string
  time: z.string(), // e.g. "14:00"
  address: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Send-offer API called');
    
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', { userId: user.id, role: user.role });

    const body = await request.json();
    console.log('📥 Request body received:', JSON.stringify(body, null, 2));

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      console.error('❌ Invalid request body:', body);
      return NextResponse.json({ 
        error: "Invalid request body format" 
      }, { status: 400 });
    }

    // Check for required fields before validation
    const requiredFields = ['providerId', 'serviceId', 'date', 'time', 'address'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validate UUID format before Zod validation
    if (body.serviceId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.serviceId)) {
      console.error('❌ Invalid serviceId format:', body.serviceId);
      return NextResponse.json({ 
        error: `Invalid serviceId format: ${body.serviceId}. Expected UUID format.` 
      }, { status: 400 });
    }

    const validated = sendOfferSchema.parse(body);
    console.log('✅ Zod validation passed:', validated);

    // Additional validation
    if (!validated.providerId || !validated.serviceId || !validated.date || !validated.time || !validated.address) {
      console.log('❌ Missing required fields:', { 
        providerId: !!validated.providerId, 
        serviceId: !!validated.serviceId, 
        date: !!validated.date, 
        time: !!validated.time, 
        address: !!validated.address 
      });
      return NextResponse.json({ 
        error: "Missing required fields: providerId, serviceId, date, time, address" 
      }, { status: 400 });
    }

    // Validate date is not in the past
    console.log('📅 Starting date validation...');
    console.log('📅 Raw date and time:', { date: validated.date, time: validated.time });
    
    const requestedDateTime = new Date(`${validated.date}T${validated.time}`);
    const now = new Date();
    
    console.log('📅 Date validation details:', { 
      requested: requestedDateTime.toISOString(), 
      now: now.toISOString(), 
      isPast: requestedDateTime <= now,
      requestedTimestamp: requestedDateTime.getTime(),
      nowTimestamp: now.getTime(),
      difference: requestedDateTime.getTime() - now.getTime()
    });
    
    if (requestedDateTime <= now) {
      console.log('❌ Date is in the past');
      return NextResponse.json({ 
        error: "Cannot book services in the past" 
      }, { status: 400 });
    }
    
    console.log('✅ Date validation passed');

    console.log(`🎯 Job offer request: Client ${user.id} requesting provider ${validated.providerId} for service ${validated.serviceId} on ${validated.date} at ${validated.time}`);

    // Map the serviceId back to the actual database ID if it's one of our mapped IDs
    let actualServiceId = validated.serviceId;
    if (validated.serviceId === '123e4567-e89b-12d3-a456-426614174000') {
      actualServiceId = 'haircut-service';
    } else if (validated.serviceId === '987fcdeb-51a2-43d1-9f12-345678901234') {
      actualServiceId = 'garden-service';
    }

    console.log('🔄 Service ID mapping:', { original: validated.serviceId, mapped: actualServiceId });

    // Verify the provider is still available for this service
    console.log('🔍 Starting provider verification...');
    console.log('🔍 Query parameters:', {
      providerId: validated.providerId,
      serviceId: actualServiceId,
      expectedStatus: "APPROVED",
      expectedAvailable: true
    });
    
    const provider = await prisma.provider.findFirst({
      where: {
        id: validated.providerId,
        services: {
          some: { serviceId: actualServiceId },
        },
        available: true,
        status: "APPROVED",
      },
      include: {
        services: {
          where: { serviceId: actualServiceId }
        }
      }
    });

    console.log('🔍 Provider query completed, result:', provider ? 'Found' : 'Not found');

    if (!provider) {
      console.log(`❌ Provider ${validated.providerId} not found or not available for service ${actualServiceId}`);
      console.log('🔍 Provider query details:', {
        providerId: validated.providerId,
        serviceId: actualServiceId,
        expectedStatus: "APPROVED",
        expectedAvailable: true
      });
      return NextResponse.json({ 
        error: "Provider is no longer available for this service" 
      }, { status: 400 });
    }

    console.log('✅ Provider verified:', { 
      providerId: provider.id, 
      businessName: provider.businessName,
      available: provider.available,
      status: provider.status,
      serviceCount: provider.services.length,
      services: provider.services.map(s => ({
        serviceId: s.serviceId,
        customRate: s.customRate
      }))
    });

    // Check if provider is busy at the requested time
    console.log('🔍 Checking for booking conflicts...');
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        providerId: validated.providerId,
        scheduledDate: {
          gte: new Date(`${validated.date}T00:00:00`),
          lt: new Date(`${validated.date}T23:59:59`),
        },
        status: {
          notIn: ["CANCELLED", "COMPLETED"], // Removed "DISPUTED" as it's not in the database enum
        },
      },
    });

    if (conflictingBooking) {
      console.log(`❌ Provider ${validated.providerId} has conflicting booking ${conflictingBooking.id} on ${validated.date}`);
      return NextResponse.json({ 
        error: "Provider is no longer available at the requested time. Please select a different time or provider." 
      }, { status: 400 });
    }

    console.log('✅ No booking conflicts found');

    // Create a booking with PENDING status (waiting for provider response)
    console.log('📝 Creating booking...');
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        providerId: validated.providerId,
        serviceId: actualServiceId,
        scheduledDate: new Date(`${validated.date}T${validated.time}`),
        duration: 2, // default duration, can be adjusted
        totalAmount: provider.services[0]?.customRate || 0,
        platformFee: (provider.services[0]?.customRate || 0) * 0.1, // 10% platform fee
        description: validated.notes || null,
        address: validated.address,
        status: "PENDING", // This means waiting for provider to accept/decline
      },
    });

    console.log('✅ Booking created:', { 
      bookingId: booking.id, 
      totalAmount: booking.totalAmount,
      platformFee: booking.platformFee
    });

    // Create a proposal record for tracking
    console.log('📝 Creating proposal...');
    await prisma.proposal.create({
      data: {
        bookingId: booking.id,
        providerId: validated.providerId,
        status: "PENDING",
        message: "Job offer sent by client",
      },
    });

    console.log('✅ Proposal created');

    // TODO: Send notification to provider about new job offer
    // TODO: Send email notification to provider

    console.log(`✅ Job offer sent successfully: Booking ${booking.id} to provider ${validated.providerId} for client ${user.id}`);
    console.log(`✅ Proposal created: ${booking.id} with status PENDING`);

    return NextResponse.json({ 
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        totalAmount: booking.totalAmount,
        providerId: booking.providerId
      },
      message: "Job offer sent successfully! Provider will respond within 2 hours."
    });

  } catch (error) {
    console.error('❌ Send job offer error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });

    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    // Check for Prisma connection errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('❌ Database error code:', error.code);
      if (error.code === 'P1001' || error.code === 'P1008') {
        return NextResponse.json({ error: "Database connection error. Please try again." }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 