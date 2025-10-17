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

      showToast.success('Payment completed successfully! Verifying payment...')

      ;(async () => {
        try {
          // Verify payment with Paystack if we have a reference
          if (refKey) {
            console.log('🔍 Verifying payment with reference:', refKey)
            
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ reference: refKey })
            })

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              console.log('✅ Payment verification successful:', verifyData)
              showToast.success('Payment verified successfully!')
              
              // Force refresh all booking data after successful verification
              if (optionsRef.current.onRefreshAll) {
                console.log('🔄 Forcing refresh of all booking data...')
                await optionsRef.current.onRefreshAll()
              }
            } else {
              console.warn('⚠️ Payment verification failed:', await verifyResponse.text())
              showToast.warning('Payment completed but verification failed. Refreshing booking data...')
              
              // Try to refresh booking data directly as fallback
              try {
                const refreshResponse = await fetch(`/api/book-service/${bookingId}/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ bookingId })
                })
                
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json()
                  console.log('✅ Booking data refreshed successfully:', refreshData)
                  showToast.success('Payment completed! Booking status updated.')
                  
                  // Force refresh all booking data
                  if (optionsRef.current.onRefreshAll) {
                    await optionsRef.current.onRefreshAll()
                  }
                }
              } catch (refreshError) {
                console.error('Failed to refresh booking data:', refreshError)
              }
            }
          } else {
            // No reference, just refresh booking data
            console.log('🔄 No payment reference, refreshing booking data directly...')
            try {
              const refreshResponse = await fetch(`/api/book-service/${bookingId}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookingId })
              })
              
              if (refreshResponse.ok) {
                console.log('✅ Booking data refreshed successfully')
                showToast.success('Payment completed! Booking status updated.')
                
                // Force refresh all booking data
                if (optionsRef.current.onRefreshAll) {
                  await optionsRef.current.onRefreshAll()
                }
              }
            } catch (refreshError) {
              console.error('Failed to refresh booking data:', refreshError)
            }
          }

          // Refresh booking data
          if (optionsRef.current.onRefreshBooking) {
            await optionsRef.current.onRefreshBooking(bookingId)
          }
        } catch (error) {
          console.error('Payment verification error:', error)
          showToast.warning('Payment completed but verification failed. Status will update shortly.')
        }

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


