"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, User, Mail, Phone, Calendar, Shield, Briefcase, MessageSquare, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { UserRole } from "@prisma/client"

interface UserDetails {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  provider?: {
    id: string
    status: string
    businessName?: string
    description?: string
    hourlyRate?: number
    location?: string
    experience?: number
    services: Array<{
      service: {
        id: string
        name: string
        category: string
      }
    }>
    providerReviews: Array<{
      id: string
      comment: string
      status: string
      createdAt: string
      admin: {
        name: string
        email: string
      }
    }>
  }
  bookings: Array<{
    id: string
    status: string
    totalAmount: number
    scheduledDate: string
    provider: {
      user: {
        name: string
        email: string
      }
    }
    service: {
      name: string
    }
    payment?: {
      status: string
      amount: number
    }
  }>
  _count: {
    bookings: number
    notifications: number
  }
}

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

export function UserDetailsModal({ isOpen, onClose, userId }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
    }
  }, [isOpen, userId])

  const fetchUserDetails = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      CLIENT: { color: "bg-blue-100 text-blue-800", icon: User },
      PROVIDER: { color: "bg-green-100 text-green-800", icon: Briefcase },
      ADMIN: { color: "bg-purple-100 text-purple-800", icon: Shield },
    }

    const config = roleConfig[role]
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {role}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
      APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
      SUSPENDED: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      INCOMPLETE: { color: "bg-gray-100 text-gray-800", icon: AlertTriangle },
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

  const getBookingStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-orange-100 text-orange-800" },
      CONFIRMED: { color: "bg-blue-100 text-blue-800" },
      COMPLETED: { color: "bg-green-100 text-green-800" },
      CANCELLED: { color: "bg-red-100 text-red-800" },
      DISPUTED: { color: "bg-yellow-100 text-yellow-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <Badge className={config.color}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Loading user details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">User not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-6 h-6" />
            {user.name}
            {getRoleBadge(user.role)}
            {user.isActive ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                Suspended
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-800 mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Joined</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Activity</p>
                    <p className="text-sm text-gray-600">
                      {user._count.bookings} bookings, {user._count.notifications} notifications
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Information */}
          {user.provider && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Provider Information
                  {getStatusBadge(user.provider.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Business Name</p>
                    <p className="text-sm text-gray-600">{user.provider.businessName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Hourly Rate</p>
                    <p className="text-sm text-gray-600">
                      {user.provider.hourlyRate ? `R${user.provider.hourlyRate}/hour` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-gray-600">{user.provider.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Experience</p>
                    <p className="text-sm text-gray-600">
                      {user.provider.experience ? `${user.provider.experience} years` : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                {user.provider.description && (
                  <div>
                    <p className="font-medium">Description</p>
                    <p className="text-sm text-gray-600">{user.provider.description}</p>
                  </div>
                )}

                {user.provider.services.length > 0 && (
                  <div>
                    <p className="font-medium">Services</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.provider.services.map((service) => (
                        <Badge key={service.service.id} variant="outline">
                          {service.service.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.provider.providerReviews.length > 0 && (
                  <div>
                    <p className="font-medium">Admin Reviews</p>
                    <div className="space-y-3 mt-2">
                      {user.provider.providerReviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{review.admin.name}</span>
                            {getStatusBadge(review.status)}
                          </div>
                          <p className="text-sm text-gray-600">{review.comment}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Bookings */}
          {user.bookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings ({user._count.bookings})</CardTitle>
                <CardDescription>Last 10 bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{booking.service.name}</span>
                        {getBookingStatusBadge(booking.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Provider:</strong> {booking.provider.user.name}</p>
                        <p><strong>Date:</strong> {new Date(booking.scheduledDate).toLocaleDateString()}</p>
                        <p><strong>Amount:</strong> R{booking.totalAmount}</p>
                        {booking.payment && (
                          <p><strong>Payment:</strong> {booking.payment.status}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
