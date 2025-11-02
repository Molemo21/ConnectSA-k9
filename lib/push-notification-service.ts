import webpush from 'web-push'
import { db } from '@/lib/db-utils'

// Initialize web-push with VAPID keys
const initializeWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  
  if (!publicKey || !privateKey) {
    console.warn('⚠️ VAPID keys not configured. Push notifications will be disabled.')
    return false
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@app.proliinkconnect.co.za',
    publicKey,
    privateKey
  )

  return true
}

const isPushEnabled = initializeWebPush()

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface PushNotificationPayload {
  title: string
  body: string
  url?: string
  bookingId?: string
  icon?: string
}

/**
 * Save push subscription to database
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionData,
  userAgent?: string
) {
  if (!isPushEnabled) {
    throw new Error('Push notifications are not configured')
  }

  try {
    // Check if subscription already exists
    const existing = await db.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    })

    if (existing) {
      // Update existing subscription
      return await db.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: userAgent || null
        }
      })
    }

    // Create new subscription
    return await db.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null
      }
    })
  } catch (error) {
    console.error('❌ Failed to save push subscription:', error)
    throw error
  }
}

/**
 * Remove push subscription from database
 */
export async function removePushSubscription(endpoint: string) {
  try {
    return await db.pushSubscription.delete({
      where: { endpoint }
    })
  } catch (error) {
    console.error('❌ Failed to remove push subscription:', error)
    throw error
  }
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserPushSubscriptions(userId: string) {
  try {
    return await db.pushSubscription.findMany({
      where: { userId }
    })
  } catch (error) {
    console.error('❌ Failed to get user push subscriptions:', error)
    return []
  }
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
) {
  if (!isPushEnabled) {
    console.warn('⚠️ Push notifications disabled - VAPID keys not configured')
    return { success: false, error: 'Push notifications not configured' }
  }

  try {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      data: {
        url: payload.url || '/',
        bookingId: payload.bookingId
      },
      vibrate: [200, 100, 200]
    })

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      pushPayload
    )

    return { success: true }
  } catch (error: any) {
    // Handle expired/invalid subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`🔄 Subscription expired, removing: ${subscription.endpoint}`)
      try {
        await removePushSubscription(subscription.endpoint)
      } catch (deleteError) {
        console.error('Failed to delete expired subscription:', deleteError)
      }
    }

    console.error('❌ Failed to send push notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send push notification to all user's devices
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
) {
  if (!isPushEnabled) {
    return []
  }

  try {
    const subscriptions = await getUserPushSubscriptions(userId)
    
    if (subscriptions.length === 0) {
      return []
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        )
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    if (successful > 0) {
      console.log(`✅ Push sent to ${successful} device(s) for user ${userId}`)
    }
    if (failed > 0) {
      console.log(`⚠️ Failed to send push to ${failed} device(s) for user ${userId}`)
    }

    return results.map((r, i) => ({
      endpoint: subscriptions[i].endpoint,
      success: r.status === 'fulfilled' && r.value.success,
      error: r.status === 'rejected' ? r.reason?.message : r.value.error
    }))
  } catch (error) {
    console.error('❌ Failed to send push notification to user:', error)
    return []
  }
}

/**
 * Get VAPID public key (safe to expose to client)
 */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null
}




