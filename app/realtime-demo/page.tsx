"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RealtimeBookingStatus } from "@/components/dashboard/realtime-booking-status"
import { RealtimeStatusIndicator } from "@/components/ui/realtime-status-indicator"
import { useDemoBooking } from "@/hooks/use-demo-booking"
import { BrandHeader } from "@/components/ui/brand-header"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Wifi, 
  WifiOff,
  Activity,
  Clock,
  CheckCircle
} from "lucide-react"

// Mock booking data for demo
const mockBookings = [
  {
    id: "demo-1",
    status: "PENDING",
    service: { name: "House Cleaning" },
    payment: { status: "PENDING" },
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-2", 
    status: "CONFIRMED",
    service: { name: "Plumbing Repair" },
    payment: { status: "ESCROW" },
    createdAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: "demo-3",
    status: "IN_PROGRESS", 
    service: { name: "Garden Maintenance" },
    payment: { status: "ESCROW" },
    createdAt: new Date(Date.now() - 600000).toISOString()
  }
]

export default function RealtimeDemoPage() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)
  const [demoBookings, setDemoBookings] = useState(mockBookings)
  
  const { 
    bookings, 
    refreshBooking, 
    refreshAllBookings, 
    isLoading, 
    isConnected, 
    optimisticUpdate 
  } = useDemoBooking(demoBookings)

  // Simulate real-time status changes
  useEffect(() => {
    if (!isSimulating) return

    const simulationSteps = [
      { id: "demo-1", status: "CONFIRMED", delay: 2000 },
      { id: "demo-1", status: "PENDING_EXECUTION", delay: 4000 },
      { id: "demo-2", status: "IN_PROGRESS", delay: 6000 },
      { id: "demo-3", status: "COMPLETED", delay: 8000 }
    ]

    const timeouts: NodeJS.Timeout[] = []

    simulationSteps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setDemoBookings(prev => 
          prev.map(booking => 
            booking.id === step.id 
              ? { ...booking, status: step.status }
              : booking
          )
        )
        setSimulationStep(index + 1)
      }, step.delay)
      
      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isSimulating])

  const startSimulation = () => {
    setIsSimulating(true)
    setSimulationStep(0)
    setDemoBookings(mockBookings)
  }

  const stopSimulation = () => {
    setIsSimulating(false)
    setSimulationStep(0)
  }

  const resetSimulation = () => {
    setIsSimulating(false)
    setSimulationStep(0)
    setDemoBookings(mockBookings)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Real-time Booking Updates Demo
            </h1>
            <p className="text-lg text-gray-600">
              See how booking status updates work in real-time without page reloads
            </p>
          </div>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Demo Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={startSimulation}
                  disabled={isSimulating}
                  className="flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Simulation</span>
                </Button>
                
                <Button
                  onClick={stopSimulation}
                  disabled={!isSimulating}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Stop</span>
                </Button>
                
                <Button
                  onClick={resetSimulation}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </Button>

                <div className="ml-auto flex items-center space-x-4">
                  <RealtimeStatusIndicator 
                    isConnected={isConnected}
                    isRefreshing={isLoading}
                  />
                  
                  <Badge variant="outline">
                    Step {simulationStep}/4
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">PENDING - Waiting for provider</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">CONFIRMED - Provider accepted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">PENDING_EXECUTION - Payment received</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span className="text-sm">IN_PROGRESS - Provider working</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">COMPLETED - Service done</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Cards */}
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <RealtimeBookingStatus
                key={booking.id}
                booking={booking}
                isConnected={isConnected}
                isRefreshing={isLoading}
                onRefresh={() => refreshBooking(booking.id)}
              />
            ))}
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-600">✅ What's Working</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Automatic status polling every 5-15 seconds</li>
                    <li>• Smart caching based on booking status</li>
                    <li>• User activity detection (faster updates when active)</li>
                    <li>• Exponential backoff for failed requests</li>
                    <li>• Toast notifications for status changes</li>
                    <li>• Connection status indicator</li>
                    <li>• Optimistic UI updates</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-600">🚀 Benefits</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• No more manual page refreshes</li>
                    <li>• Instant feedback when provider accepts</li>
                    <li>• Real-time payment status updates</li>
                    <li>• Better user experience</li>
                    <li>• Reduced server load with smart caching</li>
                    <li>• Works offline with graceful degradation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
