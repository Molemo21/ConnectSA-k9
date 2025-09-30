import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getUserFromRequest } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const admin = await getUserFromRequest(request)
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { actionId, actionType } = await request.json()

    if (!actionId || !actionType) {
      return NextResponse.json({ error: 'Missing actionId or actionType' }, { status: 400 })
    }

    const providerId = actionId.split('-').pop() // Extract provider ID from action ID

    switch (actionType) {
      case 'approve':
        await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'APPROVED',
            verificationStatus: 'VERIFIED'
          }
        })
        break

      case 'reject':
        await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'REJECTED',
            verificationStatus: 'REJECTED'
          }
        })
        break

      case 'suspend':
        await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'SUSPENDED'
          }
        })
        break

      case 'verify':
        await db.provider.update({
          where: { id: providerId },
          data: { 
            verificationStatus: 'VERIFIED'
          }
        })
        break

      case 'complete_profile':
        // This would typically open a form or redirect to profile completion
        // For now, we'll just mark as needing attention
        await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'INCOMPLETE'
          }
        })
        break

      case 'merge':
        // This is a complex operation that would require manual intervention
        // For now, we'll mark for manual review
        await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'PENDING_MERGE'
          }
        })
        break

      case 'delete':
        // Only delete if provider has no bookings or earnings
        const provider = await db.provider.findUnique({
          where: { id: providerId },
          include: {
            bookings: true,
            payouts: true
          }
        })

        if (provider && provider.bookings.length === 0 && provider.payouts.length === 0) {
          await db.provider.delete({
            where: { id: providerId }
          })
        } else {
          return NextResponse.json({ 
            error: 'Cannot delete provider with existing bookings or earnings' 
          }, { status: 400 })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }

    // Log the action
    await db.auditLog.create({
      data: {
        action: `PROVIDER_${actionType.toUpperCase()}`,
        entityType: 'PROVIDER',
        entityId: providerId,
        adminId: admin.id,
        details: JSON.stringify({
          actionType,
          actionId,
          timestamp: new Date().toISOString()
        })
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Provider ${actionType} completed successfully` 
    })

  } catch (error) {
    console.error('Error executing cleanup action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
