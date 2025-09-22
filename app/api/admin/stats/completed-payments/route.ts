import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'
import { PaymentStatus } from '@prisma/client'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await db.payment.count({
      where: {
        status: { in: [PaymentStatus.RELEASED, PaymentStatus.COMPLETED] }
      }
    })
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching completed payments count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
