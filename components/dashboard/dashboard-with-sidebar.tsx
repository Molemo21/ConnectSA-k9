"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem 
} from "@/components/ui/sidebar"
import { 
  Home, Calendar, CreditCard, Settings, HelpCircle, Shield, 
  LogOut, Bell, RefreshCw, Loader2, Plus, CheckCircle, 
  Clock, DollarSign, Star, Search
} from "lucide-react"

// Mock data - replace with real data
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: undefined
}

const mockStats = [
  { title: 'Total Bookings', value: 12, icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { title: 'Completed', value: 8, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  { title: 'Active', value: 3, icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { title: 'Total Spent', value: 'R2,450', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
]

const mockBookings = [
  { id: 1, service: 'House Cleaning', date: '2024-01-15', status: 'Completed' },
  { id: 2, service: 'Plumbing Repair', date: '2024-01-18', status: 'In Progress' },
  { id: 3, service: 'Garden Maintenance', date: '2024-01-20', status: 'Pending' },
]

const mockServices = [
  { id: 1, name: 'House Cleaning', rating: 4.8, providers: 15, icon: Home },
  { id: 2, name: 'Plumbing', rating: 4.6, providers: 8, icon: Settings },
  { id: 3, name: 'Electrical', rating: 4.9, providers: 12, icon: Settings },
  { id: 4, name: 'Garden Care', rating: 4.7, providers: 6, icon: Settings },
]

export function DashboardWithSidebar() {
  const [activeItem, setActiveItem] = useState('Dashboard')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const navigationItems = [
    { name: 'Dashboard', icon: Home, active: activeItem === 'Dashboard' },
    { name: 'Bookings', icon: Calendar, active: activeItem === 'Bookings', badge: 3 },
    { name: 'Payments', icon: CreditCard, active: activeItem === 'Payments' },
    { name: 'Support', icon: HelpCircle, active: activeItem === 'Support' },
    { name: 'Settings', icon: Settings, active: activeItem === 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar>
        {({ isCollapsed, isMobile, closeSidebar }) => (
          <>
            {/* Sidebar Header */}
            <SidebarHeader>
              <div className={`flex items-center space-x-3 transition-opacity duration-200 ${
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 truncate">ConnectSA</h1>
                  <p className="text-xs text-gray-500 truncate">Client Portal</p>
                </div>
              </div>
            </SidebarHeader>

            {/* Sidebar Navigation */}
            <SidebarContent>
              {navigationItems.map((item) => (
                <SidebarItem
                  key={item.name}
                  icon={item.icon}
                  active={item.active}
                  badge={item.badge}
                  isCollapsed={isCollapsed}
                  onClick={() => {
                    setActiveItem(item.name)
                    if (isMobile) closeSidebar()
                  }}
                >
                  {item.name}
                </SidebarItem>
              ))}
            </SidebarContent>

            {/* Sidebar Footer */}
            <SidebarFooter>
              <div className={`flex items-center space-x-3 transition-all duration-200 ${
                isCollapsed ? "justify-center" : ""
              }`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={mockUser.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                    {mockUser.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 min-w-0 transition-all duration-200 ${
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {mockUser.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {mockUser.email}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1.5 text-gray-400 hover:text-gray-600 transition-all duration-200 ${
                    isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  }`}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </SidebarFooter>
          </>
        )}
      </Sidebar>

      {/* Main Content */}
      <main className="lg:ml-0 min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center space-x-4 lg:ml-16"> {/* Add margin for mobile menu button */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activeItem}</h2>
                <p className="text-sm text-gray-500">Welcome back, {mockUser.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hidden sm:flex"
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Quick Action Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Need a service?</h3>
                    <p className="text-blue-100 text-sm">Book from hundreds of verified providers</p>
                  </div>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    <Plus className="w-5 h-5 mr-2" />
                    Book Service
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Bookings */}
              <Card className="lg:col-span-2 rounded-xl shadow-sm border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mockBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No bookings yet</h3>
                      <p className="text-xs text-gray-500 mb-4">Start by booking your first service</p>
                      <Button size="sm">Book Service</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mockBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.service}</p>
                            <p className="text-xs text-gray-500">{booking.date}</p>
                          </div>
                          <Badge 
                            className={`text-xs ${
                              booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Popular Services */}
              <Card className="rounded-xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Popular Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockServices.map((service) => {
                      const Icon = service.icon
                      return (
                        <div 
                          key={service.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-500">{service.rating}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{service.providers} providers</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}