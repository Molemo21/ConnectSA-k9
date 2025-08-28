import { Loader2, Banknote } from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"

export default function BankDetailsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Bank Account Details
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Set up your bank account to receive payments from completed jobs
              </p>
            </div>
          </div>

          {/* Loading Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Loading Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-12 bg-gray-200 rounded flex-1 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded flex-1 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Loading Info Cards */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-28 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
