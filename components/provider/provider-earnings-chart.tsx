"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign } from "lucide-react"

interface Booking {
  id: string
  scheduledDate: string
  totalAmount: number
  payment?: {
    amount: number
  }
}

interface ProviderEarningsChartProps {
  bookings: Booking[]
}

export function ProviderEarningsChart({ bookings }: ProviderEarningsChartProps) {
  // Process data for the last 6 months
  const getMonthlyData = () => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.scheduledDate)
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear()
      })
      
      const earnings = monthBookings.reduce((sum, booking) => {
        return sum + (booking.payment?.amount || booking.totalAmount)
      }, 0)
      
      months.push({
        month: monthName,
        earnings: earnings,
        jobs: monthBookings.length
      })
    }
    
    return months
  }

  const chartData = getMonthlyData()
  const totalEarnings = chartData.reduce((sum, data) => sum + data.earnings, 0)
  const totalJobs = chartData.reduce((sum, data) => sum + data.jobs, 0)

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span>Earnings Overview</span>
        </CardTitle>
        <CardDescription>
          Your earnings and job completion trends over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">R{totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
            <p className="text-sm text-gray-600">Total Jobs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {totalJobs > 0 ? `R${(totalEarnings / totalJobs).toFixed(2)}` : "R0.00"}
            </p>
            <p className="text-sm text-gray-600">Average per Job</p>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'earnings' ? `R${value.toFixed(2)}` : value,
                  name === 'earnings' ? 'Earnings' : 'Jobs'
                ]}
              />
              <Bar dataKey="earnings" fill="#10b981" name="earnings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Earnings are calculated from completed jobs with payments
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 