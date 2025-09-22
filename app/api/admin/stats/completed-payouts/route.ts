export const runtime = 'nodejs'
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

    const count = await db.payout.count({
      where: {
        status: 'COMPLETED'
      }
    })
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching completed payouts count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
