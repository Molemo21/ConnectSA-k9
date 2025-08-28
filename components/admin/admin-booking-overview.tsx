"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, XCircle, TrendingUp, Users, Clock, DollarSign } from "lucide-react"

interface AdminBookingOverviewProps {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
}

export default function AdminBookingOverview({
  totalBookings,
  completedBookings,
  cancelledBookings,
  totalRevenue
}: AdminBookingOverviewProps) {
  // Calculate percentages and metrics
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0
  const activeBookings = totalBookings - completedBookings - cancelledBookings
  const averageRevenuePerBooking = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0

  // Determine performance indicators
  const getPerformanceIndicator = (rate: number, type: 'completion' | 'cancellation') => {
    if (type === 'completion') {
      if (rate >= 80) return { status: 'excellent', color: 'green', icon: CheckCircle }
      if (rate >= 60) return { status: 'good', color: 'blue', icon: TrendingUp }
      if (rate >= 40) return { status: 'fair', color: 'orange', icon: Clock }
      return { status: 'poor', color: 'red', icon: XCircle }
    } else {
      if (rate <= 10) return { status: 'excellent', color: 'green', icon: CheckCircle }
      if (rate <= 20) return { status: 'good', color: 'blue', icon: TrendingUp }
      if (rate <= 30) return { status: 'fair', color: 'orange', icon: Clock }
      return { status: 'poor', color: 'red', icon: XCircle }
    }
  }

  const completionIndicator = getPerformanceIndicator(completionRate, 'completion')
  const cancellationIndicator = getPerformanceIndicator(cancellationRate, 'cancellation')

  const CompletionIcon = completionIndicator.icon
  const CancellationIcon = cancellationIndicator.icon

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Booking Overview & Analytics</span>
        </CardTitle>
        <CardDescription>
          Comprehensive insights into booking performance and platform utilization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{completedBookings}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{activeBookings}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{cancelledBookings}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Completion Rate */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Completion Rate</h4>
                <Badge 
                  variant="secondary"
                  className={`bg-${completionIndicator.color}-100 text-${completionIndicator.color}-800`}
                >
                  {completionRate}%
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <CompletionIcon className={`w-5 h-5 text-${completionIndicator.color}-600`} />
                <span className={`text-sm text-${completionIndicator.color}-700`}>
                  {completionIndicator.status === 'excellent' && 'Excellent performance'}
                  {completionIndicator.status === 'good' && 'Good performance'}
                  {completionIndicator.status === 'fair' && 'Fair performance'}
                  {completionIndicator.status === 'poor' && 'Needs improvement'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${completionIndicator.color}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Cancellation Rate */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Cancellation Rate</h4>
                <Badge 
                  variant="secondary"
                  className={`bg-${cancellationIndicator.color}-100 text-${cancellationIndicator.color}-800`}
                >
                  {cancellationRate}%
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <CancellationIcon className={`w-5 h-5 text-${cancellationIndicator.color}-600`} />
                <span className={`text-sm text-${cancellationIndicator.color}-700`}>
                  {cancellationIndicator.status === 'excellent' && 'Very low cancellations'}
                  {cancellationIndicator.status === 'good' && 'Low cancellations'}
                  {cancellationIndicator.status === 'fair' && 'Moderate cancellations'}
                  {cancellationIndicator.status === 'poor' && 'High cancellations'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${cancellationIndicator.color}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${cancellationRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Revenue Insights */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Revenue Insights</span>
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">R{totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">R{averageRevenuePerBooking.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Avg per Booking</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
                <div className="text-sm text-gray-600">Revenue Efficiency</div>
              </div>
            </div>
          </div>

          {/* Platform Utilization */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Platform Utilization</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Bookings</span>
                  <span className="text-sm font-medium">{activeBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-medium">{completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cancellation Rate</span>
                  <span className="text-sm font-medium">{cancellationRate}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Performance Summary</span>
              </h4>
              <div className="space-y-3">
                {completionRate >= 80 && (
                  <div className="flex items-center space-x-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>High completion rate indicates good service quality</span>
                  </div>
                )}
                {cancellationRate <= 10 && (
                  <div className="flex items-center space-x-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Low cancellation rate shows strong customer satisfaction</span>
                  </div>
                )}
                {activeBookings > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <Clock className="w-4 h-4" />
                    <span>{activeBookings} active bookings in progress</span>
                  </div>
                )}
                {totalRevenue > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-green-700">
                    <DollarSign className="w-4 h-4" />
                    <span>Platform generating steady revenue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
