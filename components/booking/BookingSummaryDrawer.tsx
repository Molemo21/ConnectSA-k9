"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Clock, MapPin, User, Package, Loader2 } from "lucide-react"

export function BookingSummaryDrawer({
  data,
  onClose,
  onConfirm
}: {
  data: {
    provider: any
    serviceId: string
    scheduled: { date: string; time: string }
    address: string
    notes?: string
    package: { id: string; title: string; price: number; currency: string; durationMins: number }
  }
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const { provider, scheduled, address, notes, package: pkg } = data
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }

  const handleConfirm = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onConfirm()
    } finally {
      // Parent typically closes the drawer; re-enable just in case.
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-black/90 border-l border-white/10 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Booking Summary</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white disabled:opacity-50" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <Card className="bg-white/5 border-white/10 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base">Selected Package</CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{pkg.title}</span>
              <span className="text-green-400 font-semibold">R{pkg.price}</span>
            </div>
            <div className="text-sm text-white/60">Duration: {formatDuration(pkg.durationMins)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base">Provider</CardTitle>
          </CardHeader>
          <CardContent className="text-white/80">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>{provider.businessName || provider.user?.name}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>{scheduled.date} at {scheduled.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span>{address}</span>
            </div>
            {notes && <div className="text-white/60 text-sm">Notes: {notes}</div>}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white disabled:opacity-70"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm & Book'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            Back to Packages
          </Button>
          <div className="text-xs text-white/50 text-center">
            Your price/duration is snapshotted and won’t change after booking.
          </div>
        </div>
      </div>
    </div>
  )
}



