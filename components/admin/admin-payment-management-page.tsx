"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Eye,
  Loader2,
  RefreshCw,
  Shield
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface Payment {
  id: string
  amount: number
  status: string
  paystackRef: string
  escrowAmount: number
  platformFee: number
  currency: string
  paidAt?: string
  createdAt: string
  booking: {
    id: string
    scheduledDate: string
    totalAmount: number
    client: {
      name: string
      email: string
    }
    provider: {
      businessName?: string
      user: {
        name: string
        email: string
      }
    }
    service: {
      name: string
    }
  }
}

export function AdminPaymentManagementPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, statusFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      } else {
        showToast.error('Failed to fetch payments')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      showToast.error('Error fetching payments')
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = payments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.paystackRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.booking.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.booking.provider.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    setFilteredPayments(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-orange-100 text-orange-800", icon: Clock },
      ESCROW: { color: "bg-blue-100 text-blue-800", icon: Shield },
      HELD_IN_ESCROW: { color: "bg-purple-100 text-purple-800", icon: Shield },
      PROCESSING_RELEASE: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      RELEASED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REFUNDED: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      FAILED: { color: "bg-red-100 text-red-800", icon: AlertTriangle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getStatusCounts = () => {
    return {
      total: payments.length,
      pending: payments.filter(p => p.status === 'PENDING').length,
      escrow: payments.filter(p => p.status === 'ESCROW' || p.status === 'HELD_IN_ESCROW').length,
      released: payments.filter(p => p.status === 'RELEASED').length,
      failed: payments.filter(p => p.status === 'FAILED').length
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Loading payments...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
            <p className="text-gray-600">Monitor and manage payment transactions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{statusCounts.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.escrow}</div>
                <div className="text-sm text-gray-600">Escrow</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{statusCounts.released}</div>
                <div className="text-sm text-gray-600">Released</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "ALL" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("ALL")}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "PENDING" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("PENDING")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === "ESCROW" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("ESCROW")}
                  >
                    Escrow
                  </Button>
                  <Button
                    variant={statusFilter === "RELEASED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("RELEASED")}
                  >
                    Released
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPayments}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Payments ({filteredPayments.length})</CardTitle>
              <CardDescription>
                Monitor payment transactions and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            R{payment.amount.toLocaleString()}
                          </h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Reference:</strong> {payment.paystackRef}</p>
                          <p><strong>Service:</strong> {payment.booking.service.name}</p>
                          <p><strong>Client:</strong> {payment.booking.client.name} ({payment.booking.client.email})</p>
                          <p><strong>Provider:</strong> {payment.booking.provider.businessName || payment.booking.provider.user.name}</p>
                          <p><strong>Escrow:</strong> R{payment.escrowAmount.toLocaleString()}</p>
                          <p><strong>Platform Fee:</strong> R{payment.platformFee.toLocaleString()}</p>
                          <p><strong>Created:</strong> {new Date(payment.createdAt).toLocaleDateString()}</p>
                          {payment.paidAt && (
                            <p><strong>Paid:</strong> {new Date(payment.paidAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredPayments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No payments found matching your criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
