"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Briefcase,
  Shield,
  CreditCard,
  FileText,
  Star,
  Loader2,
  Calendar
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface ProviderDetails {
  id: string
  businessName?: string
  description?: string
  experience?: number
  hourlyRate?: number
  location?: string
  idDocument?: string
  proofOfAddress?: string
  certifications: string[]
  profileImages: string[]
  status: string
  available?: boolean
  bankName?: string
  bankCode?: string
  accountNumber?: string
  accountName?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    emailVerified: boolean
    createdAt: string
  }
  services: Array<{
    id: string
    service: {
      id: string
      name: string
      category: string
    }
    customRate?: number
  }>
  providerReviews: Array<{
    id: string
    comment: string
    status: string
    createdAt: string
  }>
}

interface ProviderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  providerId: string | null
  onStatusUpdate: (providerId: string, newStatus: string) => void
}

export function ProviderDetailsModal({ 
  isOpen, 
  onClose, 
  providerId, 
  onStatusUpdate 
}: ProviderDetailsModalProps) {
  const [provider, setProvider] = useState<ProviderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [documentUrls, setDocumentUrls] = useState<{
    idDocument?: string[];
    proofOfAddress?: string[];
    certifications: string[];
    profileImages: string[];
  } | null>(null)
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  useEffect(() => {
    if (isOpen && providerId) {
      fetchProviderDetails()
      fetchDocumentUrls()
    }
  }, [isOpen, providerId])

  const fetchProviderDetails = async () => {
    if (!providerId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/providers/${providerId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProvider(data)
        // Set existing comment if available
        if (data.providerReviews && data.providerReviews.length > 0) {
          setComment(data.providerReviews[0].comment || "")
        }
      } else {
        showToast.error('Failed to fetch provider details')
      }
    } catch (error) {
      console.error('Error fetching provider details:', error)
      showToast.error('Error fetching provider details')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentUrls = async () => {
    if (!providerId) return

    try {
      setLoadingDocuments(true)
      const response = await fetch(`/api/admin/providers/${providerId}/documents`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.documents) {
          setDocumentUrls(data.documents)
        }
      } else {
        // If documents don't exist yet, that's okay - just set empty state
        setDocumentUrls({
          idDocument: [],
          proofOfAddress: [],
          certifications: [],
          profileImages: [],
        })
      }
    } catch (error) {
      console.error('Error fetching document URLs:', error)
      // Don't show error toast - documents might not exist yet
      setDocumentUrls({
        idDocument: [],
        proofOfAddress: [],
        certifications: [],
        profileImages: [],
      })
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!providerId) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comment: comment.trim()
        })
      })

      if (response.ok) {
        const updatedProvider = await response.json()
        setProvider(prev => prev ? { ...prev, status: newStatus } : null)
        onStatusUpdate(providerId, newStatus)
        
        const statusMessage = newStatus === 'APPROVED' ? 'Provider approved successfully' : 
                            newStatus === 'REJECTED' ? 'Provider rejected' : 
                            'Provider status updated successfully'
        showToast.success(statusMessage)
        onClose()
      } else {
        const errorData = await response.json()
        showToast.error(errorData.error || 'Failed to update provider status')
      }
    } catch (error) {
      console.error('Error updating provider status:', error)
      showToast.error('Error updating provider status')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-orange-100 text-orange-800", icon: Clock },
      APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
      SUSPENDED: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      INCOMPLETE: { color: "bg-gray-100 text-gray-800", icon: Clock }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            Provider Details
            {provider && getStatusBadge(provider.status)}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading provider details...</span>
          </div>
        ) : provider ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-sm">{provider.businessName || provider.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm">{provider.user.email}</p>
                      {provider.user.emailVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm">{provider.user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-sm">{provider.location || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Hourly Rate</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <p className="text-sm">R{provider.hourlyRate || 0}/hour</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience</label>
                    <p className="text-sm">{provider.experience || 0} years</p>
                  </div>
                </div>
                {provider.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-sm mt-1">{provider.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Services Offered
                </CardTitle>
              </CardHeader>
              <CardContent>
                {provider.services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {provider.services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-3">
                        <h4 className="font-medium">{service.service.name}</h4>
                        <p className="text-sm text-gray-600">{service.service.category}</p>
                        {service.customRate && (
                          <p className="text-sm text-green-600">R{service.customRate}/hour</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No services added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Verification Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Verification Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading documents...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">ID Document:</span>
                          <Badge variant={documentUrls?.idDocument && documentUrls.idDocument.length > 0 ? "default" : "secondary"}>
                            {documentUrls?.idDocument && documentUrls.idDocument.length > 0 ? "Uploaded" : "Missing"}
                          </Badge>
                        </div>
                        {documentUrls?.idDocument && documentUrls.idDocument.length > 0 && (
                          <div className="space-y-2">
                            {documentUrls.idDocument.map((url, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  View ID Document {documentUrls.idDocument.length > 1 ? `#${index + 1}` : ''}
                                </a>
                                {url.match(/\.(jpg|jpeg|png|gif|webp)/i) && (
                                  <img src={url} alt={`ID Document ${index + 1}`} className="max-h-20 rounded border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Proof of Address:</span>
                          <Badge variant={documentUrls?.proofOfAddress && documentUrls.proofOfAddress.length > 0 ? "default" : "secondary"}>
                            {documentUrls?.proofOfAddress && documentUrls.proofOfAddress.length > 0 ? "Uploaded" : "Missing"}
                          </Badge>
                        </div>
                        {documentUrls?.proofOfAddress && documentUrls.proofOfAddress.length > 0 && (
                          <div className="space-y-2">
                            {documentUrls.proofOfAddress.map((url, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  View Proof of Address {documentUrls.proofOfAddress.length > 1 ? `#${index + 1}` : ''}
                                </a>
                                {url.match(/\.(jpg|jpeg|png|gif|webp)/i) && (
                                  <img src={url} alt={`Proof of Address ${index + 1}`} className="max-h-20 rounded border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {documentUrls?.certifications && documentUrls.certifications.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Certifications ({documentUrls.certifications.length})</label>
                        <div className="mt-2 space-y-2">
                          {documentUrls.certifications.map((url, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                View Certification {documentUrls.certifications.length > 1 ? `#${index + 1}` : ''}
                              </a>
                              {url.match(/\.(jpg|jpeg|png|gif|webp)/i) && (
                                <img src={url} alt={`Certification ${index + 1}`} className="max-h-20 rounded border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {documentUrls?.profileImages && documentUrls.profileImages.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Profile Images ({documentUrls.profileImages.length})</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {documentUrls.profileImages.map((url, index) => (
                            <div key={index} className="relative">
                              <img
                                src={url}
                                alt={`Profile Image ${index + 1}`}
                                className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() => window.open(url, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {provider.bankName ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bank Name</label>
                      <p className="text-sm">{provider.bankName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Name</label>
                      <p className="text-sm">{provider.accountName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Number</label>
                      <p className="text-sm font-mono">{provider.accountNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bank Code</label>
                      <p className="text-sm">{provider.bankCode}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Bank details not provided</p>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Member Since</label>
                    <p className="text-sm">{formatDate(provider.user.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-sm">{formatDate(provider.updatedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Availability</label>
                    <Badge variant={provider.available ? "default" : "secondary"}>
                      {provider.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Comment */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Comment</CardTitle>
                <CardDescription>
                  Add a comment for your approval/rejection decision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load provider details
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={actionLoading}>
            Close
          </Button>
          {provider && provider.status === 'PENDING' && (
            <>
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate('REJECTED')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject
              </Button>
              <Button
                onClick={() => handleStatusUpdate('APPROVED')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
