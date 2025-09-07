"use client"

import { useState } from "react"
import { DarkDashboard } from "./dark-dashboard"
import { DarkHeader, DarkHeaderCompact } from "./dark-header"
import { DarkExampleCards, DarkUpcomingBookingsCard, DarkPaymentsCard, DarkSupportCard } from "./dark-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Palette, Monitor, Smartphone, Eye, Code, Zap, 
  ArrowRight, CheckCircle, Star, Heart
} from "lucide-react"

export function DarkThemeDemo() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'components' | 'showcase'>('dashboard')
  const [actionLog, setActionLog] = useState<string[]>([])

  const logAction = (action: string) => {
    setActionLog(prev => [`${new Date().toLocaleTimeString()}: ${action}`, ...prev.slice(0, 4)])
  }

  const handleAddBooking = () => logAction("Add Booking clicked")
  const handleMakePayment = () => logAction("Make Payment clicked")
  const handleContactSupport = () => logAction("Contact Support clicked")

  if (currentView === 'dashboard') {
    return <DarkDashboard />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      
      {/* Demo Header */}
      <DarkHeader 
        title="Dark Theme Demo"
        onAddBooking={handleAddBooking}
        onMakePayment={handleMakePayment}
        onContactSupport={handleContactSupport}
      />
      
      {/* Main Content */}
      <div className="pt-20 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Navigation */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              onClick={() => setCurrentView('dashboard')}
              className={`rounded-full transition-all duration-200 ${
                currentView === 'dashboard' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white' 
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Full Dashboard
            </Button>
            <Button
              onClick={() => setCurrentView('components')}
              className={`rounded-full transition-all duration-200 ${
                currentView === 'components' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white' 
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              <Code className="w-4 h-4 mr-2" />
              Components
            </Button>
            <Button
              onClick={() => setCurrentView('showcase')}
              className={`rounded-full transition-all duration-200 ${
                currentView === 'showcase' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white' 
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              <Palette className="w-4 h-4 mr-2" />
              Theme Showcase
            </Button>
          </div>

          {currentView === 'components' && (
            <>
              {/* Header Variations */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
                  <Monitor className="w-6 h-6 mr-3 text-purple-400" />
                  Header Components
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Standard Header</h3>
                    <div className="relative bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <DarkHeader 
                        title="Dashboard"
                        onAddBooking={handleAddBooking}
                        onMakePayment={handleMakePayment}
                        onContactSupport={handleContactSupport}
                        className="relative"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Compact Header (Mobile)</h3>
                    <div className="relative bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <DarkHeaderCompact 
                        title="Dashboard"
                        onAddBooking={handleAddBooking}
                        onMakePayment={handleMakePayment}
                        onContactSupport={handleContactSupport}
                        className="relative"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Components */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-purple-400" />
                  Card Components
                </h2>
                
                <DarkExampleCards />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Enhanced Bookings Card</h3>
                    <DarkUpcomingBookingsCard />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Enhanced Payments Card</h3>
                    <DarkPaymentsCard />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Enhanced Support Card</h3>
                    <DarkSupportCard />
                  </div>
                </div>
              </div>

              {/* Action Log */}
              <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-purple-400" />
                    Interaction Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {actionLog.length === 0 ? (
                    <p className="text-sm text-gray-400">Click buttons above to see interactions logged here.</p>
                  ) : (
                    <div className="space-y-2">
                      {actionLog.map((action, index) => (
                        <div key={index} className="text-sm text-gray-300 font-mono bg-gray-800 p-2 rounded">
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {currentView === 'showcase' && (
            <>
              {/* Theme Overview */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
                  <Palette className="w-6 h-6 mr-3 text-purple-400" />
                  Dark Modern Theme
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-gray-100">Design Philosophy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Modern dark aesthetic with subtle gradients</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>High contrast for excellent readability</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Smooth micro-interactions and hover effects</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Purple accent color for brand consistency</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-gray-100">Technical Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-start space-x-2">
                          <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>Backdrop blur effects for modern glass morphism</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>Responsive design with mobile-first approach</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>Smooth transitions with 200ms duration</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>Accessible color contrast ratios</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Color Palette */}
              <div className="mb-12">
                <h3 className="text-xl font-bold text-gray-100 mb-6">Color Palette</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Background Colors */}
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-gray-950 rounded-lg border border-gray-800"></div>
                    <div className="text-xs text-gray-400">bg-gray-950</div>
                    <div className="text-xs text-gray-500">Main Background</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-gray-900 rounded-lg border border-gray-800"></div>
                    <div className="text-xs text-gray-400">bg-gray-900</div>
                    <div className="text-xs text-gray-500">Card Background</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-gray-800 rounded-lg border border-gray-700"></div>
                    <div className="text-xs text-gray-400">bg-gray-800</div>
                    <div className="text-xs text-gray-500">Secondary Elements</div>
                  </div>
                  
                  {/* Text Colors */}
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-gray-100 rounded-lg border border-gray-300"></div>
                    <div className="text-xs text-gray-400">text-gray-100</div>
                    <div className="text-xs text-gray-500">Primary Text</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-gray-400 rounded-lg border border-gray-500"></div>
                    <div className="text-xs text-gray-400">text-gray-400</div>
                    <div className="text-xs text-gray-500">Secondary Text</div>
                  </div>
                  
                  {/* Accent Colors */}
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg"></div>
                    <div className="text-xs text-gray-400">Purple Gradient</div>
                    <div className="text-xs text-gray-500">Primary Actions</div>
                  </div>
                </div>
              </div>

              {/* Component Examples */}
              <div className="mb-12">
                <h3 className="text-xl font-bold text-gray-100 mb-6">Interactive Elements</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Buttons */}
                  <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4">Buttons</h4>
                    <div className="space-y-3">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105">
                        Primary Button
                      </Button>
                      <Button className="w-full bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200 border border-gray-700">
                        Secondary Button
                      </Button>
                      <Button variant="ghost" className="w-full text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-all duration-200">
                        Ghost Button
                      </Button>
                    </div>
                  </Card>
                  
                  {/* Badges */}
                  <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4">Badges</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-purple-900/50 text-purple-400 border-purple-800/50">Purple</Badge>
                      <Badge className="bg-green-900/50 text-green-400 border-green-800/50">Success</Badge>
                      <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-800/50">Warning</Badge>
                      <Badge className="bg-red-900/50 text-red-400 border-red-800/50">Error</Badge>
                      <Badge className="bg-blue-900/50 text-blue-400 border-blue-800/50">Info</Badge>
                    </div>
                  </Card>
                  
                  {/* Cards */}
                  <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-6">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-red-400" />
                      Interactive Card
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                      This card demonstrates hover effects with scale and shadow transitions.
                    </p>
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white">
                      Try Hover
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Card>
                </div>
              </div>

              {/* CSS Classes Reference */}
              <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-100">CSS Classes Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-100 mb-3">Background & Layout</h4>
                      <div className="space-y-2 text-sm">
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">bg-gray-950</code> - Main background</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">bg-gray-900</code> - Card backgrounds</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">bg-gray-800</code> - Secondary elements</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">border-gray-800</code> - Subtle borders</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">rounded-xl</code> - Card corners</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-100 mb-3">Interactive Effects</h4>
                      <div className="space-y-2 text-sm">
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">hover:scale-105</code> - Hover scale</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">hover:shadow-xl</code> - Enhanced shadow</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">transition-all duration-200</code> - Smooth transitions</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">backdrop-blur</code> - Glass effect</div>
                        <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-400">animate-pulse</code> - Pulse animation</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}