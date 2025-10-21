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
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { reason, permanent = false } = body

    const targetUser = await db.user.findUnique({
      where: { id },
      include: {
        provider: true,
        _count: {
          select: {
            bookings: true,
            notifications: true,
          },
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (targetUser.id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // For hard delete, require no linked data. Soft delete allowed regardless.
    if (permanent) {
      if (targetUser._count.bookings > 0 || targetUser._count.notifications > 0) {
        return NextResponse.json({ 
          error: 'Cannot permanently delete user with linked bookings or notifications. Suspend instead.' 
        }, { status: 400 })
      }
    }

    const { ipAddress, userAgent } = extractRequestInfo(request)

    // Perform user deletion with retry logic and proper error handling
    let deletionResult;
    try {
      if (permanent) {
        // Hard delete - only allow for super admins or users with no data
        console.log(`🗑️ Performing hard delete for user: ${targetUser.email}`);
        deletionResult = await retryDatabaseOperation(async () => {
          return await db.user.delete({
            where: { id },
          });
        });
        console.log('✅ User hard deleted successfully');
      } else {
        // Soft delete - set isActive to false
        console.log(`🔒 Performing soft delete for user: ${targetUser.email}`);
        deletionResult = await retryDatabaseOperation(async () => {
          return await db.user.update({
            where: { id },
            data: { 
              isActive: false,
              // Note: We could add a deletedAt field to the schema if needed
            },
          });
        });
        console.log('✅ User soft deleted successfully');
      }
    } catch (dbError) {
      console.error('❌ Database deletion failed after retries:', dbError);
      return NextResponse.json({ 
        error: 'Failed to delete user. Database connection issue. Please try again.' 
      }, { status: 500 });
    }

    // Log the admin action (non-blocking)
    try {
      await logAdminAction({
        adminId: admin.id,
        action: 'USER_DELETED' as any,
        targetType: 'USER',
        targetId: id,
        details: {
          permanent,
          reason,
          userEmail: targetUser.email,
          userRole: targetUser.role,
          bookingsCount: targetUser._count.bookings,
        },
        ipAddress,
        userAgent,
      })
    } catch (auditError) {
      console.error('⚠️ Failed to log admin action (non-critical):', auditError);
      // Don't fail the request if audit logging fails
    }

    // Send email notification to user
    try {
      await sendEmail({
        to: targetUser.email,
        subject: 'Account Deleted - ConnectSA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Account Deleted</h2>
            <p>Hello ${targetUser.name},</p>
            <p>Your account has been ${permanent ? 'permanently deleted' : 'deactivated'} from our platform.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>If you believe this was done in error, please contact our support team.</p>
            <p>Best regards,<br>The ConnectSA Team</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      message: `User ${permanent ? 'permanently deleted' : 'deactivated'} successfully` 
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
