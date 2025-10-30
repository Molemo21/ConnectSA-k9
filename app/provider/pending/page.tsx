"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { CheckCircle, Clock, FileText, AlertCircle, RefreshCw, ArrowRight, Mail, Phone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProviderStatus {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE'
  businessName?: string
}

export default function ProviderPendingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Update time elapsed every minute
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [])

  // Fetch provider status
  useEffect(() => {
    const fetchProviderStatus = async () => {
      try {
        setStatusLoading(true)
        const response = await fetch('/api/provider/status')
        if (response.ok) {
          const data = await response.json()
          const provider = data.provider
          
          if (provider) {
            setProviderStatus({
              status: provider.status,
              businessName: provider.businessName
            })
            
            // If provider is approved, redirect to dashboard
            if (provider.status === 'APPROVED') {
              router.push('/provider/dashboard')
              return
            }
            
            // If provider is rejected or incomplete, redirect to onboarding
            if (provider.status === 'REJECTED' || provider.status === 'INCOMPLETE') {
              router.push('/provider/onboarding')
              return
            }
          }
        }
      } catch (error) {
        console.error('Error fetching provider status:', error)
      } finally {
        setStatusLoading(false)
      }
    }

    fetchProviderStatus()
  }, [router])

  const formatTimeElapsed = (minutes: number) => {
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="min-h-screen relative overflow-hidden gradient-bg-dark">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/pending.jpg')"
          }}
        />
        {/* Dim overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/40"></div>
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-purple-900/30 to-slate-900/30"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <BrandHeaderClient />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-8 shadow-2xl shadow-yellow-500/25 animate-pulse">
              <Clock className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent drop-shadow-2xl">
              Application Under Review
            </h1>
            
            <p className="text-xl text-white max-w-2xl mx-auto mb-8 drop-shadow-lg font-medium">
              Thank you for submitting your provider application! Our team is carefully reviewing your information.
            </p>

            {timeElapsed > 0 && (
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-white shadow-lg">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-bold">
                  Review time: {formatTimeElapsed(timeElapsed)}
                </span>
              </div>
            )}
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-0 shadow-2xl bg-black/20 backdrop-blur-md border-white/30 hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">Document Review</h3>
                <p className="text-white/90 text-sm drop-shadow-md">Verifying your credentials and documents</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-black/20 backdrop-blur-md border-white/30 hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">Background Check</h3>
                <p className="text-white/90 text-sm drop-shadow-md">Validating your business information</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-black/20 backdrop-blur-md border-white/30 hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">Final Approval</h3>
                <p className="text-white/90 text-sm drop-shadow-md">Admin review and approval process</p>
              </CardContent>
            </Card>
          </div>

          {/* What Happens Next */}
          <Card className="border-0 shadow-2xl bg-black/20 backdrop-blur-md border-white/30 mb-8">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-white text-center drop-shadow-lg">
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 bg-black/10 rounded-xl hover:bg-black/20 transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2 drop-shadow-lg">Email Notification</h4>
                    <p className="text-white/90 drop-shadow-md">You'll receive an email within 2-3 business days with the review results.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-black/10 rounded-xl hover:bg-black/20 transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2 drop-shadow-lg">Profile Activation</h4>
                    <p className="text-white/90 drop-shadow-md">Once approved, your profile will be live and visible to clients.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-black/10 rounded-xl hover:bg-black/20 transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2 drop-shadow-lg">Start Earning</h4>
                    <p className="text-white/90 drop-shadow-md">Begin receiving booking requests and grow your business.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-black/10 rounded-xl hover:bg-black/20 transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2 drop-shadow-lg">Support Available</h4>
                    <p className="text-white/90 drop-shadow-md">Our team is here to help you succeed on the platform.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-2xl bg-black/20 backdrop-blur-md border-white/30 mb-8">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold text-white text-center drop-shadow-lg">
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-6 bg-black/10 rounded-xl hover:bg-black/20 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white drop-shadow-lg">Email Support</h4>
                    <p className="text-white/90 drop-shadow-md">support@proliinkconnect.co.za</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-black/10 rounded-xl hover:bg-black/20 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white drop-shadow-lg">Phone Support</h4>
                    <p className="text-white/90 drop-shadow-md">+27 11 123 4567</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-black/30 border-white/40 text-white hover:bg-black/40 hover:border-white/50 transition-all duration-300 backdrop-blur-sm px-8 py-4 h-14 shadow-lg hover:shadow-xl transform hover:scale-105"
              disabled={statusLoading}
            >
              {statusLoading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-3" />
              )}
              <span className="font-semibold">
                {statusLoading ? 'Checking Status...' : 'Refresh Status'}
              </span>
            </Button>
            
            {/* Only show dashboard button for APPROVED providers */}
            {providerStatus?.status === 'APPROVED' && (
              <Button
                onClick={() => router.push('/provider/dashboard')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 px-8 py-4 h-14"
              >
                <ArrowRight className="w-5 h-5 mr-3" />
                <span className="font-semibold">Go to Dashboard</span>
              </Button>
            )}
            
            {/* Show application status button for PENDING providers */}
            {providerStatus?.status === 'PENDING' && (
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105 px-8 py-4 h-14"
              >
                <FileText className="w-5 h-5 mr-3" />
                <span className="font-semibold">View Application Status</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileBottomNav userRole="PROVIDER" />
      <MobileFloatingActionButton userRole="PROVIDER" />
    </div>
  )
}
                  <div>
                    <h4 className="text-lg font-bold text-white drop-shadow-lg">Email Support</h4>
                    <p className="text-white/90 drop-shadow-md">support@proliinkconnect.co.za</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-black/10 rounded-xl hover:bg-black/20 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white drop-shadow-lg">Phone Support</h4>
                    <p className="text-white/90 drop-shadow-md">+27 11 123 4567</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-black/30 border-white/40 text-white hover:bg-black/40 hover:border-white/50 transition-all duration-300 backdrop-blur-sm px-8 py-4 h-14 shadow-lg hover:shadow-xl transform hover:scale-105"
              disabled={statusLoading}
            >
              {statusLoading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-3" />
              )}
              <span className="font-semibold">
                {statusLoading ? 'Checking Status...' : 'Refresh Status'}
              </span>
            </Button>
            
            {/* Only show dashboard button for APPROVED providers */}
            {providerStatus?.status === 'APPROVED' && (
              <Button
                onClick={() => router.push('/provider/dashboard')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 px-8 py-4 h-14"
              >
                <ArrowRight className="w-5 h-5 mr-3" />
                <span className="font-semibold">Go to Dashboard</span>
              </Button>
            )}
            
            {/* Show application status button for PENDING providers */}
            {providerStatus?.status === 'PENDING' && (
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105 px-8 py-4 h-14"
              >
                <FileText className="w-5 h-5 mr-3" />
                <span className="font-semibold">View Application Status</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileBottomNav userRole="PROVIDER" />
      <MobileFloatingActionButton userRole="PROVIDER" />
    </div>
  )
}