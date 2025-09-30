"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertTriangle,
  User,
  MapPin,
  Phone,
  Mail
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface BookingData {
  id: string
  clientName: string
  clientEmail: string
  providerName: string
  providerEmail: string
  serviceName: string
  status: string
  totalAmount: number
  createdAt: Date
  scheduledDate?: Date
  location?: string
  notes?: string
}

interface BookingManagementProps {
  onBookingSelect?: (booking: BookingData) => void
  onStatsUpdate?: () => void
}

export function AdminBookingManagementEnhanced({ onBookingSelect, onStatsUpdate }: BookingManagementProps) {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchBookings = async (page: number = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter
      })

      const response = await fetch(`/api/admin/bookings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
        setTotalBookings(data.totalCount || 0)
        setTotalPages(data.totalPages || 1)
        setCurrentPage(page)
      } else {
        showToast.error('Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      showToast.error('Error fetching bookings')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBookings(currentPage)
  }, [searchTerm, statusFilter])

  const handleBookingAction = async (bookingId: string, action: string) => {
    try {
      setActionLoading(bookingId)
      
      let message = ''
      let body: any = {
        bookingId,
        action,
        data: {}
      }

      // Handle different action types
      switch (action) {
        case 'complete':
          message = 'Booking completed successfully'
          body.data = { action: 'complete' }
          break
          
        case 'cancel':
          message = 'Booking cancelled'
          body.data = { action: 'cancel' }
          break
          
        case 'reschedule':
          message = 'Booking rescheduled'
          body.data = { action: 'reschedule' }
          break
          
        default:
          message = 'Action completed'
      }
      
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        showToast.success(result.message || message)
        await fetchBookings(currentPage)
        // Refresh admin stats to update sidebar counts
        onStatsUpdate?.()
      } else {
        const error = await response.json()
        showToast.error(error.message || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing booking action:', error)
      showToast.error('Error performing action')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      'CONFIRMED': { color: 'bg-blue-100 text-blue-800', label: 'Confirmed', icon: CheckCircle },
      'COMPLETED': { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
      'CANCELLED': { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
      'IN_PROGRESS': { color: 'bg-purple-100 text-purple-800', label: 'In Progress', icon: Clock }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getActionButtons = (booking: BookingData) => {
    const buttons = []

    if (booking.status === 'PENDING') {
      buttons.push(
        <Button
          key="confirm"
          variant="outline"
          size="sm"
          onClick={() => handleBookingAction(booking.id, 'confirm')}
          disabled={actionLoading === booking.id}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Confirm
        </Button>
      )
      buttons.push(
        <Button
          key="cancel"
          variant="outline"
          size="sm"
          onClick={() => handleBookingAction(booking.id, 'cancel')}
          disabled={actionLoading === booking.id}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      )
    }

    if (booking.status === 'CONFIRMED') {
      buttons.push(
        <Button
          key="complete"
          variant="outline"
          size="sm"
          onClick={() => handleBookingAction(booking.id, 'complete')}
          disabled={actionLoading === booking.id}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Complete
        </Button>
      )
    }

    return buttons
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBookingId(booking.id)
    setIsDetailsModalOpen(true)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBookings(currentPage)
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Booking Management</span>
              </CardTitle>
              <CardDescription>
                Manage bookings, confirmations, and completions. Total bookings: {totalBookings}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search bookings by client, provider, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings Table */}
          {bookings.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No bookings found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.clientName}</div>
                          <div className="text-sm text-gray-500">{booking.clientEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.providerName}</div>
                          <div className="text-sm text-gray-500">{booking.providerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{booking.serviceName}</div>
                        {booking.location && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {booking.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatCurrency(booking.totalAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Created: {formatDate(booking.createdAt)}</div>
                          {booking.scheduledDate && (
                            <div className="text-gray-500">
                              Scheduled: {formatDate(booking.scheduledDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                            className="h-8 w-8 p-0"
                            title="View booking details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <div className="flex space-x-1">
                            {getActionButtons(booking)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalBookings)} of {totalBookings} bookings
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal - Placeholder for future implementation */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
            <p className="text-gray-600 mb-4">Detailed booking information will be displayed here.</p>
            <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </>
  )
}
