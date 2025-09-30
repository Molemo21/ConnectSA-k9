"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit, 
  Shield,
  Briefcase,
  Users,
  DollarSign,
  Star,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  Upload
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface ProviderCleanupStats {
  totalProviders: number
  incompleteProfiles: number
  unverifiedProviders: number
  inactiveProviders: number
  duplicateBusinessNames: number
  lowRatingProviders: number
}

interface ProviderCleanupAction {
  id: string
  type: 'incomplete' | 'unverified' | 'inactive' | 'duplicate' | 'low_rating'
  provider: {
    id: string
    name: string
    email: string
    businessName: string
    status: string
    verification: string
    rating: number
    bookings: number
    earnings: number
    joinedDate: string
  }
  recommendedAction: 'approve' | 'reject' | 'suspend' | 'verify' | 'complete_profile' | 'merge' | 'delete'
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export function AdminProviderCleanupTool() {
  const [stats, setStats] = useState<ProviderCleanupStats | null>(null)
  const [actions, setActions] = useState<ProviderCleanupAction[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    analyzeProviders()
  }, [])

  const analyzeProviders = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/providers/cleanup-analysis')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setActions(data.actions)
      } else {
        showToast.error('Failed to analyze providers')
      }
    } catch (error) {
      console.error('Error analyzing providers:', error)
      showToast.error('Error analyzing providers')
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (actionId: string, actionType: string) => {
    try {
      setProcessing(actionId)
      
      const response = await fetch('/api/admin/providers/cleanup-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, actionType })
      })

      if (response.ok) {
        showToast.success('Action completed successfully')
        // Refresh analysis
        await analyzeProviders()
      } else {
        showToast.error('Failed to execute action')
      }
    } catch (error) {
      console.error('Error executing action:', error)
      showToast.error('Error executing action')
    } finally {
      setProcessing(null)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve': return <CheckCircle className="w-4 h-4" />
      case 'reject': return <XCircle className="w-4 h-4" />
      case 'suspend': return <Shield className="w-4 h-4" />
      case 'verify': return <CheckCircle className="w-4 h-4" />
      case 'complete_profile': return <Edit className="w-4 h-4" />
      case 'merge': return <Users className="w-4 h-4" />
      case 'delete': return <Trash2 className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>Provider Data Quality Analysis</span>
          </CardTitle>
          <CardDescription>
            Identify and resolve data quality issues in provider profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{stats.totalProviders}</div>
                <div className="text-sm text-gray-600">Total Providers</div>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <FileText className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{stats.incompleteProfiles}</div>
                <div className="text-sm text-gray-600">Incomplete</div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Shield className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{stats.unverifiedProviders}</div>
                <div className="text-sm text-gray-600">Unverified</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600">{stats.inactiveProviders}</div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Briefcase className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.duplicateBusinessNames}</div>
                <div className="text-sm text-gray-600">Duplicates</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Star className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{stats.lowRatingProviders}</div>
                <div className="text-sm text-gray-600">Low Rating</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Recommended Actions</span>
          </CardTitle>
          <CardDescription>
            Review and execute cleanup actions for data quality improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All provider profiles are in good condition! No cleanup actions needed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{action.type.replace('_', ' ').toUpperCase()}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="font-medium text-gray-900">{action.provider.name}</div>
                          <div className="text-sm text-gray-600">{action.provider.email}</div>
                          <div className="text-sm text-gray-500">
                            Business: {action.provider.businessName || 'N/A'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <Badge variant="outline" className="ml-1">
                              {action.provider.status}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-500">Verification:</span>
                            <Badge variant="outline" className="ml-1">
                              {action.provider.verification}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-500">Bookings:</span>
                            <span className="ml-1 font-medium">{action.provider.bookings}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Earnings:</span>
                            <span className="ml-1 font-medium text-green-600">
                              {formatCurrency(action.provider.earnings)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Issue:</strong> {action.reason}
                      </div>

                      <div className="text-sm text-blue-600">
                        <strong>Recommended Action:</strong> {action.recommendedAction.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => executeAction(action.id, action.recommendedAction)}
                        disabled={processing === action.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {processing === action.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          getActionIcon(action.recommendedAction)
                        )}
                        <span className="ml-1">Execute</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-green-600" />
            <span>Bulk Actions</span>
          </CardTitle>
          <CardDescription>
            Perform bulk operations on multiple providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => {/* Bulk verify */}}
            >
              <Shield className="w-6 h-6 text-green-600" />
              <span className="text-sm">Bulk Verify</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => {/* Bulk approve */}}
            >
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Bulk Approve</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => {/* Export data */}}
            >
              <Download className="w-6 h-6 text-purple-600" />
              <span className="text-sm">Export Data</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => analyzeProviders()}
            >
              <Upload className="w-6 h-6 text-orange-600" />
              <span className="text-sm">Refresh Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
