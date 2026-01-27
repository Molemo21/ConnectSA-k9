"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  XCircle, 
  CheckCircle, 
  Calendar,
  MapPin,
  DollarSign,
  ArrowRight
} from "lucide-react"

interface BookingStatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'cancelled' | 'confirmed' | 'timeout'
  booking: {
    id: string
    status: string
    scheduledDate: string
    totalAmount: number
    address: string
    provider?: {
      businessName: string
    } | null
    service?: {
      name: string
    } | null
  }
}

export function BookingStatusChangeModal({
  isOpen,
  onClose,
  type,
  booking
}: BookingStatusChangeModalProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleFindAnotherProvider = () => {
    handleClose()
    router.push('/book-service')
  }

  const handleViewDashboard = () => {
    handleClose()
    router.push('/dashboard')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  if (type === 'cancelled') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Booking Declined
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-gray-600 pt-2">
              {booking.provider?.businessName 
                ? `${booking.provider.businessName} has declined your booking request.`
                : 'Your booking request has been declined.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Booking Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {booking.service && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium text-gray-900">{booking.service.name}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date & Time
                </span>
                <span className="font-medium text-gray-900">{formatDate(booking.scheduledDate)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Address
                </span>
                <span className="font-medium text-gray-900 text-right max-w-xs truncate">
                  {booking.address}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </span>
                <span className="font-medium text-gray-900">R {booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Helpful Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 Don't worry! You can easily find another provider to complete your service.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleViewDashboard}
              className="w-full sm:w-auto"
            >
              View Dashboard
            </Button>
            <Button
              onClick={handleFindAnotherProvider}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Find Another Provider
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (type === 'confirmed') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-green-600">
                Booking Confirmed! 🎉
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-gray-600 pt-2">
              {booking.provider?.businessName 
                ? `Great news! ${booking.provider.businessName} has accepted your booking request.`
                : 'Your booking request has been accepted!'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Booking Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {booking.service && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium text-gray-900">{booking.service.name}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date & Time
                </span>
                <span className="font-medium text-gray-900">{formatDate(booking.scheduledDate)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="default" className="bg-green-600">
                  CONFIRMED
                </Badge>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✅ Your booking is confirmed! Next step: Complete payment to secure your booking.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleViewDashboard}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
