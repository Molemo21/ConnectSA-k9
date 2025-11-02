"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react"
import { showToast } from "@/lib/toast"

interface ConfirmPanelProps {
  booking?: { 
    id: string; 
    status: string; 
    paymentMethod?: "ONLINE" | "CASH";
    payment?: { id: string; status: string } | null 
  }
  onVerify?: (status: string) => void
}

export function ConfirmPanel({ booking, onVerify }: ConfirmPanelProps) {
  const [verifying, setVerifying] = useState(false)

  async function verifyPayment() {
    if (!booking?.payment?.id) return
    setVerifying(true)
    try {
      const res = await fetch('/api/payment/recover-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: booking.payment.id })
      })
      const data = await res.json()
      if (res.ok && data?.payment?.status) {
        showToast.success('Payment verified successfully')
        onVerify?.(data.payment.status)
      } else {
        showToast.error(data?.error || data?.message || 'Verification failed')
      }
    } catch (e) {
      showToast.error('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl">Confirmation</CardTitle>
        <CardDescription>Finalize your booking and verify payment if needed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div>
            <div className="text-sm text-gray-600">Booking Status</div>
            <div className="font-medium text-gray-900">{booking?.status || 'Unknown'}</div>
          </div>
          <ShieldCheck className="w-5 h-5 text-purple-600" />
        </div>

        {booking?.payment && booking?.paymentMethod !== 'CASH' && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <div className="text-sm text-gray-600">Payment Status</div>
              <div className="font-medium text-gray-900">{booking.payment.status}</div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        )}

        {booking?.paymentMethod === 'CASH' && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
            <div>
              <div className="text-sm text-green-600">Payment Method</div>
              <div className="font-medium text-green-900">Pay with Cash</div>
              <div className="text-xs text-green-600 mt-1">
                Pay directly to your provider after service completion
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        )}

        {booking?.payment?.status === 'PENDING' && booking?.paymentMethod !== 'CASH' && (
          <Button onClick={verifyPayment} disabled={verifying} className="w-full">
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying Payment...
              </>
            ) : (
              'Verify Payment'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

