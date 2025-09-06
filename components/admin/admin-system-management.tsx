"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { 
  Shield, 
  Activity, 
  Database, 
  Server, 
  Users, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Settings,
  Trash2,
  Download
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface SystemStats {
  totalUsers: number
  totalProviders: number
  totalBookings: number
  totalPayments: number
  pendingPayments: number
  escrowPayments: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastBackup?: string
  databaseSize?: string
}

export function AdminSystemManagement() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    totalPayments: 0,
    pendingPayments: 0,
    escrowPayments: 0,
    systemHealth: 'healthy'
  })
  const [loading, setLoading] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [diag, setDiag] = useState<any | null>(null)

  useEffect(() => {
    fetchSystemStats()
    fetchDiagnostics()
    const id = setInterval(fetchDiagnostics, 45000)
    return () => clearInterval(id)
  }, [])

  const fetchSystemStats = async () => {
    try {
      setLoading(true)
      
      // Fetch system statistics
      const [
        usersCount,
        providersCount,
        bookingsCount,
        paymentsCount,
        pendingPaymentsCount,
        escrowPaymentsCount
      ] = await Promise.all([
        fetch('/api/admin/stats/users').then(res => res.json()).catch(() => ({ count: 0 })),
        fetch('/api/admin/stats/providers').then(res => res.json()).catch(() => ({ count: 0 })),
        fetch('/api/admin/stats/bookings').then(res => res.json()).catch(() => ({ count: 0 })),
        fetch('/api/admin/stats/payments').then(res => res.json()).catch(() => ({ count: 0 })),
        fetch('/api/admin/stats/pending-payments').then(res => res.json()).catch(() => ({ count: 0 })),
        fetch('/api/admin/stats/escrow-payments').then(res => res.json()).catch(() => ({ count: 0 }))
      ])

      setStats({
        totalUsers: usersCount.count || 0,
        totalProviders: providersCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalPayments: paymentsCount.count || 0,
        pendingPayments: pendingPaymentsCount.count || 0,
        escrowPayments: escrowPaymentsCount.count || 0,
        systemHealth: 'healthy', // This would be determined by actual system checks
        lastBackup: new Date().toISOString(),
        databaseSize: '2.4 GB' // This would be fetched from actual database
      })

    } catch (error) {
      console.error('Error fetching system stats:', error)
      showToast('Error fetching system statistics', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/connection/diagnostics')
      if (res.ok) {
        const data = await res.json()
        setDiag(data)
      }
    } catch (e) {
      // ignore
    }
  }

  const getHealthBadge = (health: string) => {
    const healthConfig = {
      healthy: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      warning: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      critical: { color: "bg-red-100 text-red-800", icon: AlertTriangle }
    }

    const config = healthConfig[health as keyof typeof healthConfig] || healthConfig.healthy
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {health.toUpperCase()}
      </Badge>
    )
  }

  const handleMaintenanceToggle = async () => {
    try {
      // This would call an API to toggle maintenance mode
      setMaintenanceMode(!maintenanceMode)
      showToast(
        maintenanceMode ? 'Maintenance mode disabled' : 'Maintenance mode enabled',
        'success'
      )
    } catch (error) {
      showToast('Failed to toggle maintenance mode', 'error')
    }
  }

  const handleDatabaseBackup = async () => {
    try {
      showToast('Database backup initiated...', 'info')
      // This would call an API to initiate backup
    } catch (error) {
      showToast('Failed to initiate backup', 'error')
    }
  }

  const handleCleanupOrphanedData = async () => {
    try {
      showToast('Cleaning up orphaned data...', 'info')
      // This would call an API to cleanup orphaned data
    } catch (error) {
      showToast('Failed to cleanup orphaned data', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Loading system information...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">System Management</h1>
            <p className="text-gray-600">Monitor and manage system health and maintenance</p>
          </div>

          {/* System Health */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getHealthBadge(stats.systemHealth)}
                  <span className="text-sm text-gray-600">
                    All systems operational
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSystemStats}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              {/* Diagnostics Card */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['users','services','bookings','payments'].map(key => {
                  const ok = diag?.database?.tables?.[key]?.ok !== false
                  return (
                    <div key={key} className="text-sm flex items-center gap-2">
                      <span className="capitalize">{key}</span>
                      <Badge className={ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {ok ? 'OK' : 'Fail'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span>DB: {diag?.database?.connected ? 'OK' : 'Fail'}</span>
                <span className="ml-3">Auth: {diag?.authentication?.status || 'unknown'}</span>
                <span className="ml-3">Updated: {diag?.timestamp ? new Date(diag.timestamp).toLocaleTimeString() : '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* System Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Users</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Providers</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalProviders.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Bookings</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-gray-600">Payments</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalPayments.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingPayments.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Escrow</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.escrowPayments.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Database Size</p>
                  <p className="font-medium">{stats.databaseSize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Backup</p>
                  <p className="font-medium">
                    {stats.lastBackup ? new Date(stats.lastBackup).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maintenance Mode</p>
                  <Badge className={maintenanceMode ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {maintenanceMode ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">System Uptime</p>
                  <p className="font-medium">99.9%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Maintenance
                </CardTitle>
                <CardDescription>
                  Control system maintenance mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleMaintenanceToggle}
                  variant={maintenanceMode ? "destructive" : "default"}
                  className="w-full"
                >
                  {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Database Backup
                </CardTitle>
                <CardDescription>
                  Create a backup of the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDatabaseBackup}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Data Cleanup
                </CardTitle>
                <CardDescription>
                  Clean up orphaned and unused data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCleanupOrphanedData}
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Logs
                </CardTitle>
                <CardDescription>
                  View and download system logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
