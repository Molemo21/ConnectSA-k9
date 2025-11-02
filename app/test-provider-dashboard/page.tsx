"use client"

import React from "react"
import { UnifiedProviderDashboard } from "@/components/provider/provider-dashboard-unified"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"

// Mock user data for testing
const mockProviderUser = {
  id: "test-provider-user-id",
  email: "test.provider@example.com",
  name: "Test Provider",
  role: "PROVIDER" as const,
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export default function TestProviderDashboardPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10">
        {/* Test Banner */}
        <div className="bg-yellow-500/20 border-b border-yellow-500/50 p-4">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
              <div>
                <h2 className="text-lg font-bold text-yellow-300 mb-1">🧪 TEST MODE - Provider Dashboard</h2>
                <p className="text-sm text-yellow-200/80">
                  This is a test page for the provider dashboard. Changes here won't affect the actual dashboard.
                </p>
              </div>
              <a
                href="/"
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>

        {/* Provider Dashboard Component */}
        <UnifiedProviderDashboard initialUser={mockProviderUser} />
      </div>
    </div>
  )
}

