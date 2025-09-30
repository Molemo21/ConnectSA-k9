import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Testing database connection and schema...')

    // Test 1: Simple provider count
    const providerCount = await db.provider.count()
    console.log('Provider count:', providerCount)

    // Test 2: Simple booking count
    const bookingCount = await db.booking.count()
    console.log('Booking count:', bookingCount)

    // Test 3: Try to fetch a single provider without verification fields
    const testProvider = await db.provider.findFirst({
      select: {
        id: true,
        businessName: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Test 4: Try to fetch a single booking
    const testBooking = await db.booking.findFirst({
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        client: {
          select: {
            name: true,
            email: true
          }
        },
        provider: {
          select: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      providerCount,
      bookingCount,
      testProvider: testProvider ? {
        id: testProvider.id,
        businessName: testProvider.businessName,
        status: testProvider.status,
        userName: testProvider.user.name,
        userEmail: testProvider.user.email
      } : null,
      testBooking: testBooking ? {
        id: testBooking.id,
        status: testBooking.status,
        totalAmount: testBooking.totalAmount,
        clientName: testBooking.client.name,
        providerName: testBooking.provider.user.name,
        serviceName: testBooking.service.name
      } : null
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
