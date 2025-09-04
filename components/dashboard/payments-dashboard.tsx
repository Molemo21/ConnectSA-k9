"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  DollarSign, Calendar, Clock, CheckCircle, AlertCircle, CreditCard, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Eye, Filter, Download,
  Receipt, Wallet, PiggyBank, Activity
} from "lucide-react"

interface Payment {
  id: string
  bookingId: string
  amount: number
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'ESCROW'
  method: string
  createdAt: string
  completedAt?: string
  booking: {
    service: {
      name: string
      category: string
    }
    provider?: {
      businessName: string
      user: {
        name: string
      }
    }
    scheduledDate: string
  }
  reference?: string
  description?: string
}

interface PaymentsDashboardProps {
  bookings: any[]
  isExpanded?: boolean
  onPaymentSelect?: (payment: Payment) => void
  onExpandToggle?: () => void
  selectedPayment?: Payment | null
}

export function PaymentsDashboard({ 
  bookings, 
  isExpanded = false, 
  onPaymentSelect, 
  onExpandToggle,
  selectedPayment 
}: PaymentsDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  // Extract payments from bookings
  const payments: Payment[] = bookings
    .filter(booking => booking.payment)
    .map(booking => ({
      id: booking.payment.id,
      bookingId: booking.id,
      amount: booking.payment.amount,
      status: booking.payment.status,
      method: booking.payment.method || 'Card',
      createdAt: booking.payment.createdAt || booking.createdAt,
      completedAt: booking.payment.completedAt,
      booking: {
        service: booking.service,
        provider: booking.provider,
        scheduledDate: booking.scheduledDate
      },
      reference: booking.payment.reference,
      description: booking.description
    }))
    .filter(payment => filterStatus === 'all' || payment.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return b.amount - a.amount
    })

  // Calculate payment statistics
  const totalPaid = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const pendingAmount = payments
    .filter(p => p.status === 'PENDING' || p.status === 'ESCROW')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const completedPayments = payments.filter(p => p.status === 'COMPLETED').length
  const failedPayments = payments.filter(p => p.status === 'FAILED').length

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { color: 'bg-green-900/50 text-green-400 border-green-800/50', icon: CheckCircle }
      case 'PENDING':
        return { color: 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50', icon: Clock }
      case 'ESCROW':
        return { color: 'bg-blue-900/50 text-blue-400 border-blue-800/50', icon: Wallet }
      case 'FAILED':
        return { color: 'bg-red-900/50 text-red-400 border-red-800/50', icon: AlertCircle }
      case 'REFUNDED':
        return { color: 'bg-purple-900/50 text-purple-400 border-purple-800/50', icon: ArrowDownRight }
      default:
        return { color: 'bg-gray-800 text-gray-400 border-gray-700', icon: AlertCircle }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isExpanded) {
    // Expanded view - takes the full "Current Active Booking" spot
    return (
      <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg font-semibold text-gray-100">
                  {selectedPayment ? 'Payment Details' : 'Payments Dashboard'}
                </CardTitle>
                <p className="text-sm text-gray-400">
                  {selectedPayment ? 'Detailed payment information' : 'Your payment history and statistics'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onExpandToggle}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 self-start sm:self-auto"
            >
              Collapse
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {selectedPayment ? (
            // Selected payment details view
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Payment Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-xl font-bold text-gray-100">R{selectedPayment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status:</span>
                        <Badge className={getStatusInfo(selectedPayment.status).color}>
                          {selectedPayment.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Method:</span>
                        <span className="text-gray-100">{selectedPayment.method}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-gray-100">{formatDate(selectedPayment.createdAt)}</span>
                      </div>
                      {selectedPayment.reference && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Reference:</span>
                          <span className="text-gray-100 font-mono text-sm">{selectedPayment.reference}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Service Details</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400 block">Service:</span>
                        <span className="text-gray-100 font-medium">{selectedPayment.booking.service.name}</span>
                        <span className="text-gray-400 text-sm block">{selectedPayment.booking.service.category}</span>
                      </div>
                      {selectedPayment.booking.provider && (
                        <div>
                          <span className="text-gray-400 block">Provider:</span>
                          <span className="text-gray-100">{selectedPayment.booking.provider.user.name}</span>
                          <span className="text-gray-400 text-sm block">{selectedPayment.booking.provider.businessName}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400 block">Scheduled:</span>
                        <span className="text-gray-100">{formatDate(selectedPayment.booking.scheduledDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-gray-700 flex gap-3">
                <Button variant="outline" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700">
                  <Receipt className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button variant="outline" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700">
                  <Eye className="w-4 h-4 mr-2" />
                  View Booking
                </Button>
              </div>
            </div>
          ) : (
            // Full payments dashboard view
            <div className="space-y-6">
              {/* Payment Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Paid</p>
                      <p className="text-xl font-bold text-green-400">R{totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Pending</p>
                      <p className="text-xl font-bold text-yellow-400">R{pendingAmount.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-900/50 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Completed</p>
                      <p className="text-xl font-bold text-gray-100">{completedPayments}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Failed</p>
                      <p className="text-xl font-bold text-red-400">{failedPayments}</p>
                    </div>
                    <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Controls */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2">
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
                  >
                    <option value="all">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="ESCROW">In Escrow</option>
                    <option value="FAILED">Failed</option>
                  </select>
                  
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                  </select>
                </div>
                
                <Button variant="outline" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Payments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-100 mb-2">No payments found</h3>
                    <p className="text-xs text-gray-400">Payments will appear here once you complete bookings</p>
                  </div>
                ) : (
                  payments.map((payment) => {
                    const statusInfo = getStatusInfo(payment.status)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <div 
                        key={payment.id}
                        onClick={() => onPaymentSelect?.(payment)}
                        className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all duration-200 cursor-pointer border border-gray-700/50 hover:border-gray-600"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-100 truncate">
                              {payment.booking.service.name}
                            </p>
                            <span className="text-lg font-bold text-gray-100">
                              R{payment.amount.toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {formatDate(payment.createdAt)}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-400">
                                {payment.method}
                              </span>
                            </div>
                            
                            <Badge className={`text-xs ${statusInfo.color}`}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Compact view - replaces the recent activity card
  return (
    <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-100 flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-green-400" />
            Payments
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onExpandToggle}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 text-xs"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-100 mb-2">No payments yet</h3>
            <p className="text-xs text-gray-400 mb-4">Complete your first booking</p>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-xs" asChild>
              <a href="/book-service">Book Now</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
                        
            {/* Recent Payments */}
            {payments.slice(0, 3).map((payment) => {
              const statusInfo = getStatusInfo(payment.status)
              const StatusIcon = statusInfo.icon
              
              return (
                <div 
                  key={payment.id}
                  onClick={() => onPaymentSelect?.(payment)}
                  className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <StatusIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-100 truncate">
                      {payment.booking.service.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{formatDate(payment.createdAt)}</p>
                      <span className="text-xs font-bold text-gray-100">R{payment.amount.toFixed(2)}</span>
                    </div>
                    <Badge className={`text-xs mt-1 inline-block ${statusInfo.color}`}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}