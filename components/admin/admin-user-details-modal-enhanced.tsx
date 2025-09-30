"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  DollarSign, 
  ShoppingBag,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Star
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface UserDetailsModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

interface UserDetails {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  provider?: {
    id: string
    businessName?: string
    status: string
    totalBookings: number
    totalEarnings: number
    averageRating: number
  }
  bookings: Array<{
    id: string
    status: string
    totalAmount: number
    scheduledDate: string
    service: { name: string }
    provider?: { user: { name: string } }
  }>
  payments: Array<{
    id: string
    amount: number
    status: string
    currency: string
    createdAt: string
  }>
  stats: {
    totalBookings: number
    completedBookings: number
    cancelledBookings: number
    totalSpent: number
    averageBookingValue: number
  }
}

export function AdminUserDetailsModal({ userId, isOpen, onClose }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserDetails(userId)
    }
  }, [userId, isOpen])

  const fetchUserDetails = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/users/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        showToast.error('Failed to fetch user details')
        onClose()
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      showToast.error('Error fetching user details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleBadge = (role: string) => {
    const config = {
      USER: { color: 'bg-blue-100 text-blue-800', label: 'User' },
      PROVIDER: { color: 'bg-purple-100 text-purple-800', label: 'Provider' },
      ADMIN: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      CLIENT: { color: 'bg-green-100 text-green-800', label: 'Client' }
    }
    const roleConfig = config[role as keyof typeof config] || config.USER
    return <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      AWAITING_CONFIRMATION: { color: 'bg-orange-100 text-orange-800', label: 'Awaiting Confirmation' }
    }
    const statusConfig = config[status as keyof typeof config] || config.PENDING
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>User Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information about {user.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Full Name</div>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{user.email}</div>
                      {user.emailVerified && (
                        <Badge className="mt-1 bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{user.phone}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Role</div>
                      <div className="mt-1">{getRoleBadge(user.role)}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Account Status</div>
                      <div className="mt-1">
                        {user.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Member Since</div>
                      <div className="font-medium">{formatDate(user.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{user.stats?.totalBookings || 0}</div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{user.stats?.completedBookings || 0}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{user.stats?.cancelledBookings || 0}</div>
                    <div className="text-sm text-gray-600">Cancelled</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(user.stats?.totalSpent || 0)}</div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provider Info (if user is a provider) */}
            {user.provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Provider Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Business Name</div>
                      <div className="font-medium">{user.provider.businessName || 'Not set'}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Provider Status</div>
                      <div className="mt-1">
                        <Badge className={
                          user.provider.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          user.provider.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {user.provider.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Total Earnings</div>
                      <div className="font-medium text-green-600">{formatCurrency(user.provider.totalEarnings)}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Average Rating</div>
                      <div className="font-medium flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{user.provider.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>All bookings made by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {user.bookings && user.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {user.bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="font-medium">{booking.service.name}</div>
                            {booking.provider && (
                              <div className="text-sm text-gray-600">
                                Provider: {booking.provider.user.name}
                              </div>
                            )}
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(booking.scheduledDate)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm font-medium text-green-600">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(booking.totalAmount)}</span>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No bookings yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All payments made by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {user.payments && user.payments.length > 0 ? (
                  <div className="space-y-3">
                    {user.payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-lg font-medium text-green-600">
                              <CreditCard className="w-5 h-5" />
                              <span>{formatCurrency(payment.amount)}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDateTime(payment.createdAt)}
                            </div>
                            <Badge variant="outline">{payment.currency}</Badge>
                          </div>
                          <div>
                            <Badge className={
                              payment.status === 'COMPLETED' || payment.status === 'RELEASED' ? 'bg-green-100 text-green-800' :
                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No payments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>User account activity and timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Account Created</div>
                      <div className="text-sm text-gray-600">{formatDate(user.createdAt)}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Last Updated</div>
                      <div className="text-sm text-gray-600">{formatDate(user.updatedAt)}</div>
                    </div>
                  </div>

                  {user.emailVerified && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">Email Verified</div>
                        <div className="text-sm text-gray-600">Account email is verified</div>
                      </div>
                    </div>
                  )}

                  {user.stats && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{user.stats.totalBookings}</div>
                        <div className="text-sm text-gray-600">Lifetime Bookings</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(user.stats.totalSpent)}</div>
                        <div className="text-sm text-gray-600">Lifetime Spending</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
