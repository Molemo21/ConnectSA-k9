"use client"

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UsePushNotificationsReturn {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  vapidPublicKey: string | null
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null)
  const { toast } = useToast()

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      setIsSupported(supported)
    }

    checkSupport()

    // Check current subscription status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => registration.pushManager.getSubscription())
        .then(subscription => setIsSubscribed(!!subscription))
        .catch(() => setIsSubscribed(false))
    }

    // Fetch VAPID public key
    fetch('/api/push/vapid-public-key')
      .then(res => res.json())
      .then(data => setVapidPublicKey(data.publicKey || null))
      .catch(() => setVapidPublicKey(null))
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported || !vapidPublicKey) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications to receive updates",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!)
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
      toast({
        title: "Success",
        description: "Push notifications enabled! You'll receive updates even when the app is closed."
      })
    } catch (error: any) {
      console.error('Push subscription error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to enable push notifications",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, vapidPublicKey, toast])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })

        // Unsubscribe from browser
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      toast({
        title: "Notifications Disabled",
        description: "Push notifications have been disabled"
      })
    } catch (error: any) {
      console.error('Push unsubscribe error:', error)
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    vapidPublicKey
  }
}

// Helper: Convert VAPID public key from base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Helper: Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}




