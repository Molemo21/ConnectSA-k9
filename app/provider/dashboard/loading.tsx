import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProviderDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Dashboard Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          {/* Bookings Sections Skeleton */}
          {[...Array(3)].map((_, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-lg shadow p-8 mb-8">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-6">
                {[...Array(2)].map((_, bookingIndex) => (
                  <div key={bookingIndex} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-28 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex gap-2 md:flex-col">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* No bookings message skeleton */}
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </div>
    </div>
  )
} 