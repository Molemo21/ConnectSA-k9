import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-utils";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking production database schema...');
    
    // Check if service_categories table exists and has data
    const serviceCategories = await db.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        isActive: true
      }
    });
    
    // Check if services table has categoryId field
    const services = await db.service.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
        basePrice: true,
        isActive: true
      },
      take: 5
    });
    
    // Check if providers table has expected fields
    const providers = await db.provider.findMany({
      select: {
        id: true,
        businessName: true,
        status: true,
        available: true,
        hourlyRate: true
      },
      take: 3
    });
    
    // Check if bookings table has expected fields
    const bookings = await db.booking.findMany({
      select: {
        id: true,
        serviceId: true,
        clientId: true,
        providerId: true,
        scheduledDate: true,
        status: true,
        totalAmount: true
      },
      take: 3
    });
    
    // Check if provider_services table exists
    const providerServices = await db.providerService.findMany({
      select: {
        id: true,
        providerId: true,
        serviceId: true
      },
      take: 3
    });
    
    return NextResponse.json({
      success: true,
      schema: {
        serviceCategories: {
          count: serviceCategories.length,
          sample: serviceCategories.slice(0, 2)
        },
        services: {
          count: services.length,
          sample: services.slice(0, 2)
        },
        providers: {
          count: providers.length,
          sample: providers.slice(0, 2)
        },
        bookings: {
          count: bookings.length,
          sample: bookings.slice(0, 2)
        },
        providerServices: {
          count: providerServices.length,
          sample: providerServices.slice(0, 2)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Database schema check failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 });
  }
}
