"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Menu, X, Home, Calendar, CreditCard, Settings, HelpCircle, 
  Plus, Bell, Search, TrendingUp, DollarSign, CheckCircle, 
  Clock, Star, MessageSquare, Shield, ChevronRight, Activity,
  Users, BarChart3, Zap, ArrowUpRight, ArrowDownRight
} from "lucide-react"

export function DarkDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Mock data
  const stats = [
    {
      title: "Total Revenue",
      value: "R45,231",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-400"
    },
    {
      title: "Active Bookings",
      value: "2,350",
      change: "+180.1%",
      trend: "up", 
      icon: Calendar,
      color: "text-blue-400"
    },
    {
      title: "Completed Jobs",
      value: "12,234",
      change: "+19%",
      trend: "up",
      icon: CheckCircle,
      color: "text-purple-400"
    },
    {
      title: "Customer Rating",
      value: "4.8",
      change: "+0.2",
      trend: "up",
      icon: Star,
      color: "text-yellow-400"
    }
  ]

  const recentBookings = [
    {
      id: 1,
      service: "House Cleaning",
      customer: "Sarah Johnson",
      date: "2024-01-15",
      status: "completed",
      amount: "R450"
    },
    {
      id: 2,
      service: "Plumbing Repair",
      customer: "Mike Chen",
      date: "2024-01-14",
      status: "in-progress",
      amount: "R320"
    },
    {
      id: 3,
      service: "Garden Maintenance",
      customer: "Emma Wilson",
      date: "2024-01-13",
      status: "pending",
      amount: "R280"
    }
  ]

  const navigationItems = [
    { name: 'Dashboard', icon: Home, current: true },
    { name: 'Bookings', icon: Calendar, current: false, badge: 12 },
    { name: 'Payments', icon: CreditCard, current: false },
    { name: 'Analytics', icon: BarChart3, current: false },
    { name: 'Customers', icon: Users, current: false },
    { name: 'Settings', icon: Settings, current: false },
    { name: 'Support', icon: HelpCircle, current: false, badge: 3 },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-900/50 text-green-400 border-green-800">Completed</Badge>
      case 'in-progress':
        return <Badge className="bg-blue-900/50 text-blue-400 border-blue-800">In Progress</Badge>
      case 'pending':
        return <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-800 text-gray-400">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-gray-950/80 backdrop-blur border-r border-gray-800 transition-all duration-200 lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-100">ConnectSA</h1>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  item.current
                    ? 'bg-purple-900/50 text-purple-400 border border-purple-800/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 ${
                  sidebarCollapsed ? '' : 'mr-3'
                }`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <Badge className="ml-auto bg-purple-900/50 text-purple-400 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-purple-900/50 text-purple-400">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">
                  John Doe
                </p>
                <p className="text-xs text-gray-400 truncate">
                  john@example.com
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        
        {/* Header */}
        <header className="bg-gray-950/80 backdrop-blur border-b border-gray-800 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div>
                <h2 className="text-xl font-bold text-gray-100">Dashboard</h2>
                <p className="text-sm text-gray-400">Welcome back, John</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <Search className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="relative text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full"></span>
              </Button>
              
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarFallback className="bg-purple-900/50 text-purple-400">
                  JD
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
              <Button className="bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button className="bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight
                return (
                  <Card key={index} className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-100 mt-1">{stat.value}</p>
                          <div className="flex items-center mt-2">
                            <TrendIcon className={`w-4 h-4 mr-1 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
                            <span className={`text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                              {stat.change}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-800">
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Recent Bookings */}
              <Card className="lg:col-span-2 bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-100">Recent Bookings</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    >
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-100">{booking.service}</p>
                            <p className="text-xs text-gray-400">{booking.customer} • {booking.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-100">{booking.amount}</span>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-400" />
                    Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-100">New booking received</p>
                        <p className="text-xs text-gray-400">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-100">Payment processed</p>
                        <p className="text-xs text-gray-400">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-100">Service completed</p>
                        <p className="text-xs text-gray-400">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-100">New customer registered</p>
                        <p className="text-xs text-gray-400">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}