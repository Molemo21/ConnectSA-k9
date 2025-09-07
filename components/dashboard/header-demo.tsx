"use client"

import { useState } from "react"
import { DashboardHeader, DashboardHeaderAlt, DashboardHeaderCompact } from "./dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function HeaderDemoPage() {
  const [selectedHeader, setSelectedHeader] = useState<'default' | 'alt' | 'compact'>('default')
  const [actionLog, setActionLog] = useState<string[]>([])

  const logAction = (action: string) => {
    setActionLog(prev => [`${new Date().toLocaleTimeString()}: ${action}`, ...prev.slice(0, 4)])
  }

  const handleAddBooking = () => {
    logAction("Add Booking clicked")
  }

  const handleMakePayment = () => {
    logAction("Make Payment clicked")
  }

  const handleContactSupport = () => {
    logAction("Contact Support clicked")
  }

  const renderSelectedHeader = () => {
    const commonProps = {
      onAddBooking: handleAddBooking,
      onMakePayment: handleMakePayment,
      onContactSupport: handleContactSupport,
    }

    switch (selectedHeader) {
      case 'alt':
        return <DashboardHeaderAlt {...commonProps} />
      case 'compact':
        return <DashboardHeaderCompact {...commonProps} />
      default:
        return <DashboardHeader {...commonProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Selected Header */}
      {renderSelectedHeader()}
      
      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-20 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Demo Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Dashboard Header Demo</CardTitle>
              <p className="text-gray-600">
                Choose different header variations to see how they look and behave.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  onClick={() => setSelectedHeader('default')}
                  variant={selectedHeader === 'default' ? 'default' : 'outline'}
                  className="rounded-full"
                >
                  Default Header
                </Button>
                <Button
                  onClick={() => setSelectedHeader('alt')}
                  variant={selectedHeader === 'alt' ? 'default' : 'outline'}
                  className="rounded-full"
                >
                  Gradient Header
                </Button>
                <Button
                  onClick={() => setSelectedHeader('compact')}
                  variant={selectedHeader === 'compact' ? 'default' : 'outline'}
                  className="rounded-full"
                >
                  Compact Header
                </Button>
              </div>

              {/* Action Log */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Action Log</h3>
                {actionLog.length === 0 ? (
                  <p className="text-sm text-gray-500">Click the header buttons to see actions logged here.</p>
                ) : (
                  <div className="space-y-1">
                    {actionLog.map((action, index) => (
                      <div key={index} className="text-sm text-gray-700 font-mono">
                        {action}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Header Features */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Default Header Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Default Header
                  {selectedHeader === 'default' && <Badge className="ml-2">Active</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Clean white background</li>
                  <li>• Colored action buttons</li>
                  <li>• Responsive text labels</li>
                  <li>• Hover scale effects</li>
                  <li>• Shadow on hover</li>
                </ul>
              </CardContent>
            </Card>

            {/* Gradient Header Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Gradient Header
                  {selectedHeader === 'alt' && <Badge className="ml-2">Active</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Blue to purple gradient</li>
                  <li>• White action buttons</li>
                  <li>• Colored button text</li>
                  <li>• Premium appearance</li>
                  <li>• High contrast design</li>
                </ul>
              </CardContent>
            </Card>

            {/* Compact Header Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Compact Header
                  {selectedHeader === 'compact' && <Badge className="ml-2">Active</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Smaller height on mobile</li>
                  <li>• Icon-only on tiny screens</li>
                  <li>• Space-efficient design</li>
                  <li>• Mobile-first approach</li>
                  <li>• Adaptive button sizes</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Header Features</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code className="bg-gray-100 px-1 rounded">fixed top-0</code> - Always visible at top</li>
                    <li>• <code className="bg-gray-100 px-1 rounded">z-50</code> - High z-index for layering</li>
                    <li>• <code className="bg-gray-100 px-1 rounded">shadow-sm</code> - Subtle shadow</li>
                    <li>• <code className="bg-gray-100 px-1 rounded">border-b</code> - Bottom border</li>
                    <li>• <code className="bg-gray-100 px-1 rounded">h-16</code> - 64px height</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Button Features</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code className="bg-gray-100 px-1 rounded">rounded-full</code> - Fully rounded buttons</li>
                    <li>• <code className="bg-gray-100 px-1 rounded">hover:scale-105</code> - Scale on hover</li>
                    <li>��� <code className="bg-gray-100 px-1 rounded">transition-all</code> - Smooth animations</li>
                    <li>• <code className="bg-gray-100 px-1 rounded">shadow-md</code> - Medium shadow</li>
                    <li>• <code className="bg-gray-100 px-1 rounded">hover:shadow-lg</code> - Large shadow on hover</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Content */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-48">
                <CardHeader>
                  <CardTitle>Sample Card {i}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    This is sample content to demonstrate how the fixed header works with scrollable content below.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}