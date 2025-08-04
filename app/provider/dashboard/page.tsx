import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderServer } from "@/components/ui/brand-header-server"
import { Star, Calendar, Clock, DollarSign, TrendingUp, CheckCircle, AlertCircle, Play, Users, MapPin } from "lucide-react"

export default async function ProviderDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "PROVIDER") {
    redirect("/dashboard")
  }

  if (!user.emailVerified) {
    redirect("/verify-email")
  }

  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
  })

  if (!provider) {
    redirect("/provider/onboarding")
  }

  if (provider.status === "INCOMPLETE" || provider.status === "REJECTED") {
    redirect("/provider/onboarding")
  }

  if (provider.status === "PENDING") {
    redirect("/provider/pending")
  }

  // Fetch all bookings for this provider
  const bookings = await prisma.booking.findMany({
    where: {
      providerId: provider.id,
      status: {
        in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"]
      },
    },
    include: {
      service: true,
      client: true,
      payment: true,
      review: true,
    },
    orderBy: { scheduledDate: "asc" },
  })

  // Group bookings by status
  const pendingBookings = bookings.filter(b => b.status === "PENDING")
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED")
  const inProgressBookings = bookings.filter(b => b.status === "IN_PROGRESS")
  const completedBookings = bookings.filter(b => b.status === "COMPLETED")

  // Calculate real-time stats
  const totalEarnings = bookings
    .filter(b => b.payment && b.status === "COMPLETED")
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
  
  const thisMonthEarnings = bookings
    .filter(b => {
      const bookingDate = new Date(b.scheduledDate)
      const now = new Date()
      return b.payment && 
             b.status === "COMPLETED" &&
             bookingDate.getMonth() === now.getMonth() &&
             bookingDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)

  const averageRating = bookings
    .filter(b => b.review)
    .reduce((sum, b) => sum + (b.review?.rating || 0), 0) / 
    bookings.filter(b => b.review).length || 0

  const totalReviews = bookings.filter(b => b.review).length

  const stats = [
    {
      title: "Pending Jobs",
      value: pendingBookings.length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "New",
      changeType: "neutral"
    },
    {
      title: "Confirmed Jobs",
      value: confirmedBookings.length,
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "Ready",
      changeType: "positive"
    },
    {
      title: "In Progress",
      value: inProgressBookings.length,
      icon: Play,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "Active",
      changeType: "neutral"
    },
    {
      title: "Completed",
      value: completedBookings.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "Done",
      changeType: "positive"
    }
  ]

  const earningsStats = [
    {
      title: "Total Earnings",
      value: `R${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "+15%",
      changeType: "positive"
    },
    {
      title: "This Month",
      value: `R${thisMonthEarnings.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+25%",
      changeType: "positive"
    },
    {
      title: "Average Rating",
      value: averageRating > 0 ? `${averageRating.toFixed(1)}/5` : "No ratings",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: `${totalReviews} reviews`,
      changeType: "neutral"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderServer showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {provider.businessName || user.name}!
                </h1>
                <p className="text-xl text-gray-600">
                  Manage your bookings and grow your business
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  Update Location
                </Button>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Users className="w-5 h-5 mr-2" />
                  View Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Job Status Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          <Badge 
                            variant={stat.changeType === "positive" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {stat.change}
                          </Badge>
                        </div>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Earnings & Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {earningsStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          <Badge 
                            variant={stat.changeType === "positive" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {stat.change}
                          </Badge>
                        </div>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Bookings Sections */}
          <div className="space-y-8">
            {/* Pending Bookings */}
            {pendingBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span>Pending Bookings ({pendingBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    New booking requests waiting for your response
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.service.name}</h4>
                              <p className="text-sm text-gray-600">
                                {booking.client.name} • {new Date(booking.scheduledDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {booking.address}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 mb-2">
                              R{booking.totalAmount.toFixed(2)}
                            </p>
                            <div className="flex space-x-2">
                              <form action={`/api/book-service/${booking.id}/accept`} method="POST">
                                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                                  Accept
                                </Button>
                              </form>
                              <form action={`/api/book-service/${booking.id}/decline`} method="POST">
                                <Button type="submit" size="sm" variant="outline">
                                  Decline
                                </Button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirmed Bookings */}
            {confirmedBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span>Confirmed Bookings ({confirmedBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Upcoming jobs that are confirmed and ready to start
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {confirmedBookings.map((booking) => (
                      <div key={booking.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.service.name}</h4>
                              <p className="text-sm text-gray-600">
                                {booking.client.name} • {new Date(booking.scheduledDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {booking.address}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 mb-2">
                              R{booking.totalAmount.toFixed(2)}
                            </p>
                            {booking.payment ? (
                              <form action={`/api/book-service/${booking.id}/start`} method="POST">
                                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700">
                                  Start Job
                                </Button>
                              </form>
                            ) : (
                              <Badge variant="secondary">Waiting for Payment</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* In Progress Bookings */}
            {inProgressBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="w-5 h-5 text-purple-600" />
                    <span>In Progress ({inProgressBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Jobs currently being worked on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inProgressBookings.map((booking) => (
                      <div key={booking.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.service.name}</h4>
                              <p className="text-sm text-gray-600">
                                {booking.client.name} • {new Date(booking.scheduledDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {booking.address}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 mb-2">
                              R{booking.totalAmount.toFixed(2)}
                            </p>
                            <form action={`/api/book-service/${booking.id}/complete`} method="POST">
                              <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                                Complete Job
                              </Button>
                            </form>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Bookings */}
            {completedBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Completed Jobs ({completedBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Recently completed jobs and client feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedBookings.map((booking) => (
                      <div key={booking.id} className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.service.name}</h4>
                              <p className="text-sm text-gray-600">
                                {booking.client.name} • {new Date(booking.scheduledDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {booking.address}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 mb-2">
                              R{booking.totalAmount.toFixed(2)}
                            </p>
                            {booking.review ? (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{booking.review.rating}/5</span>
                              </div>
                            ) : (
                              <Badge variant="secondary">No Review Yet</Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Show client review if exists */}
                        {booking.review && (
                          <div className="mt-4 p-4 bg-white rounded-lg border">
                            <h5 className="font-semibold text-gray-900 mb-2">Client Review</h5>
                            <div className="flex items-center mb-2">
                              {[...Array(booking.review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="ml-2 text-sm text-gray-600">
                                {booking.review.rating}/5 stars
                              </span>
                            </div>
                            {booking.review.comment && (
                              <p className="text-sm text-gray-700">{booking.review.comment}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No bookings message */}
            {bookings.length === 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">No Active Bookings</h2>
                  <p className="text-gray-600 mb-6">
                    You don't have any bookings at the moment. New bookings will appear here when clients book your services.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">To get more bookings:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Ensure your profile is complete and up-to-date</li>
                      <li>• Set competitive pricing for your services</li>
                      <li>• Respond quickly to booking requests</li>
                      <li>• Maintain high ratings and positive reviews</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 