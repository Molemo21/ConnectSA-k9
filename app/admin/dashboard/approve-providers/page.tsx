"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { 
  UserCheck, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  AlertCircle
} from "lucide-react"

export default function ApproveProvidersPage() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: "PENDING",
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      const response = await fetch(`/api/admin/providers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch providers:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [pagination.page])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case "verified":
        return <span className="text-green-600 text-sm">✓ Verified</span>
      case "pending":
        return <span className="text-yellow-600 text-sm">⏳ Pending</span>
      case "rejected":
        return <span className="text-red-600 text-sm">✗ Rejected</span>
      default:
        return <span className="text-gray-600 text-sm">{status}</span>
    }
  }

  const handleApprove = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'APPROVED',
          comment: 'Provider approved by admin'
        })
      })

      if (response.ok) {
        // Refresh the providers list
        fetchProviders()
        alert('Provider approved successfully!')
      } else {
        const errorData = await response.json()
        console.error('Failed to approve provider:', errorData.error)
        alert(`Failed to approve provider: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error approving provider:', error)
      alert('Error approving provider')
    }
  }

  const handleReject = async (providerId: string) => {
    const comment = prompt('Please provide a reason for rejection:')
    if (comment === null) return // User cancelled

    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          comment: comment || 'Provider rejected by admin'
        })
      })

      if (response.ok) {
        // Refresh the providers list
        fetchProviders()
        alert('Provider rejected successfully!')
      } else {
        const errorData = await response.json()
        console.error('Failed to reject provider:', errorData.error)
        alert(`Failed to reject provider: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error rejecting provider:', error)
      alert('Error rejecting provider')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-lg">Loading providers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandHeaderClient showUserMenu={true} />
      
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar activeSection="approve-providers" />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Approve Providers</h1>
            <p className="text-gray-600">Review and approve pending provider applications</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {providers.filter(p => p.status === "PENDING").length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved Today</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Approved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {providers.filter(p => p.status === "APPROVED").length}
                    </p>
                  </div>
                  <UserCheck className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {providers.filter(p => p.status === "REJECTED").length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Providers List */}
          <div className="space-y-4">
            {providers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No pending providers found.</p>
                </CardContent>
              </Card>
            ) : (
              providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {provider.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                          {getStatusBadge(provider.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <Mail className="w-4 h-4 inline mr-2" />
                              {provider.email}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <Phone className="w-4 h-4 inline mr-2" />
                              {provider.phone}
                            </p>
                            <p className="text-sm text-gray-600">
                              <MapPin className="w-4 h-4 inline mr-2" />
                              {provider.location}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <Calendar className="w-4 h-4 inline mr-2" />
                              Applied: {new Date(provider.applicationDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <Star className="w-4 h-4 inline mr-2" />
                              Experience: {provider.experience}
                            </p>
                            <p className="text-sm text-gray-600">
                              Services: {provider.services.join(", ")}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 mb-2">{provider.bio}</p>
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Previous Work:</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {provider.previousWork.map((work, index) => (
                                <li key={index}>{work}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-600 mb-2">Document Status:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="text-xs">
                              <p className="font-medium">ID Document</p>
                              {getDocumentStatus(provider.documents.idDocument)}
                            </div>
                            <div className="text-xs">
                              <p className="font-medium">Business License</p>
                              {getDocumentStatus(provider.documents.businessLicense)}
                            </div>
                            <div className="text-xs">
                              <p className="font-medium">Insurance</p>
                              {getDocumentStatus(provider.documents.insurance)}
                            </div>
                            <div className="text-xs">
                              <p className="font-medium">References</p>
                              {getDocumentStatus(provider.documents.references)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {provider.status === "PENDING" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(provider.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(provider.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} providers
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
