"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Briefcase, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Mail
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { AdminProviderDetailsModal } from "./admin-provider-details-modal-enhanced"

interface ProviderData {
  id: string
  email: string
  name: string
  businessName: string
  status: string
  createdAt: Date
  totalBookings: number
  totalEarnings: number
  averageRating: number
  verificationStatus: string
}

interface ProviderManagementProps {
  onProviderSelect?: (provider: ProviderData) => void
  onStatsUpdate?: () => void
}

export function AdminProviderManagementEnhanced({ onProviderSelect, onStatsUpdate }: ProviderManagementProps) {
  const [providers, setProviders] = useState<ProviderData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProviders, setTotalProviders] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const handleViewDetails = (provider: ProviderData) => {
    setSelectedProviderId(provider.id)
    setIsDetailsModalOpen(true)
  }

  const fetchProviders = async (page: number = 1) => {
    try {
      setRefreshing(true)
      
      // Skip API calls during build time
      if (typeof window === 'undefined') {
        console.log('Skipping API call during build time')
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        verification: verificationFilter !== 'all' ? verificationFilter : ''
      })

      const response = await fetch(`/api/admin/providers?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Fetched providers data:', data.providers)
        console.log('📊 Provider statuses:', data.providers?.map((p: any) => `${p.name}: ${p.status}`))
        setProviders(data.providers || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalProviders(data.pagination?.totalCount || 0)
      } else {
        console.error('Failed to fetch providers')
        showToast.error('Error fetching providers')
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
      showToast.error('Error fetching providers')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchProviders(currentPage)
  }, [currentPage, searchTerm, statusFilter, verificationFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleVerificationChange = (value: string) => {
    setVerificationFilter(value)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    fetchProviders(currentPage)
  }

  const handleProviderAction = async (providerId: string, action: string) => {
    try {
      setActionLoading(providerId)
      
      let message = ''
      let body: any = {
        providerId,
        action,
        data: {}
      }

      // Handle different action types
      switch (action) {
        case 'complete-profile':
          message = 'Profile completion request sent to provider'
          body.data = { 
            action: 'notify_completion',
            message: 'Please complete your provider profile to proceed with approval'
          }
          break
          
        case 'notify-complete':
          message = 'Completion notification sent to provider'
          body.data = { 
            action: 'send_completion_email',
            message: 'Your profile is incomplete. Please complete all required fields.'
          }
          break
          
        case 'reject-incomplete':
          message = 'Incomplete profile rejected'
          body.data = { 
            action: 'reject',
            reason: 'Incomplete profile - missing required information'
          }
          break
          
        case 'approve':
          message = 'Provider approved successfully'
          body.data = {}
          break
          
        case 'reject':
          message = 'Provider rejected'
          body.data = {}
          break
          
        case 'suspend':
          message = 'Provider suspended'
          body.data = {}
          break
          
        case 'reactivate':
          message = 'Provider reactivated'
          body.data = {}
          break
          
        default:
          message = 'Action completed'
      }
      
      const response = await fetch('/api/admin/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        showToast.success(result.message || message)
        await fetchProviders(currentPage)
        // Refresh admin stats to update sidebar counts
        onStatsUpdate?.()
      } else {
        const error = await response.json()
        showToast.error(error.message || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing provider action:', error)
      showToast.error('Error performing action')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      'REJECTED': { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      'SUSPENDED': { color: 'bg-gray-100 text-gray-800', label: 'Suspended', icon: UserX }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getVerificationBadge = (verificationStatus: string) => {
    const verificationConfig = {
      'VERIFIED': { color: 'bg-green-100 text-green-800', label: 'Verified' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'REJECTED': { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      'UNVERIFIED': { color: 'bg-gray-100 text-gray-800', label: 'Unverified' }
    }
    
    const config = verificationConfig[verificationStatus as keyof typeof verificationConfig] || verificationConfig['UNVERIFIED']
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getProfileCompleteness = (provider: ProviderData) => {
    const requiredFields = [
      { field: 'businessName', value: provider.businessName, label: 'Business Name' },
      { field: 'email', value: provider.email, label: 'Email' },
      { field: 'name', value: provider.name, label: 'Full Name' }
    ]
    
    const completedFields = requiredFields.filter(field => 
      field.value && field.value !== 'N/A' && field.value.trim() !== ''
    )
    
    const completeness = Math.round((completedFields.length / requiredFields.length) * 100)
    const missingFields = requiredFields.filter(field => 
      !field.value || field.value === 'N/A' || field.value.trim() === ''
    )
    
    return {
      percentage: completeness,
      isComplete: completeness >= 80, // 80% threshold for completeness
      missingFields: missingFields.map(f => f.label),
      completedFields: completedFields.length,
      totalFields: requiredFields.length
    }
  }

  const getActionButtons = (provider: ProviderData) => {
    const buttons = []
    const profileStatus = getProfileCompleteness(provider)

    console.log(`🔍 Debug: Provider ${provider.name} - Status: ${provider.status}, Completeness: ${profileStatus.percentage}%`)

    if (provider.status === 'PENDING') {
      if (!profileStatus.isComplete) {
        // Incomplete profile - show completion actions
        buttons.push(
          <Button
            key="complete-profile"
            variant="outline"
            size="sm"
            onClick={() => handleProviderAction(provider.id, 'complete-profile')}
            disabled={actionLoading === provider.id}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <FileText className="w-4 h-4 mr-1" />
            Complete Profile
          </Button>
        )
        buttons.push(
          <Button
            key="notify-complete"
            variant="outline"
            size="sm"
            onClick={() => handleProviderAction(provider.id, 'notify-complete')}
            disabled={actionLoading === provider.id}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Mail className="w-4 h-4 mr-1" />
            Notify Provider
          </Button>
        )
        buttons.push(
          <Button
            key="reject-incomplete"
            variant="outline"
            size="sm"
            onClick={() => handleProviderAction(provider.id, 'reject-incomplete')}
            disabled={actionLoading === provider.id}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        )
      } else {
        // Complete profile - show approval actions
        buttons.push(
          <Button
            key="approve"
            variant="outline"
            size="sm"
            onClick={() => handleProviderAction(provider.id, 'approve')}
            disabled={actionLoading === provider.id}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <UserCheck className="w-4 h-4 mr-1" />
            Approve
          </Button>
        )
        buttons.push(
          <Button
            key="reject"
            variant="outline"
            size="sm"
            onClick={() => handleProviderAction(provider.id, 'reject')}
            disabled={actionLoading === provider.id}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        )
      }
    }

    if (provider.status === 'APPROVED') {
      buttons.push(
        <Button
          key="suspend"
          variant="outline"
          size="sm"
          onClick={() => handleProviderAction(provider.id, 'suspend')}
          disabled={actionLoading === provider.id}
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <UserX className="w-4 h-4 mr-1" />
          Suspend
        </Button>
      )
    }

    if (provider.status === 'SUSPENDED') {
      buttons.push(
        <Button
          key="reactivate"
          variant="outline"
          size="sm"
          onClick={() => handleProviderAction(provider.id, 'reactivate')}
          disabled={actionLoading === provider.id}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <UserCheck className="w-4 h-4 mr-1" />
          Reactivate
        </Button>
      )
    }

    console.log(`📊 Provider ${provider.name}: Generated ${buttons.length} buttons`)
    return buttons
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Provider Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading providers...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Provider Management</span>
            </CardTitle>
            <CardDescription>
              Manage service providers, approvals, and verification status. Total providers: {totalProviders}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search providers by name, business, or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={handleVerificationChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="UNVERIFIED">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Providers Table */}
          {providers.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No providers found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{provider.name}</span>
                          <span className="text-sm text-gray-500">{provider.businessName}</span>
                          <span className="text-xs text-gray-400">{provider.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(provider.status)}
                          {provider.status === 'PENDING' && (
                            <div className="text-xs">
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  getProfileCompleteness(provider).isComplete 
                                    ? 'bg-green-500' 
                                    : 'bg-orange-500'
                                }`}></div>
                                <span className={`text-xs ${
                                  getProfileCompleteness(provider).isComplete 
                                    ? 'text-green-600' 
                                    : 'text-orange-600'
                                }`}>
                                  {getProfileCompleteness(provider).percentage}% Complete
                                </span>
                              </div>
                              {!getProfileCompleteness(provider).isComplete && (
                                <div className="text-xs text-gray-500">
                                  Missing: {getProfileCompleteness(provider).missingFields.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVerificationBadge(provider.verificationStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{provider.averageRating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{provider.totalBookings}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {formatCurrency(provider.totalEarnings)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDate(provider.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(provider)}
                            className="h-8 w-8 p-0"
                            title="View provider details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <div className="flex space-x-1">
                            {getActionButtons(provider)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Provider Details Modal */}
    <AdminProviderDetailsModal
      providerId={selectedProviderId}
      isOpen={isDetailsModalOpen}
      onClose={() => {
        setIsDetailsModalOpen(false)
        setSelectedProviderId(null)
      }}
    />
  </>
  )
}

}
