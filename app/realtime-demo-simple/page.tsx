"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RealtimeStatusIndicator } from "@/components/ui/realtime-status-indicator"
import { BrandHeader } from "@/components/ui/brand-header"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react"

// Mock booking data for demo
const mockBookings = [
  {
    id: "demo-1",
    status: "PENDING",
    service: { name: "House Cleaning" },
    payment: { status: "PENDING" },
    scheduledDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-2", 
    status: "CONFIRMED",
    service: { name: "Plumbing Repair" },
    payment: { status: "ESCROW" },
    scheduledDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: "demo-3",
    status: "IN_PROGRESS", 
    service: { name: "Garden Maintenance" },
    payment: { status: "ESCROW" },
    scheduledDate: new Date(Date.now() + 172800000).toISOString(),
    createdAt: new Date(Date.now() - 600000).toISOString()
  }
]

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Waiting for Provider",
    description: "Your booking is waiting for a provider to accept",
    pulse: true
  },
  CONFIRMED: {
    icon: CheckCircle,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Confirmed",
    description: "Provider has accepted your booking",
    pulse: false
  },
  PENDING_EXECUTION: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Payment Received",
    description: "Payment processed, provider can start work",
    pulse: false
  },
  IN_PROGRESS: {
    icon: Loader2,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    label: "In Progress",
    description: "Provider is working on your service",
    pulse: true
  },
  COMPLETED: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Completed",
    description: "Service completed successfully",
    pulse: false
  }
}

export default function RealtimeDemoSimplePage() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)
  const [bookings, setBookings] = useState(mockBookings)
  const [isConnected, setIsConnected] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
        setBookings(prev => 
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
    setBookings(mockBookings)
  }

  const stopSimulation = () => {
    setIsSimulating(false)
    setSimulationStep(0)
  }

  const resetSimulation = () => {
    setIsSimulating(false)
    setSimulationStep(0)
    setBookings(mockBookings)
  }

  const refreshBooking = async (id: string) => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
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
                    isRefreshing={isRefreshing}
                  />
                  
                  <Badge variant="outline">
                    Step {simulationStep}/4
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Cards */}
          <div className="grid gap-6">
            {bookings.map((booking) => {
              const config = statusConfig[booking.status as keyof typeof statusConfig] || {
                icon: AlertCircle,
                color: "bg-gray-100 text-gray-800 border-gray-200",
                label: booking.status.replace("_", " "),
                description: "Status update",
                pulse: false
              }
              const StatusIcon = config.icon

              return (
                <Card key={booking.id} className="relative overflow-hidden">
                  {/* Real-time indicator */}
                  <div className="absolute top-2 right-2">
                    <RealtimeStatusIndicator 
                      isConnected={isConnected}
                      isRefreshing={isRefreshing}
                      size="sm"
                      showText={false}
                    />
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {booking.service?.name || 'Service'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refreshBooking(booking.id)}
                        disabled={isRefreshing}
                        className="h-8 w-8 p-0"
                      >
                        {isRefreshing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center space-x-3">
                      <Badge className={`flex items-center space-x-2 px-3 py-1 ${
                        config.color
                      } ${config.pulse ? 'animate-pulse' : ''}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{config.label}</span>
                      </Badge>
                      
                      {/* Pulse indicator for active statuses */}
                      {config.pulse && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Activity className="w-3 h-3 animate-pulse" />
                          <span>Live</span>
                        </div>
                      )}
                    </div>

                    {/* Status Description */}
                    <p className="text-sm text-gray-600">
                      {config.description}
                    </p>

                    {/* Connection Status */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>
                          {isConnected ? 'Real-time updates active' : 'Updates paused'}
                        </span>
                      </div>
                      
                      <span>
                        Last updated: {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
