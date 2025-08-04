import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderServer } from "@/components/ui/brand-header-server"
import { Users, Briefcase, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock, Star } from "lucide-react"
import ProviderList from '@/components/admin/provider-list'

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch admin stats
  const [
    totalUsers,
    totalProviders,
    pendingProviders,
    totalBookings,
    completedBookings,
    totalRevenue,
    averageRating
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.provider.count(),
    prisma.provider.count({ where: { status: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "completed" }
    }),
    prisma.review.aggregate({
      _avg: { rating: true }
    })
  ])

  const revenue = totalRevenue._sum.amount || 0
  const avgRating = averageRating._avg.rating || 0

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Active Providers",
      value: totalProviders.toLocaleString(),
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Pending Approvals",
      value: pendingProviders.toLocaleString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "3 new",
      changeType: "neutral"
    },
    {
      title: "Total Bookings",
      value: totalBookings.toLocaleString(),
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+15%",
      changeType: "positive"
    },
    {
      title: "Completed Jobs",
      value: completedBookings.toLocaleString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+20%",
      changeType: "positive"
    },
    {
      title: "Total Revenue",
      value: `R${revenue.toLocaleString()}`,
      icon: TrendingUp,
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-xl text-gray-600">Monitor and manage your platform</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
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

          {/* Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span>Pending Approvals</span>
                </CardTitle>
                <CardDescription>
                  Review and approve new provider applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Applications</span>
                    <Badge variant="secondary">{pendingProviders}</Badge>
                  </div>
                  <Button className="w-full" variant="outline">
                    Review Applications
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span>Platform Performance</span>
                </CardTitle>
                <CardDescription>
                  Monitor key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{avgRating.toFixed(1)}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-medium">
                      {totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Revenue Overview</span>
                </CardTitle>
                <CardDescription>
                  Track platform revenue and growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-medium">R{revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium text-green-600">+25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Management */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Provider Management</CardTitle>
              <CardDescription>
                Review and manage service providers on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
      <ProviderList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 