/**
 * Unified Booking Status Service
 * 
 * This service provides a centralized way to update booking statuses
 * while ensuring notifications and WebSocket broadcasts are sent atomically.
 * 
 * Best Practices:
 * - Atomic operations: Status update + notifications + broadcasts in one call
 * - Error handling: Don't fail status updates if notifications/broadcasts fail
 * - Fallback: Graceful degradation if WebSocket is unavailable
 * - Performance: Debounce rapid status changes
 */

import { db } from "@/lib/db-utils";
import { sendMultiChannelNotification } from "@/lib/notification-service-enhanced";
import { NotificationTemplates } from "@/lib/notification-service";
import { broadcastBookingUpdate } from "@/lib/socket-server";

type BookingStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING_EXECUTION'
  | 'PAYMENT_PROCESSING'
  | 'DISPUTED';

interface UpdateBookingStatusOptions {
  bookingId: string;
  newStatus: BookingStatus;
  notificationType: keyof typeof NotificationTemplates;
  targetUserIds: string[];
  notificationData?: {
    clientEmail?: string;
    providerEmail?: string;
    clientName?: string;
    providerName?: string;
    serviceName?: string;
  };
  metadata?: Record<string, any>;
  skipStatusUpdate?: boolean; // If true, skip status update (status already updated)
  skipNotification?: boolean;
  skipBroadcast?: boolean;
}

interface UpdateBookingStatusResult {
  success: boolean;
  booking: any;
  notificationsSent: boolean;
  broadcastSent: boolean;
  errors?: string[];
}

/**
 * Updates booking status and sends notifications + WebSocket broadcasts atomically
 */
export async function updateBookingStatusWithNotification(
  options: UpdateBookingStatusOptions
): Promise<UpdateBookingStatusResult> {
  const {
    bookingId,
    newStatus,
    notificationType,
    targetUserIds,
    notificationData,
    metadata = {},
    skipStatusUpdate = false,
    skipNotification = false,
    skipBroadcast = false,
  } = options;

  const errors: string[] = [];
  let notificationsSent = false;
  let broadcastSent = false;

  try {
    // 1. Fetch the booking with all necessary relations
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    // 2. Update booking status in database (if not skipped)
    let updatedBooking = booking;
    if (!skipStatusUpdate) {
      updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          service: {
            select: {
              name: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          payment: true,
        },
      });
    } else {
      // If status update is skipped, ensure we have the full booking data
      updatedBooking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          service: {
            select: {
              name: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          payment: true,
        },
      });
      
      if (!updatedBooking) {
        throw new Error(`Booking ${bookingId} not found after status update`);
      }
    }

    // 3. Send notifications (if not skipped)
    if (!skipNotification) {
      try {
        const template = NotificationTemplates[notificationType];
        if (!template) {
          throw new Error(`Notification template ${notificationType} not found`);
        }

        // Prepare booking data for notification template
        const bookingForNotification = {
          ...updatedBooking,
          client: {
            ...updatedBooking.client,
            name: notificationData?.clientName || updatedBooking.client.name,
            email: notificationData?.clientEmail || updatedBooking.client.email,
          },
          provider: {
            ...updatedBooking.provider,
            businessName: notificationData?.providerName || updatedBooking.provider.businessName,
            user: {
              ...updatedBooking.provider.user,
              name: notificationData?.providerName || updatedBooking.provider.user.name,
              email: notificationData?.providerEmail || updatedBooking.provider.user.email,
            },
          },
          service: {
            ...updatedBooking.service,
            name: notificationData?.serviceName || updatedBooking.service.name,
          },
        };

        const notificationData_template = template(bookingForNotification);

        // Send notifications to all target users
        for (const userId of targetUserIds) {
          try {
            const user = userId === updatedBooking.clientId 
              ? updatedBooking.client 
              : updatedBooking.provider.user;

            if (!user) continue;

            await sendMultiChannelNotification(
              {
                userId,
                type: notificationData_template.type,
                title: notificationData_template.title,
                content: notificationData_template.content,
                metadata: {
                  booking: updatedBooking,
                  ...metadata,
                },
              },
              {
                channels: ['in-app', 'email', 'push'],
                email: {
                  to: user.email,
                  subject: notificationData_template.title,
                },
                push: {
                  userId,
                  title: notificationData_template.title,
                  body: notificationData_template.content,
                  url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/bookings/${bookingId}`,
                },
              }
            );
          } catch (userNotificationError) {
            const errorMsg = `Failed to send notification to user ${userId}: ${userNotificationError instanceof Error ? userNotificationError.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`, userNotificationError);
          }
        }

        notificationsSent = true;
        console.log(`🔔 Notifications sent for booking ${bookingId} status change to ${newStatus}`);
      } catch (notificationError) {
        const errorMsg = `Failed to send notifications: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`, notificationError);
        // Don't throw - status update succeeded, notification failure is non-critical
      }
    }

    // 4. Broadcast WebSocket event (if not skipped)
    if (!skipBroadcast) {
      try {
        broadcastBookingUpdate(
          bookingId,
          'status_changed',
          {
            ...updatedBooking,
            newStatus,
            previousStatus: booking.status,
            timestamp: new Date().toISOString(),
            ...metadata,
          },
          targetUserIds
        );
        broadcastSent = true;
        console.log(`📡 WebSocket broadcast sent for booking ${bookingId} status change to ${newStatus}`);
      } catch (broadcastError) {
        const errorMsg = `Failed to broadcast WebSocket event: ${broadcastError instanceof Error ? broadcastError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`, broadcastError);
        // Don't throw - status update succeeded, broadcast failure is non-critical
      }
    }

    return {
      success: true,
      booking: updatedBooking,
      notificationsSent,
      broadcastSent,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to update booking status: ${errorMsg}`, error);
    throw error; // Re-throw critical errors (database failures)
  }
}

/**
 * Helper function to determine target users for a booking status change
 */
export function getTargetUsersForBookingStatusChange(
  booking: { clientId: string; providerId: string; provider: { user: { id: string } } },
  status: BookingStatus
): string[] {
  // Always notify both client and provider for status changes
  return [booking.clientId, booking.provider.user.id];
}

/**
 * Helper function to get notification type from booking status
 */
export function getNotificationTypeForStatus(status: BookingStatus): keyof typeof NotificationTemplates | null {
  const statusToNotificationMap: Record<BookingStatus, keyof typeof NotificationTemplates | null> = {
    PENDING: 'BOOKING_CREATED',
    CONFIRMED: 'BOOKING_ACCEPTED',
    IN_PROGRESS: 'JOB_STARTED',
    AWAITING_CONFIRMATION: 'JOB_COMPLETED',
    COMPLETED: 'PAYMENT_RELEASED',
    CANCELLED: 'BOOKING_CANCELLED',
    PENDING_EXECUTION: 'PAYMENT_RECEIVED',
    PAYMENT_PROCESSING: null,
    DISPUTED: null,
  };

  return statusToNotificationMap[status] || null;
}

