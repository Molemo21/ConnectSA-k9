"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Edit, X, AlertTriangle, CheckCircle, Loader2, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  provider?: {
    id: string
    businessName: string
    user: {
      name: string
      phone?: string
    }
  } | null
  scheduledDate: Date
  totalAmount: number
  status: string
  address: string
  description?: string | null
}

interface BookingManagementProps {
  booking: Booking
  onUpdate: (bookingId: string, updates: Partial<Booking>) => void
}

export function BookingManagement({ booking, onUpdate }: BookingManagementProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showModifyDialog, setShowModifyDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  
  // Form states
  const [modifyForm, setModifyForm] = useState({
    address: booking.address,
    description: booking.description || ""
  })
  
  const [rescheduleForm, setRescheduleForm] = useState({
    date: new Date(booking.scheduledDate).toISOString().split('T')[0],
    time: new Date(booking.scheduledDate).toTimeString().slice(0, 5)
  })

  const canModify = ["PENDING"].includes(booking.status)
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  const canReschedule = ["CONFIRMED"].includes(booking.status)

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/book-service/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        onUpdate(booking.id, { status: "CANCELLED" })
        setShowCancelDialog(false)
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to cancel booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleModify = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/book-service/${booking.id}/modify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifyForm)
      })
      
      if (response.ok) {
        onUpdate(booking.id, modifyForm)
        setShowModifyDialog(false)
        toast({
          title: "Booking Updated",
          description: "Your booking details have been updated successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReschedule = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/book-service/${booking.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: new Date(`${rescheduleForm.date}T${rescheduleForm.time}`).toISOString()
        })
      })
      
      if (response.ok) {
        onUpdate(booking.id, { scheduledDate: new Date(`${rescheduleForm.date}T${rescheduleForm.time}`) })
        setShowRescheduleDialog(false)
        toast({
          title: "Booking Rescheduled",
          description: "Your booking has been rescheduled successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to reschedule booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reschedule booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit className="w-5 h-5 text-blue-600" />
          <span>Booking Management</span>
        </CardTitle>
        <CardDescription>
          Manage your booking details and schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Booking Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Current Details</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {new Date(booking.scheduledDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {new Date(booking.scheduledDate).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{booking.address}</span>
              </div>
              {booking.description && (
                <div className="text-gray-600">
                  <span className="font-medium">Notes:</span> {booking.description}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {canModify && (
            <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Edit className="w-4 h-4 mr-2" />
                  Modify Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modify Booking Details</DialogTitle>
                  <DialogDescription>
                    Update your booking address and notes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Service Address</Label>
                    <Input
                      id="address"
                      value={modifyForm.address}
                      onChange={(e) => setModifyForm({ ...modifyForm, address: e.target.value })}
                      placeholder="Enter service address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Additional Notes</Label>
                    <Textarea
                      id="description"
                      value={modifyForm.description}
                      onChange={(e) => setModifyForm({ ...modifyForm, description: e.target.value })}
                      placeholder="Any specific requirements or details..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleModify} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Booking'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canReschedule && (
            <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  <Clock className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reschedule Booking</DialogTitle>
                  <DialogDescription>
                    Choose a new date and time for your service
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reschedule-date">New Date</Label>
                    <Input
                      id="reschedule-date"
                      type="date"
                      value={rescheduleForm.date}
                      onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reschedule-time">New Time</Label>
                    <Input
                      id="reschedule-time"
                      type="time"
                      value={rescheduleForm.time}
                      onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleReschedule} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rescheduling...
                      </>
                    ) : (
                      'Reschedule Booking'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canCancel && (
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <X className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Cancel Booking</span>
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Cancellation Policy</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Free cancellation up to 24 hours before the scheduled time</li>
                    <li>• 50% refund for cancellations within 24 hours</li>
                    <li>• No refund for same-day cancellations</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                    Keep Booking
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Booking'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {booking.provider && (
            <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message Provider
            </Button>
          )}
        </div>

        {/* Status Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Booking Status</h4>
          <p className="text-sm text-blue-700">
            Your booking is currently <strong>{booking.status.replace("_", " ").toLowerCase()}</strong>. 
            {booking.status === "PENDING" && " We're finding the best provider for your service."}
            {booking.status === "PENDING" && " The provider is reviewing your request."}
            {booking.status === "CONFIRMED" && " Your booking has been confirmed by the provider."}
            {booking.status === "IN_PROGRESS" && " The provider is currently working on your service."}
            {booking.status === "COMPLETED" && " Your service has been completed successfully."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 