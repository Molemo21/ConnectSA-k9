"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  AlertTriangle, 
  Edit, 
  X, 
  RefreshCw,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { showToast, handleApiError } from "@/lib/toast"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatSADate, formatSATime } from '@/lib/date-utils'
import { formatBookingPrice } from '@/lib/price-utils'


interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  provider?: {
    businessName: string
    user: {
      name: string
      phone: string
    }
  }
  scheduledDate: string
  duration: number
  totalAmount: number
  status: string
  address: string
  description?: string
  // Catalogue pricing fields (for accurate price display)
  bookedPrice?: number | null
  bookedCurrency?: string | null
  catalogueItemId?: string | null
  payment?: {
    status: string
    amount: number
  }
}

interface BookingActionsModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onUpdate: (bookingId: string, updates: any) => void
}

export function BookingActionsModal({ 
  booking, 
  isOpen, 
  onClose, 
  onUpdate 
}: BookingActionsModalProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    newDate: "",
    newTime: "",
    newAddress: booking.address,
    newDescription: booking.description || "",
    disputeReason: "",
    disputeDetails: ""
  })
  const { toast } = useToast()

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  const canModify = ["PENDING"].includes(booking.status)
  const canReschedule = ["CONFIRMED"].includes(booking.status)
  const canDispute = ["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(booking.status)
  const canConfirmCompletion = (booking.status === "AWAITING_CONFIRMATION") || 
    (booking.status === "COMPLETED" && booking.payment && ["ESCROW", "HELD_IN_ESCROW"].includes(booking.payment.status))
  const hasPayment = booking.payment // Only check payment flag, not status

  const handleAction = async (action: string) => {
    setLoading(true)
    try {
      let response
      
      switch (action) {
        case "cancel":
          response = await fetch(`/api/book-service/${booking.id}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          })
          break
          
        case "modify":
          response = await fetch(`/api/book-service/${booking.id}/modify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: formData.newAddress,
              description: formData.newDescription
            })
          })
          break
          
        case "reschedule":
          response = await fetch(`/api/book-service/${booking.id}/reschedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: formData.newDate,
              time: formData.newTime
            })
          })
          break
          
        case "dispute":
          response = await fetch(`/api/book-service/${booking.id}/dispute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: formData.disputeReason,
              details: formData.disputeDetails
            })
          })
          break
          
        case "confirm":
          response = await fetch(`/api/book-service/${booking.id}/release-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          })
          break
          
        case "message":
          // Message action doesn't need API call, just close modal
          onClose()
          return // Exit early for message
      }
      
      if (response?.ok) {
        const data = await response.json()
        showToast.success(data.message || `${action} completed successfully`)
        onUpdate(booking.id, { status: data.booking?.status || booking.status })
        onClose()
      } else {
        await handleApiError(response!, `Failed to ${action} booking`)
      }
    } catch (error) {
      console.error(`${action} booking error:`, error)
      showToast.error(`Network error. Please try again.`)
    } finally {
      setLoading(false)
    }
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>Booking Actions</span>
          </DialogTitle>
          <DialogDescription>
            Manage your booking: {booking.service.name}
          </DialogDescription>
        </DialogHeader>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{booking.service.name}</CardTitle>
            <CardDescription>{booking.service.category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatSADate(booking.scheduledDate)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatSATime(booking.scheduledDate)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{booking.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{formatBookingPrice(booking)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <StatusBadge 
                status={booking.status} 
                type="booking" 
                size="sm"
              />
              {booking.provider && (
                <span className="text-sm text-gray-600">
                  Provider: {booking.provider.businessName || booking.provider.user?.name || 'N/A'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setActiveAction("cancel")}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
          )}
          
          {canModify && (
            <Button
              variant="outline"
              onClick={() => setActiveAction("modify")}
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Modify</span>
            </Button>
          )}
          
          {canReschedule && (
            <Button
              variant="outline"
              onClick={() => setActiveAction("reschedule")}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reschedule</span>
            </Button>
          )}
          
          {canConfirmCompletion && (
            <Button
              variant="outline"
              onClick={() => setActiveAction("confirm")}
              className="flex items-center space-x-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Completion</span>
            </Button>
          )}
          
          {canDispute && (
            <Button
              variant="outline"
              onClick={() => setActiveAction("dispute")}
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Dispute</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setActiveAction("message")}
            className="flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </Button>
        </div>

        {/* Action Forms */}
        {activeAction === "cancel" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Cancel Booking</CardTitle>
              <CardDescription>
                Are you sure you want to cancel this booking? Cancellation fees may apply.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cancellation fees: 50% if cancelled within 24 hours, 25% if cancelled within 48 hours
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Keep Booking
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleAction("cancel")}
                  disabled={loading}
                >
                  {loading ? "Cancelling..." : "Cancel Booking"}
                </Button>
              </DialogFooter>
            </CardContent>
          </Card>
        )}

        {activeAction === "modify" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modify Booking</CardTitle>
              <CardDescription>
                Update the address or description of your booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-address">New Address</Label>
                <Input
                  id="new-address"
                  value={formData.newAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, newAddress: e.target.value }))}
                  placeholder="Enter new address"
                />
              </div>
              <div>
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={formData.newDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, newDescription: e.target.value }))}
                  placeholder="Update booking description"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAction("modify")}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Booking"}
                </Button>
              </DialogFooter>
            </CardContent>
          </Card>
        )}

        {activeAction === "reschedule" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reschedule Booking</CardTitle>
              <CardDescription>
                Change the date and time of your booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-date">New Date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={formData.newDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, newDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-time">New Time</Label>
                <Input
                  id="new-time"
                  type="time"
                  value={formData.newTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, newTime: e.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAction("reschedule")}
                  disabled={loading || !formData.newDate || !formData.newTime}
                >
                  {loading ? "Rescheduling..." : "Reschedule Booking"}
                </Button>
              </DialogFooter>
            </CardContent>
          </Card>
        )}

        {activeAction === "confirm" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-orange-600">Confirm Job Completion</CardTitle>
              <CardDescription>
                Confirm that the service has been completed to release payment to the provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  The provider has marked this job as complete. By confirming, you agree that:
                </p>
                <ul className="mt-2 text-sm text-orange-700 list-disc list-inside space-y-1">
                  <li>The service was performed as agreed</li>
                  <li>The work meets your expectations</li>
                  <li>Payment will be released to the provider</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleAction("confirm")}
                  disabled={loading}
                >
                  {loading ? "Confirming..." : "Confirm Completion"}
                </Button>
              </DialogFooter>
            </CardContent>
          </Card>
        )}

        {activeAction === "dispute" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-orange-600">Report Dispute</CardTitle>
              <CardDescription>
                Report an issue with your booking or service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dispute-reason">Reason</Label>
                <Select 
                  value={formData.disputeReason} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, disputeReason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service_not_provided">Service not provided</SelectItem>
                    <SelectItem value="poor_quality">Poor quality service</SelectItem>
                    <SelectItem value="wrong_time">Provider arrived at wrong time</SelectItem>
                    <SelectItem value="damage">Property damage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dispute-details">Details</Label>
                <Textarea
                  id="dispute-details"
                  value={formData.disputeDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, disputeDetails: e.target.value }))}
                  placeholder="Provide detailed description of the issue"
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleAction("dispute")}
                  disabled={loading || !formData.disputeReason || !formData.disputeDetails}
                >
                  {loading ? "Submitting..." : "Submit Dispute"}
                </Button>
              </DialogFooter>
            </CardContent>
          </Card>
        )}



        {activeAction === "message" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Provider</CardTitle>
              <CardDescription>
                Send a message to your service provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Messaging feature will be available soon. For now, you can contact your provider directly.
                </p>
                {booking.provider && (
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Provider: {booking.provider.user?.name || 'N/A'}</p>
                    {booking.provider.user?.phone && (
                      <p>Phone: {booking.provider.user.phone}</p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Close
                </Button>
              </DialogFooter>
            </CardContent>
          </Card>
        )}

        {/* Close Button */}
        {!activeAction && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
} 