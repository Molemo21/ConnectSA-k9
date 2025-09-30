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
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Eye,
  Loader2,
  RefreshCw
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { ProviderDetailsModal } from "./provider-details-modal"

interface ProviderWithUser {
  id: string
  businessName?: string
  description?: string
  status: string
  hourlyRate?: number
  location?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    emailVerified: boolean
  }
}

export function AdminProviderManagement() {
  const [providers, setProviders] = useState<ProviderWithUser[]>([])
  const [filteredProviders, setFilteredProviders] = useState<ProviderWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithUser | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  useEffect(() => {
    filterProviders()
  }, [providers, searchTerm, statusFilter])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      } else {
        showToast.error('Failed to fetch providers')
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
      showToast.error('Error fetching providers')
    } finally {
      setLoading(false)
    }
  }

  const filterProviders = () => {
    let filtered = providers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(provider =>
        provider.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(provider => provider.status === statusFilter)
    }

    setFilteredProviders(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-orange-100 text-orange-800", icon: Clock },
      APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
      SUSPENDED: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      INCOMPLETE: { color: "bg-gray-100 text-gray-800", icon: Clock }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getStatusCounts = () => {
    return {
      total: providers.length,
      pending: providers.filter(p => p.status === 'PENDING').length,
      approved: providers.filter(p => p.status === 'APPROVED').length,
      rejected: providers.filter(p => p.status === 'REJECTED').length,
      suspended: providers.filter(p => p.status === 'SUSPENDED').length
    }
  }

  const statusCounts = getStatusCounts()

  const handleViewDetails = (provider: ProviderWithUser) => {
    setSelectedProvider(provider)
    setSelectedProviderId(provider.id)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedProviderId(null)
    setSelectedProvider(null)
  }

  const handleStatusUpdate = (providerId: string, newStatus: string) => {
    // Update the provider in the local state
    setProviders(prev => 
      prev.map(provider => 
        provider.id === providerId 
          ? { ...provider, status: newStatus }
          : provider
      )
    )
    
    // Also update filtered providers
    setFilteredProviders(prev => 
      prev.map(provider => 
        provider.id === providerId 
          ? { ...provider, status: newStatus }
          : provider
      )
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Loading providers...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Provider Management</h1>
            <p className="text-gray-600">Manage and review provider applications</p>
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
                <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.suspended}</div>
                <div className="text-sm text-gray-600">Suspended</div>
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
                      placeholder="Search providers..."
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
                    variant={statusFilter === "APPROVED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("APPROVED")}
                  >
                    Approved
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProviders}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Providers List */}
          <Card>
            <CardHeader>
              <CardTitle>Providers ({filteredProviders.length})</CardTitle>
              <CardDescription>
                Review and manage provider applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {provider.businessName || provider.user.name}
                          </h3>
                          {getStatusBadge(provider.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Email:</strong> {provider.user.email}</p>
                          <p><strong>Phone:</strong> {provider.user.phone || 'Not provided'}</p>
                          <p><strong>Location:</strong> {provider.location || 'Not specified'}</p>
                          <p><strong>Rate:</strong> R{provider.hourlyRate || 0}/hour</p>
                          <p><strong>Email Verified:</strong> {provider.user.emailVerified ? 'Yes' : 'No'}</p>
                        </div>
                        {provider.description && (
                          <p className="text-sm text-gray-600 mt-2">{provider.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(provider)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredProviders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No providers found matching your criteria.
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
      
      {/* Provider Details Modal */}
      <ProviderDetailsModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        providerId={selectedProviderId}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}
