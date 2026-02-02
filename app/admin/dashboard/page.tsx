"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ConsolidatedMobileHeaderAdmin } from "@/components/ui/consolidated-mobile-header-admin"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { DesktopSidebarAdmin } from "@/components/admin/desktop-sidebar-admin"
import { MainContentAdmin } from "@/components/admin/main-content-admin"
import { RefreshCw, Loader2 } from "lucide-react"
import { showToast } from "@/lib/toast"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"


interface AdminStats {
  totalUsers: number
  totalProviders: number
  pendingProviders: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  pendingRevenue: number
  escrowRevenue: number
  averageRating: number
  totalPayments: number
  pendingPayments: number
  escrowPayments: number
  completedPayments: number
  failedPayments: number
  totalPayouts: number
  pendingPayouts: number
  completedPayouts: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()

  const fetchAdminData = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      console.log('Admin dashboard: Starting data fetch...')
      
      // Fetch user data
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('Admin dashboard: User response status:', userResponse.status)
      
      if (!userResponse.ok) {
        console.log('Auth failed, redirecting to login')
        router.push("/login")
        return
      }
      
      const userData = await userResponse.json()
      const user = userData.user
      
      console.log('Admin dashboard: User data received:', user)
      console.log('Admin dashboard: User role:', user?.role)
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push("/login")
        return
      }
      
      // Normalize role to uppercase for comparison
      const userRole = (user.role || "").toUpperCase().trim()
      
      if (userRole !== "ADMIN") {
        console.log(`User is not admin (role: ${userRole}), redirecting to appropriate dashboard`)
        // Use proper dashboard path based on role
        if (userRole === "PROVIDER") {
          // Check provider status and redirect accordingly
          const providerRes = await fetch('/api/provider/status', {
            credentials: 'include'
          })
          if (providerRes.ok) {
            const providerData = await providerRes.json()
            const status = providerData.provider?.status
            if (status === "INCOMPLETE" || status === "REJECTED") {
              router.push("/provider/onboarding")
            } else if (status === "PENDING") {
              router.push("/provider/pending")
            } else if (status === "APPROVED" || status === "ACTIVE") {
              router.push("/provider/dashboard")
            } else {
              router.push("/provider/onboarding")
            }
          } else {
            router.push("/provider/onboarding")
          }
        } else if (userRole === "CLIENT") {
          router.push("/dashboard")
        } else {
          router.push("/login")
        }
        return
      }
      
      setUser(user)
      console.log('User set, fetching stats...')
      
      // Fetch stats data
      const statsResponse = await fetch('/api/admin/stats', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('Admin dashboard: Stats response status:', statsResponse.status)
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('Admin dashboard: Stats data received:', statsData)
        setStats(statsData)
        showToast.success('Dashboard refreshed successfully')
      } else {
        console.error('Failed to fetch stats:', statsResponse.status)
        setError('Failed to fetch admin statistics')
        showToast.error('Failed to refresh dashboard')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Error fetching data')
      showToast.error('Error refreshing dashboard')
    } finally {
      console.log('Admin dashboard: Setting loading to false')
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    fetchAdminData()
  }, [fetchAdminData])

  const handleRefresh = () => {
    fetchAdminData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center p-4 bg-red-900/30 border border-red-400/50 rounded-lg">
          <p className="text-red-400 text-lg mb-2">Error loading dashboard:</p>
          <p className="text-red-200 text-sm">{error}</p>
          <Button onClick={handleRefresh} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const totalBookings = stats?.totalBookings || 0
  const pendingBookings = stats?.pendingProviders || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Brand Header - Desktop/Tablet Only */}
      <div className="hidden lg:block">
        <BrandHeaderClient 
          showAuth={false} 
          showUserMenu={true} 
          userStats={{
            totalBookings,
            pendingBookings,
            completedBookings: stats?.completedBookings || 0,
            rating: stats?.averageRating || 0
          }}
        />
      </div>
      
      {/* Desktop/Tablet Layout */}
      <div className="hidden lg:flex min-h-screen">
        <DesktopSidebarAdmin
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          totalBookings={totalBookings}
          pendingBookings={pendingBookings}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <MainContentAdmin
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          stats={stats}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ConsolidatedMobileHeaderAdmin
          user={user}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          totalBookings={totalBookings}
          pendingBookings={pendingBookings}
          hasNotifications={true}
          className="bg-black/70 backdrop-blur-sm border-b border-white/20"
        />
        <MainContentAdmin
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          stats={stats}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
} 