import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'
import { UserRole, AuditAction } from '@prisma/client'
import { logAdminAction, extractRequestInfo } from '@/lib/audit-logger'
import { sendEmail } from '@/lib/email'
import { retryDatabaseOperation } from '@/lib/db-health'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'




export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const targetUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate simplified stats
    const stats = {
      totalBookings: 0, // Simplified - would need complex query
      completedBookings: 0, // Simplified - would need complex query
      cancelledBookings: 0, // Simplified - would need complex query
      totalSpent: 0, // Simplified - would need complex query
      averageBookingValue: 0 // Simplified - would need complex query
    }

    return NextResponse.json({
      ...targetUser,
      stats
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { action, reason } = body

    const targetUser = await db.user.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from modifying themselves
    if (targetUser.id === admin.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
    }

    const { ipAddress, userAgent } = extractRequestInfo(request)
    let updatedUser
    let auditAction: AuditAction
    let emailSubject = ''
    let emailContent = ''

    switch (action) {
      case 'suspend':
        updatedUser = await db.user.update({
          where: { id },
          data: { isActive: false },
        })
        auditAction = 'USER_SUSPENDED' as any
        emailSubject = 'Account Suspended - ConnectSA'
        emailContent = `Your account has been suspended. Reason: ${reason || 'No reason provided'}`
        break

      case 'unsuspend':
        updatedUser = await db.user.update({
          where: { id },
          data: { isActive: true },
        })
        auditAction = 'USER_UNSUSPENDED' as any
        emailSubject = 'Account Reactivated - ConnectSA'
        emailContent = 'Your account has been reactivated and you can now access our services.'
        break

      case 'changeRole':
        const { newRole } = body
        if (!Object.values(UserRole).includes(newRole)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
        
        // If changing from PROVIDER to another role, handle provider cleanup
        if (targetUser.role === 'PROVIDER' && newRole !== 'PROVIDER' && targetUser.provider) {
          // Soft delete provider profile
          await db.provider.update({
            where: { id: targetUser.provider.id },
            data: { status: 'SUSPENDED' },
          })
        }
        
        // If changing to PROVIDER and no provider profile exists, create one
        if (newRole === 'PROVIDER' && !targetUser.provider) {
          await db.provider.create({
            data: {
              userId: id,
              status: 'INCOMPLETE',
            },
          })
        }

        updatedUser = await db.user.update({
          where: { id },
          data: { role: newRole },
        })
        auditAction = 'USER_ROLE_CHANGED' as any
        emailSubject = 'Account Role Updated - ConnectSA'
        emailContent = `Your account role has been changed to ${newRole}.`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log the admin action
    await logAdminAction({
      adminId: admin.id,
      action: auditAction,
      targetType: 'USER',
      targetId: id,
      details: {
        action,
        reason,
        previousRole: targetUser.role,
        newRole: body.newRole,
        previousStatus: targetUser.isActive,
        newStatus: updatedUser.isActive,
      },
      ipAddress,
      userAgent,
    })

    // Send email notification to user
    try {
      await sendEmail({
        to: targetUser.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${emailSubject}</h2>
            <p>Hello ${targetUser.name},</p>
            <p>${emailContent}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The ConnectSA Team</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Input validation
    const { id } = params
    const body = await request.json()
    const { reason, permanent = false } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Extract request metadata
    const { ipAddress, userAgent } = extractRequestInfo(request)

    // Call domain service - all business logic is encapsulated
    const { deleteUser } = await import('@/lib/services/user-deletion-service')
    const result = await deleteUser({
      userId: id,
      adminId: admin.id,
      permanent,
      reason,
      ipAddress,
      userAgent,
    })

    // Send email notification AFTER transaction commits (non-blocking, failure-tolerant)
    // This must never cause rollback or 500 responses
    if (result.user?.email && !result.user.email.includes('@deleted.local') && !result.user.email.includes('@example.invalid')) {
      // Only send email if user email is still valid (not anonymized)
      Promise.resolve().then(async () => {
        try {
          const emailSubject =
            result.action === 'deleted'
              ? 'Account Permanently Deleted - ConnectSA'
              : result.action === 'anonymized'
              ? 'Account Anonymized - ConnectSA'
              : 'Account Deactivated - ConnectSA'

          const emailContent =
            result.action === 'deleted'
              ? 'Your account has been permanently deleted from our platform.'
              : result.action === 'anonymized'
              ? `Your account has been anonymized. All personal information has been removed while preserving transactional records for audit and compliance.`
              : 'Your account has been deactivated from our platform.'

          await sendEmail({
            to: result.user!.email,
            subject: emailSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${emailSubject}</h2>
                <p>Hello,</p>
                <p>${emailContent}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                ${result.preservedData
                  ? `<p><strong>Note:</strong> Your transactional data (${result.preservedData.clientBookings + result.preservedData.providerBookings} bookings, ${result.preservedData.reviews} reviews, ${result.preservedData.payouts} payouts) has been preserved for audit and compliance purposes.</p>`
                  : ''}
                <p>If you believe this was done in error, please contact our support team.</p>
                <p>Best regards,<br>The ConnectSA Team</p>
              </div>
            `,
          })
        } catch (emailError) {
          // Email failures are logged but never cause operation failure
          console.error('⚠️ Failed to send email notification (non-critical):', emailError)
        }
      }).catch((err) => {
        // Ensure unhandled promise rejections don't crash the process
        console.error('⚠️ Email notification promise rejection (non-critical):', err)
      })
    }

    // Build response based on action type
    if (result.action === 'anonymized') {
      return NextResponse.json({
        message: result.message,
        action: result.action,
        reason: result.preservedData
          ? `Cannot permanently delete user with transactional data. Found: ${result.preservedData.clientBookings} client booking(s), ${result.preservedData.providerBookings} provider booking(s), ${result.preservedData.reviews} review(s), ${result.preservedData.payouts} payout(s). All personal information has been removed while preserving transactional records for audit and compliance.`
          : 'User has been anonymized.',
        preservedData: result.preservedData,
        user: result.user,
      })
    }

    if (result.action === 'deleted') {
      return NextResponse.json({
        message: result.message,
        action: result.action,
        note: result.note,
      })
    }

    // Soft delete response
    return NextResponse.json({
      message: result.message,
      action: result.action,
      user: result.user,
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)

    // Handle specific error types with clear messages
    if (error.message === 'Cannot delete your own account') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error.message === 'User is already anonymized') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error.message?.includes('Database migrations not applied')) {
      return NextResponse.json(
        {
          error: 'Database configuration error',
          details: 'Database migrations are not applied. Please contact system administrator.',
        },
        { status: 503 }
      )
    }

    // Handle Prisma constraint violations
    if (error.code === 'P2003' || error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Database constraint violation. User may have linked data that prevents deletion.',
          details: error.message,
        },
        { status: 409 }
      )
    }

    // Handle transaction serialization failures (race conditions)
    if (error.code === 'P2034' || error.message?.includes('serialization')) {
      return NextResponse.json(
        {
          error: 'Transaction conflict. Please retry the operation.',
          details: 'Another operation may be in progress. Please try again.',
        },
        { status: 409 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
