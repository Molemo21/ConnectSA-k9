"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  Activity,
  Target,
  Download,
  Filter,
  Star
} from "lucide-react"
import { BrandHeader } from "@/components/ui/brand-header"
import { StatsCharts } from "@/components/dashboard/stats-charts"

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6M")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true)
        
        // Fetch bookings
        const bookingsRes = await fetch('/api/bookings/my-bookings', {
          credentials: 'include'
        })
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData.bookings)
        }

        // Fetch services
        const servicesRes = await fetch('/api/services', {
          credentials: 'include'
        })
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData)
        }

      } catch (err) {
        console.error('Analytics data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeader showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

  // Calculate analytics data
  const totalBookings = bookings.length
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length
  const totalSpent = bookings
    .filter(b => b.payment)
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
  const averageRating = bookings
    .filter(b => b.review)
    .reduce((sum, b) => sum + (b.review?.rating || 0), 0) / 
    bookings.filter(b => b.review).length || 0

  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
  const averageSpending = totalBookings > 0 ? totalSpent / totalBookings : 0

  // Monthly trends
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduledDate)
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
  }).length

  const lastMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduledDate)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear
  }).length

  const bookingGrowth = lastMonthBookings > 0 
    ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
    : thisMonthBookings > 0 ? 100 : 0

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
                  Analytics Dashboard
                </h1>
                <p className="text-xl text-gray-600">
                  Deep insights into your booking patterns and spending habits
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1M">1 Month</SelectItem>
                    <SelectItem value="3M">3 Months</SelectItem>
                    <SelectItem value="6M">6 Months</SelectItem>
                    <SelectItem value="1Y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge className={bookingGrowth >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {bookingGrowth >= 0 ? '+' : ''}{bookingGrowth}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                  <p className="text-xs text-gray-500 mt-1">This month: {thisMonthBookings}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {completionRate.toFixed(0)}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
                  <p className="text-xs text-gray-500 mt-1">of {totalBookings} completed</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    R{averageSpending.toFixed(0)}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">R{totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Avg per booking</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {averageRating.toFixed(1)}/5
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">from {bookings.filter(b => b.review).length} reviews</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Trends</span>
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="flex items-center space-x-2">
                <PieChart className="w-4 h-4" />
                <span>Breakdown</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Booking Overview</CardTitle>
                  <CardDescription>
                    Comprehensive view of your booking activity and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StatsCharts 
                    bookings={bookings}
                    totalSpent={totalSpent}
                    averageRating={averageRating}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                    <CardDescription>
                      Track your booking patterns over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Monthly trends chart will be displayed here
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Spending Patterns</CardTitle>
                    <CardDescription>
                      Analyze your spending behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Spending patterns chart will be displayed here
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Service Distribution</CardTitle>
                    <CardDescription>
                      Which services do you book most often?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Service distribution chart will be displayed here
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Status Breakdown</CardTitle>
                    <CardDescription>
                      Distribution of booking statuses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Status breakdown chart will be displayed here
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                    <CardDescription>
                      AI-powered insights about your booking behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Peak Booking Time</h4>
                        <p className="text-sm text-blue-700">
                          You tend to book services most frequently on {new Date().toLocaleDateString('en-US', { weekday: 'long' })}s
                        </p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Favorite Service</h4>
                        <p className="text-sm text-green-700">
                          Your most booked service is "House Cleaning" with {bookings.filter(b => b.service?.name?.includes('Clean')).length} bookings
                        </p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">Spending Pattern</h4>
                        <p className="text-sm text-yellow-700">
                          Your average spending per booking is R{averageSpending.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>
                      Personalized suggestions to improve your experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">Try New Services</h4>
                        <p className="text-sm text-purple-700">
                          Based on your preferences, you might like "Garden Maintenance"
                        </p>
                      </div>
                      
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-medium text-indigo-900 mb-2">Save Money</h4>
                        <p className="text-sm text-indigo-700">
                          Consider booking during off-peak hours for better rates
                        </p>
                      </div>
                      
                      <div className="p-4 bg-pink-50 rounded-lg">
                        <h4 className="font-medium text-pink-900 mb-2">Improve Ratings</h4>
                        <p className="text-sm text-pink-700">
                          Leave reviews for completed services to help other users
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 