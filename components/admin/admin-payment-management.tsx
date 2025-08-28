"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Clock, Shield, CheckCircle, AlertTriangle, Zap, RefreshCw, Loader2, Trash2, AlertCircle, TrendingUp, Activity } from "lucide-react"
import { showToast } from "@/lib/toast"

interface AdminPaymentManagementProps {
  paymentStats: Array<{
    title: string
    value: string
    icon: string
    color: string
    bgColor: string
  }>
  revenueBreakdown: Array<{
    title: string
    value: string
    color: string
    bgColor: string
  }>
  pendingPayments: number
  escrowPayments: number
  totalPayouts: number
  pendingPayouts: number
}

export default function AdminPaymentManagement({
  paymentStats,
  revenueBreakdown,
  pendingPayments,
  escrowPayments,
  totalPayouts,
  pendingPayouts
}: AdminPaymentManagementProps) {
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [isRecoveringPayments, setIsRecoveringPayments] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Fix hydration issue by only setting date on client
  useEffect(() => {
    setIsClient(true)
    setLastRefresh(new Date())
  }, [])

  const handleCleanupPayouts = async () => {
    try {
      setIsCleaningUp(true)
      showToast.info('Cleaning up duplicate and orphaned payout records...')
      
      const response = await fetch('/api/payment/cleanup-orphaned-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('🧹 Cleanup result:', result)
        showToast.success(`Cleanup completed! Cleaned ${result.cleanedCount} items.`)
        
        // Refresh the page to show updated stats
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        console.error('❌ Cleanup failed:', result)
        showToast.error(`Cleanup failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      showToast.error('Cleanup failed')
    } finally {
      setIsCleaningUp(false)
    }
  }

  const handleRecoverStuckPayments = async () => {
    try {
      setIsRecoveringPayments(true)
      showToast.info('Attempting to recover stuck payments...')
      
      // First, get all pending payments
      const response = await fetch('/api/admin/payments/pending')
      if (!response.ok) {
        throw new Error('Failed to fetch pending payments')
      }
      
      const data = await response.json()
      const pendingPayments = data.payments || []
      
      if (pendingPayments.length === 0) {
        showToast.info('No pending payments found')
        return
      }
      
      showToast.info(`Found ${pendingPayments.length} pending payment(s). Attempting recovery...`)
      
      let successCount = 0
      let errorCount = 0
      
      // Attempt recovery for each pending payment
      for (const payment of pendingPayments) {
        try {
          const recoveryResponse = await fetch('/api/payment/recover-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: payment.id })
          })
          
          const result = await recoveryResponse.json()
          
          if (result.success) {
            console.log(`✅ Payment recovery successful for payment ${payment.id}:`, result)
            successCount++
          } else {
            console.error(`❌ Payment recovery failed for payment ${payment.id}:`, result)
            errorCount++
          }
        } catch (error) {
          console.error(`❌ Payment recovery error for payment ${payment.id}:`, error)
          errorCount++
        }
      }
      
      if (successCount > 0) {
        showToast.success(`Recovery completed! ${successCount} successful, ${errorCount} failed.`)
        // Refresh the page to show updated stats
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        showToast.error(`Recovery failed for all payments. Check console for details.`)
      }
      
    } catch (error) {
      console.error('Payment recovery error:', error)
      showToast.error('Payment recovery failed')
    } finally {
      setIsRecoveringPayments(false)
    }
  }

  const handleRefreshStats = () => {
    setLastRefresh(new Date())
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Payment Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
          <p className="text-gray-600">Monitor and manage all payment operations across the platform</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefreshStats}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          <span className="text-xs text-gray-500">
            Last updated: {isClient && lastRefresh ? lastRefresh.toLocaleTimeString() : 'Loading...'}
          </span>
        </div>
      </div>

      {/* Payment Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentStats.map((stat, index) => {
          const getIcon = (iconName: string) => {
            switch (iconName) {
              case "DollarSign": return DollarSign;
              case "Clock": return Clock;
              case "Shield": return Shield;
              case "CheckCircle": return CheckCircle;
              case "AlertTriangle": return AlertTriangle;
              case "Zap": return Zap;
              default: return DollarSign;
            }
          };
          const Icon = getIcon(stat.icon);
          return (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {revenueBreakdown.map((item, index) => (
          <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{item.title}</p>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                </div>
                <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                  <TrendingUp className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Health Alerts */}
      {(pendingPayments > 0 || escrowPayments > 0) && (
        <div className="space-y-4">
          {pendingPayments > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>{pendingPayments} payment(s)</strong> are currently pending and may need attention. 
                Consider using the recovery tools below if payments are stuck.
              </AlertDescription>
            </Alert>
          )}
          
          {escrowPayments > 0 && (
            <Alert className="border-purple-200 bg-purple-50">
              <Shield className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>{escrowPayments} payment(s)</strong> are currently in escrow. 
                These will be released to providers when jobs are completed and confirmed.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Admin Actions */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Admin Actions</span>
          </CardTitle>
          <CardDescription>
            Critical administrative functions for payment system maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Cleanup Payouts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Cleanup Payouts</h4>
                  <p className="text-sm text-gray-600">
                    Remove duplicate and orphaned payout records
                  </p>
                </div>
                <Badge variant="secondary">{totalPayouts} total</Badge>
              </div>
              <Button
                onClick={handleCleanupPayouts}
                disabled={isCleaningUp}
                variant="outline"
                className="w-full"
              >
                {isCleaningUp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Payouts
                  </>
                )}
              </Button>
            </div>

            {/* Recover Stuck Payments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Recover Stuck Payments</h4>
                  <p className="text-sm text-gray-600">
                    Attempt to recover payments stuck in pending status
                  </p>
                </div>
                <Badge variant="secondary">{pendingPayments} pending</Badge>
              </div>
              <Button
                onClick={handleRecoverStuckPayments}
                disabled={isRecoveringPayments}
                variant="outline"
                className="w-full"
              >
                {isRecoveringPayments ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recover Payments
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Additional Tools */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full"
              >
                <a href="/payment-debug">
                  <Zap className="w-4 h-4 mr-2" />
                  Payment Debug
                </a>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full"
              >
                <a href="/admin/webhooks">
                  <Activity className="w-4 h-4 mr-2" />
                  Webhook Monitor
                </a>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full"
              >
                <a href="/admin/payments">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Payment History
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment System Status */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Payment System Status</span>
          </CardTitle>
          <CardDescription>
            Real-time overview of payment processing health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Payment Processing</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Payments</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${pendingPayments > 0 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">{pendingPayments}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Escrow Payments</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium">{escrowPayments}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Payout System</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Payouts</span>
                  <span className="text-sm font-medium">{totalPayouts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Payouts</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${pendingPayouts > 0 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">{pendingPayouts}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
