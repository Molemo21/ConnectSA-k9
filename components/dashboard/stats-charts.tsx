"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target, 
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface GoalData {
  id: string
  title: string
  target: number
  current: number
  unit: string
  period: string
  color: string
}

interface StatsChartsProps {
  bookings: any[]
  totalSpent: number
  averageRating: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function StatsCharts({ bookings, totalSpent, averageRating }: StatsChartsProps) {
  const [timeRange, setTimeRange] = useState("6M")
  const [activeChart, setActiveChart] = useState("spending")

  // Process data for charts
  const getMonthlyData = () => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear()
      })
      
      const monthSpent = monthBookings
        .filter(b => b.payment)
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
      
      months.push({
        name: monthName,
        bookings: monthBookings.length,
        spent: monthSpent,
        completed: monthBookings.filter(b => b.status === "COMPLETED").length,
        cancelled: monthBookings.filter(b => b.status === "CANCELLED").length
      })
    }
    
    return months
  }

  const getServiceBreakdown = () => {
    const serviceCounts: { [key: string]: number } = {}
    
    bookings.forEach(booking => {
      const serviceName = booking.service?.name || 'Unknown'
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1
    })
    
    return Object.entries(serviceCounts).map(([name, value]) => ({
      name,
      value
    }))
  }

  const getStatusBreakdown = () => {
    const statusCounts: { [key: string]: number } = {}
    
    bookings.forEach(booking => {
      const status = booking.status.replace('_', ' ')
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }))
  }

  const getSpendingTrend = () => {
    const monthlyData = getMonthlyData()
    return monthlyData.map(month => ({
      name: month.name,
      spent: month.spent,
      avgPerBooking: month.bookings > 0 ? month.spent / month.bookings : 0
    }))
  }

  // Goals data
  const goals: GoalData[] = [
    {
      id: "monthly-bookings",
      title: "Monthly Bookings",
      target: 10,
      current: bookings.filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        const now = new Date()
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear()
      }).length,
      unit: "bookings",
      period: "This Month",
      color: "bg-blue-500"
    },
    {
      id: "completion-rate",
      title: "Completion Rate",
      target: 90,
      current: bookings.length > 0 
        ? Math.round((bookings.filter(b => b.status === "COMPLETED").length / bookings.length) * 100)
        : 0,
      unit: "%",
      period: "Overall",
      color: "bg-green-500"
    },
    {
      id: "avg-rating",
      title: "Average Rating",
      target: 4.5,
      current: averageRating,
      unit: "stars",
      period: "Overall",
      color: "bg-yellow-500"
    }
  ]

  const monthlyData = getMonthlyData()
  const serviceBreakdown = getServiceBreakdown()
  const statusBreakdown = getStatusBreakdown()
  const spendingTrend = getSpendingTrend()

  const renderSpendingChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={spendingTrend}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value: any) => [`R${value.toFixed(2)}`, 'Amount']}
          labelFormatter={(label) => `${label} 2024`}
        />
        <Area 
          type="monotone" 
          dataKey="spent" 
          stroke="#8884d8" 
          fill="#8884d8" 
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderBookingsChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="bookings" fill="#8884d8" name="Total Bookings" />
        <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
        <Bar dataKey="cancelled" fill="#ff8042" name="Cancelled" />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderServicePieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={serviceBreakdown}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {serviceBreakdown.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderStatusPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusBreakdown}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {statusBreakdown.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant={activeChart === "spending" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("spending")}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Spending Trends
          </Button>
          <Button
            variant={activeChart === "bookings" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("bookings")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Booking Analytics
          </Button>
          <Button
            variant={activeChart === "services" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("services")}
          >
            <PieChartIcon className="w-4 h-4 mr-2" />
            Service Breakdown
          </Button>
          <Button
            variant={activeChart === "status" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("status")}
          >
            <Activity className="w-4 h-4 mr-2" />
            Status Distribution
          </Button>
        </div>
        
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
      </div>

      {/* Main Chart */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {activeChart === "spending" && <DollarSign className="w-5 h-5 text-green-600" />}
            {activeChart === "bookings" && <Calendar className="w-5 h-5 text-blue-600" />}
            {activeChart === "services" && <PieChartIcon className="w-5 h-5 text-purple-600" />}
            {activeChart === "status" && <Activity className="w-5 h-5 text-orange-600" />}
            <span>
              {activeChart === "spending" && "Spending Trends"}
              {activeChart === "bookings" && "Booking Analytics"}
              {activeChart === "services" && "Service Breakdown"}
              {activeChart === "status" && "Status Distribution"}
            </span>
          </CardTitle>
          <CardDescription>
            {activeChart === "spending" && "Track your spending patterns over time"}
            {activeChart === "bookings" && "Analyze your booking activity and completion rates"}
            {activeChart === "services" && "See which services you book most frequently"}
            {activeChart === "status" && "Distribution of booking statuses"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeChart === "spending" && renderSpendingChart()}
          {activeChart === "bookings" && renderBookingsChart()}
          {activeChart === "services" && renderServicePieChart()}
          {activeChart === "status" && renderStatusPieChart()}
        </CardContent>
      </Card>

      {/* Goals and Progress */}
      <div className="grid md:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100
          const isOverTarget = goal.current > goal.target
          
          return (
            <Card key={goal.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{goal.title}</span>
                  <Badge variant={isOverTarget ? "default" : "secondary"}>
                    {goal.period}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    {goal.current.toFixed(goal.unit === "stars" ? 1 : 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    / {goal.target.toFixed(goal.unit === "stars" ? 1 : 0)} {goal.unit}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                </div>
                
                <div className="flex items-center space-x-2">
                  {isOverTarget ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${isOverTarget ? 'text-green-600' : 'text-red-600'}`}>
                    {isOverTarget ? 'Target exceeded!' : `${(goal.target - goal.current).toFixed(goal.unit === "stars" ? 1 : 0)} ${goal.unit} to go`}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === "COMPLETED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">R{totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 