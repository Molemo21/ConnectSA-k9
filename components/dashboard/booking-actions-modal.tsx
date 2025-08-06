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
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { showToast, handleApiError } from "@/lib/toast"
import { processPayment, handlePaymentResult } from "@/lib/payment-utils"

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
  const canDispute = ["IN_PROGRESS", "COMPLETED"].includes(booking.status)
  const canPay = booking.status === "CONFIRMED" && !booking.payment
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
          
        case "pay":
          // Use shared payment utility
          const result = await processPayment(booking.id)
          const success = handlePaymentResult(result, onUpdate, booking.id)
          if (success) {
            // Refresh the page or trigger a re-fetch to update the payment state
            window.location.reload() // Simple solution for now
          }
          return // Exit early for payment
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800"
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />
      case "CONFIRMED":
        return <Calendar className="w-4 h-4" />
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />
      case "CANCELLED":
        return <X className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
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
                  {new Date(booking.scheduledDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {new Date(booking.scheduledDate).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{booking.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">R{booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(booking.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(booking.status)}
                  <span>{booking.status.replace('_', ' ')}</span>
                </div>
              </Badge>
              {booking.provider && (
                <span className="text-sm text-gray-600">
                  Provider: {booking.provider.businessName}
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
          
          {canPay && (
            <Button
              variant="outline"
              onClick={() => setActiveAction("pay")}
              className="flex items-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Now</span>
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
                Choose a new date and time for your booking
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
                  min={new Date().toISOString().split('T')[0]}
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  New time must be at least 2 hours from now
                </AlertDescription>
              </Alert>
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

        {activeAction === "pay" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">Payment</CardTitle>
              <CardDescription>
                Complete payment for your booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Service Amount:</span>
                  <span className="font-medium">R{booking.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Platform Fee:</span>
                  <span className="font-medium">R{(booking.totalAmount * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">R{(booking.totalAmount * 1.1).toFixed(2)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleAction("pay")}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Pay Now"}
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
                    <p>Provider: {booking.provider.user.name}</p>
                    <p>Phone: {booking.provider.user.phone}</p>
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