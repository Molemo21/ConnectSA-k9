import { createNotification, NotificationData } from "@/lib/notification-service"
import { sendEmail } from "@/lib/email"
import { EmailTemplates } from "@/lib/email-templates"
import { sendPushNotificationToUser } from "@/lib/push-notification-service"

type Channel = 'in-app' | 'email' | 'push'

interface SendOptions {
  channels?: Channel[]
  email?: {
    to: string
    subject?: string
    html?: string
    text?: string
  }
  push?: {
    userId: string
    title?: string
    body?: string
    url?: string
  }
}

export async function sendMultiChannelNotification(
  data: NotificationData,
  options: SendOptions
) {
  const channels: Channel[] = options.channels || ['in-app', 'email']
  const results: { channel: Channel; success: boolean; error?: string }[] = []

  // Always create in-app notification first
  if (channels.includes('in-app')) {
    try {
      await createNotification(data)
      results.push({ channel: 'in-app', success: true })
    } catch (err: any) {
      results.push({ channel: 'in-app', success: false, error: err?.message })
    }
  }

  // Email channel
  if (channels.includes('email') && options.email?.to) {
    try {
      const subject = options.email.subject || data.title
      // Auto-generate common booking emails if html not provided
      let html = options.email.html
      if (!html && data.metadata?.booking) {
        const b = data.metadata.booking
        const link = data.metadata.linkUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/bookings/${b.id}`
        const payload = {
          bookingId: b.id,
          serviceName: b.service?.name,
          providerName: b.provider?.businessName || b.provider?.user?.name,
          clientName: b.client?.name,
          amount: b.totalAmount,
          linkUrl: link
        }
        const map: Record<string, (d: any) => string> = {
          BOOKING_CREATED: EmailTemplates.bookingCreated,
          BOOKING_ACCEPTED: EmailTemplates.bookingAccepted,
          BOOKING_DECLINED: EmailTemplates.bookingDeclined,
          PAYMENT_RECEIVED: EmailTemplates.paymentReceived,
          JOB_STARTED: EmailTemplates.jobStarted,
          JOB_COMPLETED: EmailTemplates.jobCompleted,
          PAYMENT_RELEASED: EmailTemplates.paymentReleased
        }
        const tmpl = map[data.type]
        if (tmpl) html = tmpl(payload)
      }
      html = html || `<p>${data.content}</p>`
      const text = options.email.text
      const res = await sendEmail({ to: options.email.to, subject, html, text })
      results.push({ channel: 'email', success: !!res.success, error: res.error })
    } catch (err: any) {
      results.push({ channel: 'email', success: false, error: err?.message })
    }
  }

  // Push channel - send to all user's devices
  if (channels.includes('push') && options.push?.userId) {
    try {
      const pushResults = await sendPushNotificationToUser(
        options.push.userId,
        {
          title: options.push.title || data.title,
          body: options.push.body || data.content,
          url: options.push.url || data.metadata?.linkUrl || '/',
          bookingId: data.metadata?.booking?.id
        }
      )

      // Count successes/failures
      const successful = pushResults.filter(r => r.success).length
      const failed = pushResults.filter(r => !r.success).length

      if (successful > 0) {
        results.push({ channel: 'push', success: true })
      } else if (failed > 0) {
        // If user has subscriptions but all failed
        results.push({ channel: 'push', success: false, error: 'No active devices' })
      } else {
        // User has no push subscriptions (not an error, just silent)
        results.push({ channel: 'push', success: true })
      }
    } catch (err: any) {
      console.error('Push notification error:', err)
      results.push({ channel: 'push', success: false, error: err?.message || 'Push service error' })
    }
  }

  return results
}


