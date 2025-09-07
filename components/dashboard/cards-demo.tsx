"use client"

import { ExampleDashboardCards, UpcomingBookingsCard, PaymentsCard, SupportCard } from "./example-cards"

export function CardsDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Cards Demo</h1>
          <p className="text-gray-600">
            Example dashboard cards with responsive grid layout, rounded corners, shadows, and hover effects.
          </p>
        </div>

        {/* All Cards Together */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Cards (Responsive Grid)</h2>
          <p className="text-sm text-gray-600 mb-6">
            On large screens: 3 cards per row • On mobile: stacked vertically
          </p>
          <ExampleDashboardCards />
        </div>

        {/* Individual Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Individual Cards</h2>
          <p className="text-sm text-gray-600 mb-6">
            Each card can be used independently with enhanced hover effects and interactions.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Card 1: Upcoming Bookings</h3>
              <UpcomingBookingsCard />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Card 2: Payments</h3>
              <PaymentsCard />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Card 3: Support</h3>
              <SupportCard />
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Card Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Design Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code className="bg-gray-100 px-1 rounded">rounded-xl</code> - Extra large rounded corners</li>
                <li>• <code className="bg-gray-100 px-1 rounded">shadow-md</code> - Medium shadow depth</li>
                <li>• <code className="bg-gray-100 px-1 rounded">hover:shadow-lg</code> - Large shadow on hover</li>
                <li>• <code className="bg-gray-100 px-1 rounded">p-6</code> - Consistent padding</li>
                <li>• <code className="bg-gray-100 px-1 rounded">font-bold</code> - Bold title text</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Responsive Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code className="bg-gray-100 px-1 rounded">grid-cols-1</code> - Single column on mobile</li>
                <li>• <code className="bg-gray-100 px-1 rounded">lg:grid-cols-3</code> - Three columns on large screens</li>
                <li>• <code className="bg-gray-100 px-1 rounded">gap-6</code> - Consistent spacing</li>
                <li>• <code className="bg-gray-100 px-1 rounded">transition-shadow</code> - Smooth hover animations</li>
                <li>• Touch-friendly button sizes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}