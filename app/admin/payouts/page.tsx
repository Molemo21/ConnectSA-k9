"use client"

import { useState, useEffect, useCallback } from "react"
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
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye,
  Loader2,
  RefreshCw,
  Receipt,
  Printer,
  Copy,
  ExternalLink
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { useSocket, SocketEvent } from "@/lib/socket-client"

interface Payout {
  id: string
  amount: number
  status: string
  createdAt: string
  updatedAt: string
  provider: {
    id: string
    name: string
    email: string
    bankName: string | null
    bankCode: string | null
    accountNumber: string | null
    accountName: string | null
  }
  payment: {
    id: string
    paystackRef: string
    amount: number
    escrowAmount: number | null
    platformFee: number | null
    paidAt: string | null
  }
  booking: {
    id: string
    serviceName: string | null
    totalAmount: number
    scheduledDate: string
    client: {
      name: string
      email: string
    }
  }
}

interface PayoutReceipt {
  payoutId: string
  status: string
  createdAt: string
  provider: {
    businessName: string | null
    contactName: string
    email: string
    bankDetails: {
      bankName: string | null
      bankCode: string | null
      accountNumber: string | null
      accountName: string | null
    }
  }
  booking: {
    id: string
    serviceName: string | null
    scheduledDate: string
    address: string
    client: {
      name: string
      email: string
    }
  }
  payment: {
    paystackRef: string
    paidAt: string | null
    currency: string
  }
  amounts: {
    totalPayment: number
    platformFee: number
    providerAmount: number
    breakdown: {
      total: string
      platformFee: string
      providerAmount: string
    }
  }
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [receipt, setReceipt] = useState<PayoutReceipt | null>(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  // Socket integration for real-time updates
  const { socket, connected } = useSocket()

  // Handle payout updates via socket
  useEffect(() => {
    if (!socket || !connected) return

    const handlePayoutUpdate = (event: SocketEvent) => {
      console.log('💰 Admin payout update received:', event)
      
      if (event.action === 'created') {
        // New payout created - refresh list
        console.log('🔄 New payout created, refreshing list...')
        fetchPayouts()
        showToast.success('New payout request received')
      } else if (event.action === 'completed') {
        // Payout completed - refresh list and close receipt if open
        console.log('✅ Payout completed, refreshing list...')
        fetchPayouts()
        if (receipt && receipt.payoutId === event.data.id) {
          setReceipt(null)
          setSelectedPayout(null)
        }
        showToast.success(`Payout of R${event.data.amount?.toFixed(2) || '0.00'} marked as completed`)
      }
    }

    const handlePaymentUpdate = (event: SocketEvent) => {
      if (event.action === 'status_changed' && event.data.status === 'RELEASED') {
        // Payment released - refresh payouts
        console.log('💳 Payment released, refreshing payouts...')
        fetchPayouts()
      }
    }

    socket.on('payout_update', handlePayoutUpdate)
    socket.on('payment_update', handlePaymentUpdate)

    return () => {
      socket.off('payout_update', handlePayoutUpdate)
      socket.off('payment_update', handlePaymentUpdate)
    }
  }, [socket, connected, receipt])

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter])

  useEffect(() => {
    filterPayouts()
  }, [payouts, searchTerm])

  // Auto-refresh every 15 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing payouts (fallback)')
      fetchPayouts()
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [])

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Page visible, refreshing payouts')
        fetchPayouts()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true)
      console.log(`📥 Fetching payouts with status: ${statusFilter}`)
      const response = await fetch(`/api/admin/payouts/pending?status=${statusFilter}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Fetched ${data.payouts?.length || 0} payouts:`, data)
        setPayouts(data.payouts || [])
        
        if (data.payouts && data.payouts.length > 0) {
          console.log('📋 Payouts received:', data.payouts.map((p: Payout) => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            provider: p.provider.name
          })))
        } else {
          console.log('ℹ️ No payouts found with status:', statusFilter)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Failed to fetch payouts:', response.status, errorData)
        showToast.error(`Failed to fetch payouts: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Error fetching payouts:', error)
      showToast.error('Error fetching payouts')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const filterPayouts = () => {
    let filtered = payouts

    if (searchTerm) {
      filtered = filtered.filter(payout =>
        payout.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.payment.paystackRef.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPayouts(filtered)
  }

  const fetchReceipt = async (payoutId: string) => {
    try {
      setLoadingReceipt(true)
      const response = await fetch(`/api/admin/payouts/${payoutId}/receipt`)
      if (response.ok) {
        const data = await response.json()
        setReceipt(data.receipt)
        setSelectedPayout(payouts.find(p => p.id === payoutId) || null)
      } else {
        showToast.error('Failed to fetch receipt')
      }
    } catch (error) {
      console.error('Error fetching receipt:', error)
      showToast.error('Error fetching receipt')
    } finally {
      setLoadingReceipt(false)
    }
  }

  const markAsPaid = async (payoutId: string) => {
    if (!confirm('Have you transferred the money via Paystack? Mark this payout as paid?')) {
      return
    }

    try {
      setMarkingPaid(payoutId)
      const response = await fetch(`/api/admin/payouts/${payoutId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paystackTransferRef: prompt('Enter Paystack transfer reference (optional):') || undefined
        })
      })

      if (response.ok) {
        showToast.success('Payout marked as paid successfully')
        fetchPayouts()
        setReceipt(null)
        setSelectedPayout(null)
      } else {
        const data = await response.json()
        showToast.error(data.error || 'Failed to mark payout as paid')
      }
    } catch (error) {
      console.error('Error marking payout as paid:', error)
      showToast.error('Error marking payout as paid')
    } finally {
      setMarkingPaid(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast.success('Copied to clipboard')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      PENDING: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      PROCESSING: { className: "bg-blue-100 text-blue-800", label: "Processing" },
      COMPLETED: { className: "bg-green-100 text-green-800", label: "Completed" },
      FAILED: { className: "bg-red-100 text-red-800", label: "Failed" }
    }
    const variant = variants[status] || { className: "bg-gray-100 text-gray-800", label: status }
    return <Badge className={variant.className}>{variant.label}</Badge>
  }

  const statusCounts = {
    pending: payouts.filter(p => p.status === 'PENDING').length,
    processing: payouts.filter(p => p.status === 'PROCESSING').length,
    completed: payouts.filter(p => p.status === 'COMPLETED').length,
    failed: payouts.filter(p => p.status === 'FAILED').length,
    total: payouts.length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payout Management</h1>
            <p className="text-gray-600">Manage provider payouts and process transfers via Paystack</p>
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
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.processing}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
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
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by provider, client, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('PENDING')}
                    size="sm"
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === 'PROCESSING' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('PROCESSING')}
                    size="sm"
                  >
                    Processing
                  </Button>
                  <Button
                    variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('COMPLETED')}
                    size="sm"
                  >
                    Completed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchPayouts}
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Modal */}
          {receipt && (
            <Card className="mb-6 border-2 border-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Payout Receipt
                    </CardTitle>
                    <CardDescription>All details needed to process this payout via Paystack</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReceipt(null)
                      setSelectedPayout(null)
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Provider Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name:</span>
                      <span className="font-medium">{receipt.provider.businessName || receipt.provider.contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium">{receipt.provider.contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{receipt.provider.email}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Bank Details:</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank:</span>
                          <span className="font-medium">{receipt.provider.bankDetails.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{receipt.provider.bankDetails.accountNumber || 'N/A'}</span>
                            {receipt.provider.bankDetails.accountNumber && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(receipt.provider.bankDetails.accountNumber!)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Name:</span>
                          <span className="font-medium">{receipt.provider.bankDetails.accountName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank Code:</span>
                          <span className="font-medium">{receipt.provider.bankDetails.bankCode || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Booking Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{receipt.booking.serviceName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium">{receipt.booking.client.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client Email:</span>
                      <span className="font-medium">{receipt.booking.client.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled Date:</span>
                      <span className="font-medium">{new Date(receipt.booking.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium text-right">{receipt.booking.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Payment Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paystack Reference:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{receipt.payment.paystackRef}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(receipt.payment.paystackRef)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid At:</span>
                      <span className="font-medium">
                        {receipt.payment.paidAt ? new Date(receipt.payment.paidAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Amount Breakdown</h3>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3 border-2 border-blue-200">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total Payment:</span>
                      <span className="font-bold text-blue-700">{receipt.amounts.breakdown.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee:</span>
                      <span className="font-medium">{receipt.amounts.breakdown.platformFee}</span>
                    </div>
                    <div className="border-t-2 border-blue-300 pt-3 flex justify-between text-xl">
                      <span className="font-bold">Amount to Pay Provider:</span>
                      <span className="font-bold text-green-700">{receipt.amounts.breakdown.providerAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {receipt.status === 'PENDING' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => markAsPaid(receipt.payoutId)}
                      disabled={markingPaid === receipt.payoutId}
                      className="flex-1"
                    >
                      {markingPaid === receipt.payoutId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Paid
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://dashboard.paystack.com', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Paystack
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payouts List */}
          <Card>
            <CardHeader>
              <CardTitle>Payouts ({filteredPayouts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-semibold text-lg">R{payout.amount.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">
                              {payout.provider.name} • {payout.booking.serviceName || 'Service'}
                            </div>
                          </div>
                          {getStatusBadge(payout.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mt-2">
                          <p><strong>Provider:</strong> {payout.provider.email}</p>
                          <p><strong>Client:</strong> {payout.booking.client.name} ({payout.booking.client.email})</p>
                          <p><strong>Paystack Ref:</strong> {payout.payment.paystackRef}</p>
                          <p><strong>Created:</strong> {new Date(payout.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchReceipt(payout.id)}
                          disabled={loadingReceipt}
                        >
                          {loadingReceipt && selectedPayout?.id === payout.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              View Receipt
                            </>
                          )}
                        </Button>
                        {payout.status === 'PENDING' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              fetchReceipt(payout.id)
                              setTimeout(() => {
                                const element = document.getElementById('receipt-section')
                                element?.scrollIntoView({ behavior: 'smooth' })
                              }, 500)
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredPayouts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No payouts found matching your criteria.
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
