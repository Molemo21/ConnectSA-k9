import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-utils";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG PROVIDER BOOKINGS ===');
    
    // Get all providers
    const providers = await db.provider.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        bookings: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            service: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Get all bookings
    const allBookings = await db.booking.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Providers found:', providers.length);
    console.log('All bookings found:', allBookings.length);

    return NextResponse.json({
      success: true,
      providers: providers.map(p => ({
        id: p.id,
        businessName: p.businessName,
        status: p.status,
        available: p.available,
        user: p.user,
        bookingCount: p.bookings.length,
        recentBookings: p.bookings.slice(0, 3).map(b => ({
          id: b.id,
          status: b.status,
          scheduledDate: b.scheduledDate,
          client: b.client,
          service: b.service
        }))
      })),
      allBookings: allBookings.map(b => ({
        id: b.id,
        status: b.status,
        scheduledDate: b.scheduledDate,
        client: b.client,
        provider: b.provider,
        service: b.service,
        createdAt: b.createdAt
      })),
      summary: {
        totalProviders: providers.length,
        totalBookings: allBookings.length,
        bookingsByStatus: allBookings.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Debug provider bookings error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
