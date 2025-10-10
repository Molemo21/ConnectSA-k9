import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simplified query to avoid complex relations
    const payments = await db.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      payments,
      total: payments.length
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      payments: [],
      total: 0
    }, { status: 200 })
  }
}
