"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Image, 
  CreditCard, 
  User, 
  MapPin, 
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Building
} from "lucide-react"

interface ProviderWithUser {
  id: string
  businessName: string | null
  description: string | null
  experience: number | null
  hourlyRate: number | null
  location: string | null
  status: string
  idDocument: string | null
  proofOfAddress: string | null
  certifications: string[]
  profileImages: string[]
  bankName: string | null
  bankCode: string | null
  accountNumber: string | null
  accountName: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    emailVerified: boolean
    createdAt: string
  }
  services: Array<{
    service: {
      id: string
      name: string
      category: string
    }
  }>
}

interface EnhancedProviderReviewProps {
  provider: ProviderWithUser
  onStatusChange: (providerId: string, status: string, comment: string) => void
  isLoading?: boolean
}

export function EnhancedProviderReview({ provider, onStatusChange, isLoading = false }: EnhancedProviderReviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setIsOpen(true)
  }

  const confirmStatusChange = () => {
    onStatusChange(provider.id, selectedStatus, comment)
    setIsOpen(false)
    setComment("")
    setSelectedStatus("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      case "SUSPENDED": return "bg-orange-100 text-orange-800"
      case "INCOMPLETE": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCompletionPercentage = () => {
    const requiredFields = [
      provider.businessName,
      provider.description,
      provider.experience,
      provider.hourlyRate,
      provider.location,
      provider.idDocument,
      provider.proofOfAddress,
      provider.bankName,
      provider.bankCode,
      provider.accountNumber,
      provider.accountName,
      provider.services.length > 0
    ]
    
    const completedFields = requiredFields.filter(Boolean).length
    return Math.round((completedFields / requiredFields.length) * 100)
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>{provider.user.name}</span>
              </CardTitle>
              <p className="text-sm text-gray-600">{provider.user.email}</p>
            </div>
            <Badge className={getStatusColor(provider.status)}>
              {provider.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Profile Completion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Profile Completion</Label>
              <span className="text-sm text-gray-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Business Information</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Business Name:</span>
                <p className="text-gray-600">{provider.businessName || "Not provided"}</p>
              </div>
              <div>
                <span className="font-medium">Experience:</span>
                <p className="text-gray-600">{provider.experience ? `${provider.experience} years` : "Not provided"}</p>
              </div>
              <div>
                <span className="font-medium">Hourly Rate:</span>
                <p className="text-gray-600">{provider.hourlyRate ? `R${provider.hourlyRate}/hour` : "Not provided"}</p>
              </div>
              <div>
                <span className="font-medium">Location:</span>
                <p className="text-gray-600">{provider.location || "Not provided"}</p>
              </div>
            </div>
            {provider.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-gray-600 mt-1">{provider.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Services Offered</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {provider.services.map((service) => (
                <Badge key={service.service.id} variant="secondary">
                  {service.service.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Documents */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Document Verification</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                {provider.idDocument ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">ID Document</span>
              </div>
              <div className="flex items-center space-x-2">
                {provider.proofOfAddress ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">Proof of Address</span>
              </div>
              <div className="flex items-center space-x-2">
                {provider.certifications.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">Certifications ({provider.certifications.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                {provider.profileImages.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">Profile Images ({provider.profileImages.length})</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bank Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Banking Information</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Bank:</span>
                <p className="text-gray-600">{provider.bankName || "Not provided"}</p>
              </div>
              <div>
                <span className="font-medium">Account Name:</span>
                <p className="text-gray-600">{provider.accountName || "Not provided"}</p>
              </div>
              <div>
                <span className="font-medium">Account Number:</span>
                <p className="text-gray-600">
                  {provider.accountNumber ? `****${provider.accountNumber.slice(-4)}` : "Not provided"}
                </p>
              </div>
              <div>
                <span className="font-medium">Bank Code:</span>
                <p className="text-gray-600">{provider.bankCode || "Not provided"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Contact Information</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{provider.user.email}</span>
                {provider.user.emailVerified ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              {provider.user.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{provider.user.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Joined: {new Date(provider.user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {provider.status === "PENDING" && (
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => handleStatusChange("APPROVED")}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </Button>
              <Button
                onClick={() => handleStatusChange("REJECTED")}
                variant="destructive"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </Button>
              <Button
                onClick={() => handleStatusChange("SUSPENDED")}
                variant="outline"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Suspend</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === "APPROVED" && "Approve Provider"}
              {selectedStatus === "REJECTED" && "Reject Provider"}
              {selectedStatus === "SUSPENDED" && "Suspend Provider"}
            </DialogTitle>
            <DialogDescription>
              {selectedStatus === "APPROVED" && "This will approve the provider and allow them to receive bookings."}
              {selectedStatus === "REJECTED" && "This will reject the provider application. They can reapply with improvements."}
              {selectedStatus === "SUSPENDED" && "This will temporarily suspend the provider's account."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment (Required)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  selectedStatus === "APPROVED" 
                    ? "Add any notes about the approval..."
                    : selectedStatus === "REJECTED"
                    ? "Explain what needs to be improved..."
                    : "Explain the reason for suspension..."
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={!comment.trim() || isLoading}
              variant={selectedStatus === "REJECTED" ? "destructive" : "default"}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
