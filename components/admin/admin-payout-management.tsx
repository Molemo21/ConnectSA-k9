"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

export function AdminPayoutManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [receipt, setReceipt] = useState<PayoutReceipt | null>(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  
  // Track last refresh time to prevent too frequent refreshes
  const lastRefreshRef = useRef<number>(0)
  const isInteractingRef = useRef<boolean>(false)

  // Socket integration for real-time updates
  const { socket, connected } = useSocket()

  // Handle payout updates via socket - with interaction check
  useEffect(() => {
    if (!socket || !connected) return

    const handlePayoutUpdate = (event: SocketEvent) => {
      console.log('💰 Admin payout update received:', event)
      
      // Don't refresh if user is interacting
      if (isInteractingRef.current || loading || loadingReceipt || markingPaid) {
        console.log('⏸️ Skipping refresh - user is interacting')
        return
      }
      
      if (event.action === 'created') {
        console.log('🔄 New payout created, refreshing list...')
        fetchPayouts()
        showToast.success('New payout request received')
      } else if (event.action === 'completed') {
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
        // Don't refresh if user is interacting
        if (isInteractingRef.current || loading || loadingReceipt || markingPaid) {
          return
        }
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
  }, [socket, connected, receipt, loading, loadingReceipt, markingPaid])

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter])

  useEffect(() => {
    filterPayouts()
  }, [payouts, searchTerm])

  // Auto-refresh every 60 seconds as fallback - only if not interacting
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
      // Only refresh if:
      // 1. Page is visible
      // 2. Not currently loading
      // 3. User is not interacting
      // 4. At least 60 seconds have passed
      if (!document.hidden && 
          !loading && 
          !loadingReceipt && 
          !markingPaid && 
          !isInteractingRef.current &&
          timeSinceLastRefresh >= 60000) {
        console.log('🔄 Auto-refreshing payouts (fallback)')
        fetchPayouts()
      }
    }, 60000) // Check every 60 seconds

    return () => clearInterval(interval)
  }, [loading, loadingReceipt, markingPaid])

  // Refresh when page becomes visible - with cooldown
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
        // Only refresh if it's been more than 30 seconds since last refresh
        // and user is not interacting
        if (timeSinceLastRefresh > 30000 && 
            !loading && 
            !loadingReceipt && 
            !markingPaid && 
            !isInteractingRef.current) {
          console.log('📱 Page visible, refreshing payouts')
          lastRefreshRef.current = Date.now()
          fetchPayouts()
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loading, loadingReceipt, markingPaid])

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true)
      isInteractingRef.current = false // Reset interaction flag
      lastRefreshRef.current = Date.now()
      
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
      isInteractingRef.current = true
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
      // Reset interaction flag after a delay
      setTimeout(() => {
        isInteractingRef.current = false
      }, 2000)
    }
  }

  const markAsPaid = async (payoutId: string) => {
    if (!confirm('Have you transferred the money via Paystack? Mark this payout as paid?')) {
      return
    }

    try {
      isInteractingRef.current = true
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
      // Reset interaction flag after a delay
      setTimeout(() => {
        isInteractingRef.current = false
      }, 2000)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Payout Management</h2>
        <p className="text-gray-400">Manage provider payouts and process transfers via Paystack</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{statusCounts.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{statusCounts.processing}</div>
            <div className="text-sm text-gray-400">Processing</div>
          </CardContent>
        </Card>
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{statusCounts.completed}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{statusCounts.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by provider, client, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                onClick={() => {
                  isInteractingRef.current = true
                  setStatusFilter('PENDING')
                  setTimeout(() => { isInteractingRef.current = false }, 1000)
                }}
                size="sm"
                className={statusFilter === 'PENDING' ? '' : 'border-white/20 text-white hover:bg-white/10'}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'PROCESSING' ? 'default' : 'outline'}
                onClick={() => {
                  isInteractingRef.current = true
                  setStatusFilter('PROCESSING')
                  setTimeout(() => { isInteractingRef.current = false }, 1000)
                }}
                size="sm"
                className={statusFilter === 'PROCESSING' ? '' : 'border-white/20 text-white hover:bg-white/10'}
              >
                Processing
              </Button>
              <Button
                variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                onClick={() => {
                  isInteractingRef.current = true
                  setStatusFilter('COMPLETED')
                  setTimeout(() => { isInteractingRef.current = false }, 1000)
                }}
                size="sm"
                className={statusFilter === 'COMPLETED' ? '' : 'border-white/20 text-white hover:bg-white/10'}
              >
                Completed
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  isInteractingRef.current = true
                  fetchPayouts()
                  setTimeout(() => { isInteractingRef.current = false }, 1000)
                }}
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {receipt && (
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border-2 border-blue-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Receipt className="w-5 h-5" />
                  Payout Receipt
                </CardTitle>
                <CardDescription className="text-gray-400">All details needed to process this payout via Paystack</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReceipt(null)
                  setSelectedPayout(null)
                }}
                className="text-white hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-white">
            {/* Provider Details */}
            <div>
              <h3 className="font-semibold mb-2">Provider Details</h3>
              <div className="bg-black/50 p-3 rounded-lg space-y-1 text-sm">
                <p><span className="text-gray-400">Name:</span> {receipt.provider.businessName || receipt.provider.contactName}</p>
                <p><span className="text-gray-400">Email:</span> {receipt.provider.email}</p>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="font-semibold mb-2">Bank Details</h3>
              <div className="bg-black/50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Bank:</span>
                  <span>{receipt.provider.bankDetails.bankName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span>{receipt.provider.bankDetails.accountNumber || 'N/A'}</span>
                    {receipt.provider.bankDetails.accountNumber && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(receipt.provider.bankDetails.accountNumber!)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Account Name:</span>
                  <span>{receipt.provider.bankDetails.accountName || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div>
              <h3 className="font-semibold mb-2">Amount Breakdown</h3>
              <div className="bg-black/50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Payment:</span>
                  <span className="font-semibold">{receipt.amounts.breakdown.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Fee:</span>
                  <span>{receipt.amounts.breakdown.platformFee}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="text-gray-400">Provider Amount:</span>
                  <span className="font-semibold text-green-400">{receipt.amounts.breakdown.providerAmount}</span>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div>
              <h3 className="font-semibold mb-2">Booking Information</h3>
              <div className="bg-black/50 p-3 rounded-lg space-y-1 text-sm">
                <p><span className="text-gray-400">Service:</span> {receipt.booking.serviceName || 'N/A'}</p>
                <p><span className="text-gray-400">Client:</span> {receipt.booking.client.name}</p>
                <p><span className="text-gray-400">Date:</span> {new Date(receipt.booking.scheduledDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  window.open('https://dashboard.paystack.com/#/transfers', '_blank')
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Paystack Dashboard
              </Button>
              <Button
                onClick={() => markAsPaid(receipt.payoutId)}
                disabled={markingPaid === receipt.payoutId}
                className="flex-1 bg-green-600 hover:bg-green-700"
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payouts List */}
      {loading ? (
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </CardContent>
        </Card>
      ) : filteredPayouts.length === 0 ? (
        <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No payouts found with status: {statusFilter}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <Card key={payout.id} className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10 hover:border-blue-400/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{payout.provider.name}</h3>
                      {getStatusBadge(payout.status)}
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Amount: <span className="text-white font-semibold">R{payout.amount.toFixed(2)}</span></p>
                      <p>Service: {payout.booking.serviceName || 'N/A'}</p>
                      <p>Client: {payout.booking.client.name}</p>
                      <p>Created: {new Date(payout.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchReceipt(payout.id)}
                      disabled={loadingReceipt}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {loadingReceipt && selectedPayout?.id === payout.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          View Receipt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
