"use client"

import { useEffect } from "react"
import { useRealtimeNotifications } from "@/hooks/use-notifications"

export function NotificationRealtimeToaster() {
  const { checkForNewNotifications } = useRealtimeNotifications()

  useEffect(() => {
    // Kick first check immediately on mount
    checkForNewNotifications()
  }, [checkForNewNotifications])

  return null
}





