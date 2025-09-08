"use client"

import { useEffect, useRef } from "react"
import { showToast } from "@/lib/toast"

interface PaymentCallbackOptions {
  onRefreshBooking?: (bookingId: string) => Promise<void> | void
  onRefreshAll?: () => Promise<void> | void
}

export function usePaymentCallback(options: PaymentCallbackOptions = {}) {
  const handledRef = useRef(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const payment = url.searchParams.get('payment')
    const bookingId = url.searchParams.get('booking')
    const trxref = url.searchParams.get('trxref')
    const reference = url.searchParams.get('reference')

    if (!handledRef.current && payment === 'success' && bookingId) {
      handledRef.current = true
      showToast.success('Payment completed successfully! Refreshing booking status...')

      ;(async () => {
        try {
          if (options.onRefreshBooking) {
            await options.onRefreshBooking(bookingId)
          }
        } catch {}

        try {
          if (options.onRefreshAll) {
            await options.onRefreshAll()
          }
        } catch {}

        // Clean URL
        try {
          url.searchParams.delete('payment')
          url.searchParams.delete('booking')
          url.searchParams.delete('trxref')
          url.searchParams.delete('reference')
          window.history.replaceState({}, '', url.toString())
        } catch {}
      })()
    }
  }, [options])
}


