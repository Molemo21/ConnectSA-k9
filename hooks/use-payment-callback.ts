"use client"

import { useEffect, useRef } from "react"
import { showToast } from "@/lib/toast"

interface PaymentCallbackOptions {
  onRefreshBooking?: (bookingId: string) => Promise<void> | void
  onRefreshAll?: () => Promise<void> | void
}

export function usePaymentCallback(options: PaymentCallbackOptions = {}) {
  const handledRef = useRef(false)
  const optionsRef = useRef<PaymentCallbackOptions>(options)

  // Keep latest callbacks without retriggering main effect
  useEffect(() => {
    optionsRef.current = options
  }, [options])

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

    const globalHandled = (window as any).__PAYMENT_CALLBACK_HANDLED === true

    if (!handledRef.current && !alreadyHandled && !globalHandled && payment === 'success' && bookingId) {
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
      // Also mark a global session key and window flag to guard across components
      sessionStorage.setItem('payment_callback_any', '1')
      ;(window as any).__PAYMENT_CALLBACK_HANDLED = true

      showToast.success('Payment completed successfully! Refreshing booking status...')

      ;(async () => {
        try {
          if (optionsRef.current.onRefreshBooking) {
            await optionsRef.current.onRefreshBooking(bookingId)
          }
        } catch {}

        try {
          if (optionsRef.current.onRefreshAll) {
            await optionsRef.current.onRefreshAll()
          }
        } catch {}

        // URL already cleaned above
      })()
    }
  }, [])
}


