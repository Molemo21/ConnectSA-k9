"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap } from "lucide-react"

interface AdminSystemHealthProps {
  totalBookings: number
  pendingPayments: number
  escrowPayments: number
  pendingPayouts: number
}

export default function AdminSystemHealth({
  totalBookings,
  pendingPayments,
  escrowPayments,
  pendingPayouts
}: AdminSystemHealthProps) {
  // Calculate system health indicators
  const hasPendingPayments = pendingPayments > 0
  const hasEscrowPayments = escrowPayments > 0
  const hasPendingPayouts = pendingPayouts > 0
  
  // Determine overall system health
  const getSystemHealth = () => {
    if (pendingPayments > 5) return { status: 'critical', color: 'red', icon: AlertTriangle }
    if (pendingPayments > 0 || pendingPayouts > 0) return { status: 'warning', color: 'orange', icon: Clock }
    return { status: 'healthy', color: 'green', icon: CheckCircle }
  }

  const systemHealth = getSystemHealth()
  const HealthIcon = systemHealth.icon

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>System Health Monitoring</span>
        </CardTitle>
        <CardDescription>
          Real-time monitoring of platform health and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall System Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full bg-${systemHealth.color}-500`}></div>
              <span className="font-medium text-gray-900">System Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <HealthIcon className={`w-5 h-5 text-${systemHealth.color}-600`} />
              <Badge 
                variant={systemHealth.status === 'healthy' ? 'default' : 'secondary'}
                className={`bg-${systemHealth.color}-100 text-${systemHealth.color}-800`}
              >
                {systemHealth.status === 'healthy' ? 'Healthy' : 
                 systemHealth.status === 'warning' ? 'Warning' : 'Critical'}
              </Badge>
            </div>
          </div>

          {/* Health Indicators Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment System Health */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Payment System</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Payments</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${hasPendingPayments ? 'bg-orange-500' : 'bg-green-500'}`}></div>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Status</span>
                  <Badge 
                    variant={hasPendingPayments ? 'secondary' : 'default'}
                    className={hasPendingPayments ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}
                  >
                    {hasPendingPayments ? 'Needs Attention' : 'Healthy'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Payout System Health */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Payout System</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Payouts</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${hasPendingPayouts ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">{pendingPayouts}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Status</span>
                  <Badge 
                    variant={hasPendingPayouts ? 'secondary' : 'default'}
                    className={hasPendingPayouts ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}
                  >
                    {hasPendingPayouts ? 'Processing' : 'Healthy'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="space-y-4">
            {hasPendingPayments && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>{pendingPayments} payment(s)</strong> are currently pending and may require manual intervention. 
                  Consider using the payment recovery tools in the Payment Management section.
                </AlertDescription>
              </Alert>
            )}

            {hasEscrowPayments && (
              <Alert className="border-purple-200 bg-purple-50">
                <Shield className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  <strong>{escrowPayments} payment(s)</strong> are currently in escrow. 
                  This is normal operation - payments will be released when jobs are completed.
                </AlertDescription>
              </Alert>
            )}

            {hasPendingPayouts && (
              <Alert className="border-blue-200 bg-blue-50">
                <Activity className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>{pendingPayouts} payout(s)</strong> are currently being processed. 
                  This is normal operation - payouts are processed automatically.
                </AlertDescription>
              </Alert>
            )}

            {!hasPendingPayments && !hasEscrowPayments && !hasPendingPayouts && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>All systems are operating normally.</strong> No pending payments or payouts detected.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{pendingPayments + escrowPayments}</div>
              <div className="text-sm text-gray-600">Active Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{pendingPayouts}</div>
              <div className="text-sm text-gray-600">Pending Payouts</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
