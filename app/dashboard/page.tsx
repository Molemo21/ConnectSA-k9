import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, Star, MapPin, Plus, Home, Wrench, Paintbrush, Zap, Car, Scissors, TrendingUp, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { BrandHeaderServer } from "@/components/ui/brand-header-server"
import { prisma } from "@/lib/prisma"
import { ReviewSection } from "@/components/review-section"

// Helper function to get service icon
function getServiceIcon(serviceName: string) {
  const name = serviceName.toLowerCase()
  if (name.includes('clean') || name.includes('house')) return Home
  if (name.includes('plumb')) return Wrench
  if (name.includes('paint')) return Paintbrush
  if (name.includes('electr')) return Zap
  if (name.includes('car') || name.includes('wash')) return Car
  if (name.includes('hair') || name.includes('beauty') || name.includes('makeup')) return Scissors
  return Home // default icon
}

export default async function ClientDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role === "PROVIDER") {
    const provider = await prisma.provider.findUnique({ where: { userId: user.id } })
    if (!provider || provider.status === "INCOMPLETE" || provider.status === "REJECTED") {
      redirect("/provider/onboarding")
    } else if (provider.status === "PENDING") {
      redirect("/provider/pending")
    } else if (provider.status === "APPROVED") {
      redirect("/provider/dashboard")
    } else {
      redirect("/provider/onboarding")
    }
  } else if (user.role === "ADMIN") {
    redirect("/admin")
  } else if (user.role !== "CLIENT") {
    redirect("/") // Fallback for any other roles
  }

  if (!user.emailVerified) {
    redirect("/verify-email")
  }

  // Fetch real bookings for this client
  const bookings = await prisma.booking.findMany({
    where: { clientId: user.id },
    include: {
      service: true,
      provider: true,
      payment: true,
      review: true,
    },
    orderBy: { scheduledDate: "desc" },
  })

  // Fetch real services with provider counts and average ratings
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      providers: {
        include: {
          provider: {
            include: {
              reviews: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  // Calculate real stats
  const totalBookings = bookings.length
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length
  const totalSpent = bookings
    .filter(b => b.payment)
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
  const averageRating = bookings
    .filter(b => b.review)
    .reduce((sum, b) => sum + (b.review?.rating || 0), 0) / 
    bookings.filter(b => b.review).length || 0

  // Process services with real data
  const popularServices = services.map(service => {
    const providerCount = service.providers.length
    const allRatings = service.providers.flatMap(ps => 
      ps.provider.reviews.map(r => r.rating)
    )
    const averageServiceRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
      : 0

    return {
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      providerCount,
      averageRating: Math.round(averageServiceRating * 10) / 10,
      icon: getServiceIcon(service.name),
    }
  }).filter(service => service.providerCount > 0).slice(0, 6) // Show top 6 services with providers

  const stats = [
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Completed Jobs",
      value: completedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Pending Bookings",
      value: pendingBookings,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "Active",
      changeType: "neutral"
    },
    {
      title: "Total Spent",
      value: `R${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "+25%",
      changeType: "positive"
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
                  Welcome back, {user.name || user.email}!
                </h1>
                <p className="text-xl text-gray-600">
                  Here's what's happening with your services
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

          {/* Stats Grid */}
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
            {/* Recent Bookings */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Recent Bookings</span>
                  </CardTitle>
                  <CardDescription>
                    Track the status of your service bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                      <p className="text-gray-600 mb-6">
                        You haven't made any bookings yet. Start by exploring our available services!
                      </p>
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <a href="/book-service">Book Your First Service</a>
                      </Button>
              </div>
                  ) : (
              <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                {(() => {
                                  const Icon = getServiceIcon(booking.service.name)
                                  return <Icon className="w-6 h-6 text-blue-600" />
                                })()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{booking.service.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {booking.provider?.businessName || "Provider TBD"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(booking.scheduledDate).toLocaleDateString()} at {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                                variant={
                                  booking.status === "COMPLETED" ? "default" :
                                  booking.status === "CONFIRMED" ? "secondary" :
                                  booking.status === "IN_PROGRESS" ? "outline" :
                                  "destructive"
                                }
                                className="mb-2"
                              >
                                {booking.status.replace("_", " ")}
                          </Badge>
                              <p className="text-sm font-medium text-gray-900">
                                R{booking.totalAmount.toFixed(2)}
                              </p>
                              {booking.status === "CONFIRMED" && !booking.payment && (
                                <Button size="sm" className="mt-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                                  Pay Now
                                </Button>
                              )}
                              {booking.payment && (
                                <p className="text-xs text-green-600 mt-1">Payment received</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Review Section for completed bookings */}
                          {booking.status === "COMPLETED" && (
                            <ReviewSection
                              bookingId={booking.id}
                              existingReview={booking.review}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Popular Services */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Available Services</span>
                  </CardTitle>
                  <CardDescription>
                    Explore our most popular services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {popularServices.length > 0 ? (
                      popularServices.map((service, index) => {
                        const Icon = service.icon
                        return (
                          <div key={service.id} className="group p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg mb-1">{service.name}</h3>
                                <p className="text-gray-600 mb-2">{service.category}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-gray-600">{service.averageRating.toFixed(1)}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">{service.providerCount} providers</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
                        <p className="text-gray-600">
                          There are currently no active service providers in your area.
                        </p>
                      </div>
                    )}
                      </div>
                    </CardContent>
                  </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/book-service">
                  <Plus className="w-4 h-4 mr-2" />
                  Book New Service
                      </a>
                </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/dashboard">
                  <Calendar className="w-4 h-4 mr-2" />
                        View All Bookings
                      </a>
                </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="#">
                  <Star className="w-4 h-4 mr-2" />
                        My Reviews
                      </a>
                </Button>
                  </div>
              </CardContent>
            </Card>

            {/* Account Status */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Verified</span>
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Bookings</span>
                      <span className="font-semibold">{totalBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed Jobs</span>
                      <span className="font-semibold">{completedBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Spent</span>
                      <span className="font-semibold">R{totalSpent.toFixed(2)}</span>
                    </div>
                    {averageRating > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Rating</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

