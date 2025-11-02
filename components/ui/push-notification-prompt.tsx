"use client"

import { useState, useEffect } from "react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Button } from "@/components/ui/button"
import { X, Bell, BellOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PushNotificationPromptProps {
  onDismiss?: () => void
  autoShow?: boolean
  delay?: number
}

export function PushNotificationPrompt({ 
  onDismiss, 
  autoShow = true,
  delay = 3000 
}: PushNotificationPromptProps) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, vapidPublicKey } = usePushNotifications()

  useEffect(() => {
    if (!autoShow || dismissed || !isSupported || isSubscribed || !vapidPublicKey) {
      return
    }

    // Check if user has previously dismissed
    const wasDismissed = localStorage.getItem('push-notification-prompt-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Show after delay
    const timer = setTimeout(() => {
      setShow(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [autoShow, dismissed, isSupported, isSubscribed, vapidPublicKey, delay])

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('push-notification-prompt-dismissed', 'true')
    onDismiss?.()
  }

  const handleSubscribe = async () => {
    await subscribe()
    if (isSubscribed) {
      setShow(false)
    }
  }

  if (!show || !isSupported || !vapidPublicKey) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Enable Notifications</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Get instant updates about your bookings, even when the app is closed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              <span>Booking confirmations</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              <span>Payment updates</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              <span>Job status changes</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Enabling..." : "Enable Notifications"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={isLoading}
            >
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Compact notification toggle for settings pages
 */
export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Push notifications are not supported in this browser
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">Push Notifications</div>
        <div className="text-sm text-gray-500">
          Receive updates even when the app is closed
        </div>
      </div>
      <Button
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
      >
        {isLoading ? (
          "Loading..."
        ) : isSubscribed ? (
          <>
            <BellOff className="w-4 h-4 mr-2" />
            Disable
          </>
        ) : (
          <>
            <Bell className="w-4 h-4 mr-2" />
            Enable
          </>
        )}
      </Button>
    </div>
  )
}




