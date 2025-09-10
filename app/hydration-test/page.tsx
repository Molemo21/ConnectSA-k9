"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SafeDateDisplay, SafeTimeOnlyDisplay, SafeTimeDisplay } from "@/components/ui/safe-time-display"
import { BrandHeader } from "@/components/ui/brand-header"

export default function HydrationTestPage() {
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setIsClient(true)
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Hydration Test Page
            </h1>
            <p className="text-lg text-gray-600">
              This page tests that time displays don't cause hydration errors
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Safe Time Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✅ Safe Time Display</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Current Time (Safe):</h3>
                  <SafeTimeDisplay 
                    date={currentTime} 
                    format="time"
                    className="text-lg font-mono bg-gray-100 p-2 rounded"
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Current Date (Safe):</h3>
                  <SafeDateDisplay 
                    date={currentTime}
                    className="text-lg font-mono bg-gray-100 p-2 rounded"
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">DateTime (Safe):</h3>
                  <SafeTimeDisplay 
                    date={currentTime} 
                    format="datetime"
                    className="text-lg font-mono bg-gray-100 p-2 rounded"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Unsafe Time Display (for comparison) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">❌ Unsafe Time Display</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Current Time (Unsafe):</h3>
                  <div className="text-lg font-mono bg-red-100 p-2 rounded">
                    {isClient ? currentTime.toLocaleTimeString() : '--:--:--'}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Current Date (Unsafe):</h3>
                  <div className="text-lg font-mono bg-red-100 p-2 rounded">
                    {isClient ? currentTime.toLocaleDateString() : '--/--/----'}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">DateTime (Unsafe):</h3>
                  <div className="text-lg font-mono bg-red-100 p-2 rounded">
                    {isClient ? currentTime.toLocaleString() : '--/--/---- --:--:--'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Safe Components</h3>
                  <p className="text-green-700">
                    The safe time display components prevent hydration mismatches by:
                  </p>
                  <ul className="list-disc list-inside text-green-700 mt-2 space-y-1">
                    <li>Using client-side only rendering for time formatting</li>
                    <li>Showing placeholder text during SSR</li>
                    <li>Updating to real time after hydration</li>
                  </ul>
      </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">❌ Unsafe Components</h3>
                  <p className="text-red-700">
                    The unsafe components can cause hydration errors because:
                  </p>
                  <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                    <li>Server and client render different times</li>
                    <li>Time changes between server render and client hydration</li>
                    <li>React detects the mismatch and throws an error</li>
                  </ul>
      </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">🔧 How to Fix</h3>
                  <p className="text-blue-700">
                    Always use the safe time display components when showing dates/times:
                  </p>
                  <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
{`// ❌ Don't do this
{new Date().toLocaleTimeString()}

// ✅ Do this instead
<SafeTimeDisplay date={new Date()} format="time" />`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}