"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  Star,
  DollarSign,
  AlertCircle,
  Filter,
  Search
} from "lucide-react"

export default function ViewBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: filterStatus,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      const response = await fetch(`/api/admin/bookings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch bookings:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [filterStatus, pagination.page])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchBookings()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Bookings are already filtered on the server side

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-lg">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandHeaderClient showUserMenu={true} />
      
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar activeSection="view-bookings" />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">View Bookings</h1>
            <p className="text-gray-600">Monitor and manage all platform bookings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bookings.filter(b => b.status === "COMPLETED").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bookings.filter(b => b.status === "IN_PROGRESS").length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R{bookings.filter(b => b.status === "COMPLETED").reduce((sum, b) => sum + b.price, 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search bookings by client, provider, or service..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No bookings found.</p>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.service}
                        </h3>
                        {getStatusBadge(booking.status)}
                        <span className="text-sm text-gray-500">
                          #{booking.id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{booking.clientName}</span>
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <Mail className="w-4 h-4 inline mr-2" />
                            {booking.clientEmail}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Phone className="w-4 h-4 inline mr-2" />
                            {booking.clientPhone}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Provider Information</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{booking.providerName}</span>
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <Mail className="w-4 h-4 inline mr-2" />
                            {booking.providerEmail}
                          </p>
                          {booking.rating > 0 && (
                            <p className="text-sm text-gray-600">
                              <Star className="w-4 h-4 inline mr-2" />
                              {booking.rating}★
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Service Details</h4>
                        <p className="text-sm text-gray-600 mb-2">{booking.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-600">Scheduled Date</p>
                            <p className="text-gray-900">
                              {new Date(booking.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Duration</p>
                            <p className="text-gray-900">{booking.duration}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Price</p>
                            <p className="text-gray-900">R{booking.price}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                        <p className="text-sm text-gray-600">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          {booking.address}, {booking.location}
                        </p>
                      </div>
                      
                      {booking.review && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Client Review</h4>
                          <p className="text-sm text-gray-600 italic">"{booking.review}"</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {booking.status === "PENDING" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}
                      
                      {booking.status === "IN_PROGRESS" && (
                        <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Monitor
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
