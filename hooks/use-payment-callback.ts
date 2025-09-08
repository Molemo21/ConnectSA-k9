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

    const debounceKey = bookingId ? `payment_callback_${bookingId}` : 'payment_callback_generic'
    const alreadyHandled = sessionStorage.getItem(debounceKey) === '1'
    const refKey = reference || trxref || ''
    const lastRefKey = sessionStorage.getItem(`${debounceKey}_ref`)

    if (!handledRef.current && !alreadyHandled && payment === 'success' && bookingId) {
      handledRef.current = true

      // Immediately clean URL to avoid re-trigger on tab switches/rerenders
      try {
        url.searchParams.delete('payment')
        url.searchParams.delete('booking')
        url.searchParams.delete('trxref')
        url.searchParams.delete('reference')
        window.history.replaceState({}, '', url.toString())
      } catch {}

      // Mark handled for this booking (and reference if present)
      sessionStorage.setItem(debounceKey, '1')
      if (refKey) sessionStorage.setItem(`${debounceKey}_ref`, refKey)

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

        // URL already cleaned above
      })()
    }
  }, [options])
}


