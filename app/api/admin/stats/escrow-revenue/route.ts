export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.payment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: 'ESCROW'
      }
    })
    
    return NextResponse.json({ _sum: { amount: result._sum.amount || 0 } })
  } catch (error) {
    console.error('Error fetching escrow revenue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
