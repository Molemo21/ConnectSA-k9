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
  Briefcase, 
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
  Star,
  MapPin,
  Award,
  TrendingUp,
  FileText
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface ProviderDetailsModalProps {
  providerId: string | null
  isOpen: boolean
  onClose: () => void
}

interface ProviderDetails {
  id: string
  userId: string
  businessName?: string
  description?: string
  experience?: number
  hourlyRate?: number
  location?: string
  status: string
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
    phone?: string
    emailVerified: boolean
  }
  services: Array<{
    id: string
    customRate?: number
    service: {
      name: string
      category: string
    }
  }>
  bookings: Array<{
    id: string
    status: string
    totalAmount: number
    scheduledDate: string
    service: { name: string }
    client: { name: string }
  }>
  payouts: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
  }>
  reviews: Array<{
    id: string
    rating: number
    comment?: string
    createdAt: string
  }>
  stats: {
    totalBookings: number
    completedBookings: number
    totalEarnings: number
    averageRating: number
    totalReviews: number
  }
}

export function AdminProviderDetailsModal({ providerId, isOpen, onClose }: ProviderDetailsModalProps) {
  const [provider, setProvider] = useState<ProviderDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (providerId && isOpen) {
      fetchProviderDetails(providerId)
    }
  }, [providerId, isOpen])

  const fetchProviderDetails = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/providers/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setProvider(data)
      } else {
        showToast.error('Failed to fetch provider details')
        onClose()
      }
    } catch (error) {
      console.error('Error fetching provider details:', error)
      showToast.error('Error fetching provider details')
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

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review', icon: Clock },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      SUSPENDED: { color: 'bg-gray-100 text-gray-800', label: 'Suspended', icon: XCircle },
      INCOMPLETE: { color: 'bg-orange-100 text-orange-800', label: 'Incomplete', icon: Clock }
    }
    const statusConfig = config[status as keyof typeof config] || config.PENDING
    const Icon = statusConfig.icon
    return (
      <Badge className={statusConfig.color}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!provider) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Provider Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information about {provider.businessName || provider.user.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Business Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Business Name</div>
                      <div className="font-medium">{provider.businessName || 'Not set'}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Contact Email</div>
                      <div className="font-medium">{provider.user.email}</div>
                      {provider.user.emailVerified && (
                        <Badge className="mt-1 bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {provider.user.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{provider.user.phone}</div>
                      </div>
                    </div>
                  )}

                  {provider.location && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium">{provider.location}</div>
                      </div>
                    </div>
                  )}

                  {provider.experience && (
                    <div className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Experience</div>
                        <div className="font-medium">{provider.experience} years</div>
                      </div>
                    </div>
                  )}

                  {provider.hourlyRate && (
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Hourly Rate</div>
                        <div className="font-medium text-green-600">{formatCurrency(provider.hourlyRate)}/hr</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Provider Status</div>
                      <div className="mt-1">{getStatusBadge(provider.status)}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Registered On</div>
                      <div className="font-medium">{formatDate(provider.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {provider.description && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500 mb-2">Business Description</div>
                    <p className="text-gray-700">{provider.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{provider.stats?.totalBookings || 0}</div>
                    <div className="text-sm text-gray-600">Total Jobs</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(provider.stats?.totalEarnings || 0)}</div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{provider.stats?.averageRating?.toFixed(1) || '0.0'}</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{provider.stats?.totalReviews || 0}</div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offered Services</CardTitle>
                <CardDescription>Services provided by this provider</CardDescription>
              </CardHeader>
              <CardContent>
                {provider.services && provider.services.length > 0 ? (
                  <div className="space-y-3">
                    {provider.services.map((ps) => (
                      <div key={ps.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{ps.service.name}</div>
                            <div className="text-sm text-gray-500">{ps.service.category}</div>
                          </div>
                          {ps.customRate && (
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Custom Rate</div>
                              <div className="font-medium text-green-600">{formatCurrency(ps.customRate)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No services added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>All jobs completed by this provider</CardDescription>
              </CardHeader>
              <CardContent>
                {provider.bookings && provider.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {provider.bookings.slice(0, 10).map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="font-medium">{booking.service.name}</div>
                            <div className="text-sm text-gray-600">
                              Client: {booking.client.name}
                            </div>
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
                            <Badge className={
                              booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {provider.bookings.length > 10 && (
                      <div className="text-center text-sm text-gray-500 pt-2">
                        Showing 10 of {provider.bookings.length} bookings
                      </div>
                    )}
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

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Earnings & Payouts</CardTitle>
                <CardDescription>Financial summary and payout history</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Earnings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(provider.stats?.totalEarnings || 0)}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Earnings</div>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-blue-600">{provider.stats?.completedBookings || 0}</div>
                    <div className="text-sm text-gray-600 mt-1">Completed Jobs</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-purple-600">
                      {provider.stats?.completedBookings ? formatCurrency((provider.stats.totalEarnings || 0) / provider.stats.completedBookings) : formatCurrency(0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Avg per Job</div>
                  </div>
                </div>

                {/* Payout History */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Payout History</h4>
                  {provider.payouts && provider.payouts.length > 0 ? (
                    <div className="space-y-2">
                      {provider.payouts.slice(0, 10).map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              payout.status === 'COMPLETED' ? 'bg-green-100' :
                              payout.status === 'PENDING' ? 'bg-yellow-100' :
                              'bg-red-100'
                            }`}>
                              <DollarSign className={`w-5 h-5 ${
                                payout.status === 'COMPLETED' ? 'text-green-600' :
                                payout.status === 'PENDING' ? 'text-yellow-600' :
                                'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium">{formatCurrency(payout.amount)}</div>
                              <div className="text-sm text-gray-500">{formatDate(payout.createdAt)}</div>
                            </div>
                          </div>
                          <Badge className={
                            payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {payout.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No payouts yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>
                  {provider.stats?.averageRating?.toFixed(1) || '0.0'} average rating from {provider.stats?.totalReviews || 0} reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                {provider.reviews && provider.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {provider.reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="font-medium ml-2">{review.rating}.0</span>
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No reviews yet</p>
                  </div>
                )}
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
