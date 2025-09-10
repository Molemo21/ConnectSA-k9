import { db } from "@/lib/db-utils"

export type NotificationType = 
  | 'BOOKING_CREATED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_DECLINED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'JOB_CANCELLED'
  | 'DISPUTE_CREATED'
  | 'DISPUTE_RESOLVED'
  | 'REVIEW_SUBMITTED'
  | 'PAYMENT_RELEASED'
  | 'ESCROW_RELEASED'

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  content: string
  metadata?: Record<string, any>
}

export interface NotificationWithUser {
  id: string
  userId: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
  }
}

/**
 * Create a notification for a user
 */
export async function createNotification(data: NotificationData) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        isRead: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log(`🔔 Notification created: ${data.type} for user ${data.userId}`)
    return notification
  } catch (error) {
    console.error('❌ Failed to create notification:', error)
    throw error
  }
}

/**
 * Create multiple notifications at once
 */
export async function createBulkNotifications(notifications: NotificationData[]) {
  try {
    const createdNotifications = await Promise.all(
      notifications.map(notification => createNotification(notification))
    )
    
    console.log(`🔔 Created ${createdNotifications.length} notifications`)
    return createdNotifications
  } catch (error) {
    console.error('❌ Failed to create bulk notifications:', error)
    throw error
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 50) {
  try {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return notifications
  } catch (error) {
    console.error('❌ Failed to get user notifications:', error)
    throw error
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: {
        isRead: true
      }
    })

    return notification
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await db.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    console.log(`🔔 Marked ${result.count} notifications as read for user ${userId}`)
    return result
  } catch (error) {
    console.error('❌ Failed to mark all notifications as read:', error)
    throw error
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await db.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    })

    return count
  } catch (error) {
    console.error('❌ Failed to get unread notification count:', error)
    return 0
  }
}

/**
 * Delete old notifications (cleanup)
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await db.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true
      }
    })

    console.log(`🧹 Cleaned up ${result.count} old notifications`)
    return result
  } catch (error) {
    console.error('❌ Failed to cleanup old notifications:', error)
    throw error
  }
}

/**
 * Notification templates for different actions
 */
export const NotificationTemplates = {
  BOOKING_CREATED: (booking: any) => ({
    type: 'BOOKING_CREATED' as NotificationType,
    title: 'New Booking Request',
    content: `You have a new booking request for ${booking.service?.name || 'service'} from ${booking.client?.name || 'a client'}. Please review and respond.`
  }),

  BOOKING_ACCEPTED: (booking: any) => ({
    type: 'BOOKING_ACCEPTED' as NotificationType,
    title: 'Booking Accepted!',
    content: `Great news! Your booking for ${booking.service?.name || 'service'} has been accepted by ${booking.provider?.businessName || 'the provider'}. You can now proceed with payment.`
  }),

  BOOKING_DECLINED: (booking: any) => ({
    type: 'BOOKING_DECLINED' as NotificationType,
    title: 'Booking Declined',
    content: `Unfortunately, your booking for ${booking.service?.name || 'service'} was declined. Don't worry, you can try booking with another provider.`
  }),

  BOOKING_CANCELLED: (booking: any, cancelledBy: 'client' | 'provider') => ({
    type: 'BOOKING_CANCELLED' as NotificationType,
    title: 'Booking Cancelled',
    content: `Your booking for ${booking.service?.name || 'service'} has been cancelled by ${cancelledBy === 'client' ? 'the client' : 'the provider'}.`
  }),

  PAYMENT_RECEIVED: (booking: any) => ({
    type: 'PAYMENT_RECEIVED' as NotificationType,
    title: 'Payment Received',
    content: `Payment received for ${booking.service?.name || 'your service'} - Booking #${booking.id}. You can now start the job!`
  }),

  PAYMENT_FAILED: (booking: any) => ({
    type: 'PAYMENT_FAILED' as NotificationType,
    title: 'Payment Failed',
    content: `Payment failed for ${booking.service?.name || 'service'} - Booking #${booking.id}. Please try again or contact support.`
  }),

  JOB_STARTED: (booking: any) => ({
    type: 'JOB_STARTED' as NotificationType,
    title: 'Job Started',
    content: `Great news! ${booking.provider?.businessName || 'The provider'} has started working on your ${booking.service?.name || 'service'}.`
  }),

  JOB_COMPLETED: (booking: any) => ({
    type: 'JOB_COMPLETED' as NotificationType,
    title: 'Job Completed',
    content: `Your ${booking.service?.name || 'service'} has been completed! Please review the work and confirm completion to release payment.`
  }),

  DISPUTE_CREATED: (booking: any, disputeType: string) => ({
    type: 'DISPUTE_CREATED' as NotificationType,
    title: 'Dispute Created',
    content: `A dispute has been created for booking #${booking.id} regarding ${disputeType}. Our team will review and resolve this issue.`
  }),

  DISPUTE_RESOLVED: (booking: any, resolution: string) => ({
    type: 'DISPUTE_RESOLVED' as NotificationType,
    title: 'Dispute Resolved',
    content: `The dispute for booking #${booking.id} has been resolved: ${resolution}`
  }),

  REVIEW_SUBMITTED: (booking: any, rating: number) => ({
    type: 'REVIEW_SUBMITTED' as NotificationType,
    title: 'Review Submitted',
    content: `A ${rating}-star review has been submitted for your service on booking #${booking.id}.`
  }),

  PAYMENT_RELEASED: (booking: any, amount: number) => ({
    type: 'PAYMENT_RELEASED' as NotificationType,
    title: 'Payment Released',
    content: `Payment of R${amount.toFixed(2)} has been released for booking #${booking.id}. The funds should appear in your account within 1-3 business days.`
  }),

  ESCROW_RELEASED: (booking: any, amount: number) => ({
    type: 'ESCROW_RELEASED' as NotificationType,
    title: 'Escrow Released',
    content: `Escrow payment of R${amount.toFixed(2)} has been released for booking #${booking.id}.`
  })
}
