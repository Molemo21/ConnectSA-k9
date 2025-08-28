"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { BrandHeader } from "@/components/ui/brand-header"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created") // Changed from "date" to "created"

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true)
        const response = await fetch('/api/bookings/my-bookings', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setBookings(data.bookings)
          setFilteredBookings(data.bookings)
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  useEffect(() => {
    let filtered = bookings

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.provider?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // Most recent first
        case "scheduled":
          return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime() // Most recent scheduled first
        case "amount":
          return b.totalAmount - a.totalAmount
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, sortBy])

  const getStatusStats = () => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === "PENDING").length,
      confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
      completed: bookings.filter(b => b.status === "COMPLETED").length,
      cancelled: bookings.filter(b => b.status === "CANCELLED").length
    }
    return stats
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeader showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeader showAuth={false} showUserMenu={true} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  My Bookings
                </h1>
                <p className="text-xl text-gray-600">
                  Manage and track all your service bookings
                </p>
              </div>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <a href="/book-service">
                  <Plus className="w-5 h-5 mr-2" />
                  Book New Service
                </a>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Date (Newest)</SelectItem>
                      <SelectItem value="scheduled">Date (Most Recent)</SelectItem>
                      <SelectItem value="amount">Amount (High to Low)</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setSortBy("created")
                    }}
                    className="w-full"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>All Bookings ({filteredBookings.length})</span>
              </CardTitle>
              <CardDescription>
                {filteredBookings.length === bookings.length 
                  ? "Showing all your bookings" 
                  : `Showing ${filteredBookings.length} of ${bookings.length} bookings`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {bookings.length === 0 ? "No Bookings Yet" : "No Matching Bookings"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {bookings.length === 0 
                      ? "You haven't made any bookings yet. Start by exploring our services!"
                      : "Try adjusting your search or filter criteria."
                    }
                  </p>
                  {bookings.length === 0 && (
                    <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <a href="/book-service">Book Your First Service</a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredBookings.map((booking) => (
                    <EnhancedBookingCard
                      key={booking.id}
                      booking={booking}
                      onStatusChange={(bookingId, newStatus) => {
                        setBookings(prev => prev.map(b => 
                          b.id === bookingId ? { ...b, status: newStatus } : b
                        ))
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 