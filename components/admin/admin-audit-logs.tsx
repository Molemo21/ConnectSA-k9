"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Shield, 
  Search, 
  Filter, 
  Calendar,
  User,
  Loader2,
  RefreshCw,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  DollarSign,
  MessageSquare
} from "lucide-react"
import { AuditAction } from "@prisma/client"

interface AuditLog {
  id: string
  action: AuditAction
  targetType: string
  targetId: string
  details: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  admin: {
    id: string
    name: string
    email: string
  }
}

interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    adminId: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchAuditLogs()
  }, [page, filters])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      
      if (filters.action) params.append("action", filters.action)
      if (filters.targetType) params.append("targetType", filters.targetType)
      if (filters.adminId) params.append("adminId", filters.adminId)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data: AuditLogsResponse = await response.json()
        setLogs(data.logs)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: AuditAction) => {
    const actionIcons = {
      USER_SUSPENDED: XCircle,
      USER_UNSUSPENDED: CheckCircle,
      USER_DELETED: Trash2,
      USER_ROLE_CHANGED: Edit,
      PROVIDER_APPROVED: CheckCircle,
      PROVIDER_REJECTED: XCircle,
      PROVIDER_SUSPENDED: XCircle,
      PROVIDER_UNSUSPENDED: CheckCircle,
      PAYMENT_RELEASED: DollarSign,
      PAYMENT_REFUNDED: DollarSign,
      BOOKING_CANCELLED: XCircle,
      DISPUTE_RESOLVED: CheckCircle,
      SYSTEM_MAINTENANCE: Shield,
    }

    const Icon = actionIcons[action] || AlertTriangle
    return <Icon className="w-4 h-4" />
  }

  const getActionBadge = (action: AuditAction) => {
    const actionConfig = {
      USER_SUSPENDED: { color: "bg-red-100 text-red-800" },
      USER_UNSUSPENDED: { color: "bg-green-100 text-green-800" },
      USER_DELETED: { color: "bg-red-100 text-red-800" },
      USER_ROLE_CHANGED: { color: "bg-blue-100 text-blue-800" },
      PROVIDER_APPROVED: { color: "bg-green-100 text-green-800" },
      PROVIDER_REJECTED: { color: "bg-red-100 text-red-800" },
      PROVIDER_SUSPENDED: { color: "bg-yellow-100 text-yellow-800" },
      PROVIDER_UNSUSPENDED: { color: "bg-green-100 text-green-800" },
      PAYMENT_RELEASED: { color: "bg-green-100 text-green-800" },
      PAYMENT_REFUNDED: { color: "bg-orange-100 text-orange-800" },
      BOOKING_CANCELLED: { color: "bg-red-100 text-red-800" },
      DISPUTE_RESOLVED: { color: "bg-green-100 text-green-800" },
      SYSTEM_MAINTENANCE: { color: "bg-purple-100 text-purple-800" },
    }

    const config = actionConfig[action] || { color: "bg-gray-100 text-gray-800" }

    return (
      <Badge className={config.color}>
        {getActionIcon(action)}
        <span className="ml-1">{action.replace(/_/g, ' ')}</span>
      </Badge>
    )
  }

  const formatDetails = (details: any) => {
    if (!details) return null
    
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details
      return (
        <div className="text-xs text-gray-600 space-y-1">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>
      )
    } catch {
      return <div className="text-xs text-gray-600">{String(details)}</div>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-base">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Action</label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {Object.values(AuditAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Target Type</label>
              <Select value={filters.targetType} onValueChange={(value) => setFilters(prev => ({ ...prev, targetType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="PROVIDER">Provider</SelectItem>
                  <SelectItem value="BOOKING">Booking</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    action: '',
                    targetType: '',
                    adminId: '',
                    startDate: '',
                    endDate: '',
                  })
                  setPage(1)
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(log => log.action.includes('USER')).length}
            </div>
            <div className="text-sm text-gray-600">User Actions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(log => log.action.includes('PROVIDER')).length}
            </div>
            <div className="text-sm text-gray-600">Provider Actions</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({total})</CardTitle>
          <CardDescription>
            Complete audit trail of all admin actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionBadge(log.action)}
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Admin:</strong> {log.admin.name} ({log.admin.email})</p>
                      <p><strong>Target:</strong> {log.targetType} - {log.targetId}</p>
                      {log.ipAddress && <p><strong>IP:</strong> {log.ipAddress}</p>}
                    </div>

                    {formatDetails(log.details) && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs font-medium text-gray-700 mb-1">Details:</p>
                        {formatDetails(log.details)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No audit logs found matching your criteria.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
