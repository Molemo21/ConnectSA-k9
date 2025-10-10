import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug send-offer API - Step by step execution');
    
    // Step 1: Authentication
    console.log('Step 1: Checking authentication...');
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('✅ Authentication passed:', { userId: user.id, role: user.role });
    
    // Step 2: Parse request body
    console.log('Step 2: Parsing request body...');
    const body = await request.json();
    console.log('✅ Request body parsed:', body);
    
    // Step 3: Validate required fields
    console.log('Step 3: Validating required fields...');
    const { providerId, serviceId, date, time, address } = body;
    if (!providerId || !serviceId || !date || !time || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    console.log('✅ Required fields validated');
    
    // Step 4: Check provider exists
    console.log('Step 4: Checking provider exists...');
    const provider = await db.provider.findFirst({
      where: { id: providerId },
      select: {
        id: true,
        businessName: true,
        status: true,
        available: true,
        hourlyRate: true
      }
    });
    
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 400 });
    }
    console.log('✅ Provider found:', provider);
    
    // Step 5: Check service exists
    console.log('Step 5: Checking service exists...');
    const service = await db.service.findFirst({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        categoryId: true,
        basePrice: true
      }
    });
    
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 400 });
    }
    console.log('✅ Service found:', service);
    
    // Step 6: Check provider-service relationship
    console.log('Step 6: Checking provider-service relationship...');
    const providerService = await db.providerService.findFirst({
      where: {
        providerId: providerId,
        serviceId: serviceId
      }
    });
    
    if (!providerService) {
      return NextResponse.json({ error: "Provider not available for this service" }, { status: 400 });
    }
    console.log('✅ Provider-service relationship found:', providerService);
    
    // Step 7: Try to create booking
    console.log('Step 7: Attempting to create booking...');
    const requestedDateTime = new Date(`${date}T${time}`);
    
    const booking = await db.booking.create({
      data: {
        clientId: user.id,
        providerId: providerId,
        serviceId: serviceId,
        scheduledDate: requestedDateTime,
        totalAmount: provider.hourlyRate || 0,
        status: "PENDING"
      }
    });
    
    console.log('✅ Booking created successfully:', booking);
    
    return NextResponse.json({
      success: true,
      booking: booking,
      debug: {
        user: { id: user.id, role: user.role },
        provider: provider,
        service: service,
        providerService: providerService,
        requestedDateTime: requestedDateTime.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Debug send-offer API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      details: error
    }, { status: 500 });
  }
}
