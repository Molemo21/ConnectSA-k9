"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Shield,
  Ban,
  UserMinus
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { AdminUserDetailsModal } from "./admin-user-details-modal-enhanced"

interface UserData {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: Date
  lastLogin?: Date
  totalBookings: number
  totalSpent: number
}

interface UserManagementProps {
  onUserSelect?: (user: UserData) => void
  onStatsUpdate?: () => void
}

export function AdminUserManagementEnhanced({ onUserSelect, onStatsUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteType, setDeleteType] = useState<'soft' | 'permanent'>('soft')

  const handleViewDetails = (user: UserData) => {
    setSelectedUserId(user.id)
    setIsDetailsModalOpen(true)
  }

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      setActionLoading(userId)
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          data
        })
      })

      if (response.ok) {
        const result = await response.json()
        showToast.success(result.message || 'Action completed successfully')
        await fetchUsers(currentPage)
        // Refresh admin stats to update sidebar counts
        onStatsUpdate?.()
      } else {
        const error = await response.json()
        showToast.error(error.message || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing user action:', error)
      showToast.error('Error performing action')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
    setDeleteReason('')
    setDeleteType('soft')
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete || !deleteReason.trim()) {
      showToast.error('Please provide a reason for deletion')
      return
    }

    try {
      setActionLoading(userToDelete.id)
      
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deleteReason,
          permanent: deleteType === 'permanent'
        })
      })

      if (response.ok) {
        const result = await response.json()
        showToast.success(result.message || `User ${deleteType === 'permanent' ? 'permanently deleted' : 'deleted'} successfully`)
        await fetchUsers(currentPage)
        // Refresh admin stats to update sidebar counts
        onStatsUpdate?.()
        setDeleteModalOpen(false)
        setUserToDelete(null)
        setDeleteReason('')
      } else {
        const error = await response.json()
        showToast.error(error.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showToast.error('Error deleting user')
    } finally {
      setActionLoading(null)
    }
  }

  const fetchUsers = async (page: number = 1) => {
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
        role: roleFilter !== 'all' ? roleFilter : ''
      })

      const response = await fetch(`/api/admin/users?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalUsers(data.pagination?.totalCount || 0)
      } else {
        console.error('Failed to fetch users')
        showToast.error('Error fetching users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      showToast.error('Error fetching users')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage, searchTerm, statusFilter, roleFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleRoleChange = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    fetchUsers(currentPage)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'INACTIVE': { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      'SUSPENDED': { color: 'bg-red-100 text-red-800', label: 'Suspended' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['ACTIVE']
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      'USER': { color: 'bg-blue-100 text-blue-800', label: 'User' },
      'PROVIDER': { color: 'bg-green-100 text-green-800', label: 'Provider' }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig['USER']
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (date: Date | string) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>User Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading users...</span>
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
              <Users className="w-5 h-5 text-blue-600" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>
              Manage users, roles, and account status. Total users: {totalUsers}
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
                  placeholder="Search users by name or email..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="PROVIDER">Provider</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {users.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No users found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{user.totalBookings}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {formatCurrency(user.totalSpent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDate(user.lastLogin)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                            className="h-8 w-8 p-0"
                            title="View user details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'suspend', { reason: 'Admin action' })}
                            disabled={actionLoading === user.id || user.status === 'SUSPENDED'}
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                            title={user.status === 'SUSPENDED' ? 'User is suspended' : 'Suspend user'}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.status === 'SUSPENDED' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={actionLoading === user.id}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Delete user"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
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

    {/* User Details Modal */}
    <AdminUserDetailsModal
      userId={selectedUserId}
      isOpen={isDetailsModalOpen}
      onClose={() => {
        setIsDetailsModalOpen(false)
        setSelectedUserId(null)
      }}
    />

    {/* Delete User Confirmation Modal */}
    <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Delete User</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please provide a reason for deletion.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {userToDelete && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{userToDelete.name}</div>
              <div className="text-sm text-gray-600">{userToDelete.email}</div>
              <div className="text-sm text-gray-500">Role: {userToDelete.role}</div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="delete-reason">Reason for deletion *</Label>
            <Textarea
              id="delete-reason"
              placeholder="Enter reason for deletion..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delete-type">Deletion Type</Label>
            <Select value={deleteType} onValueChange={(value: 'soft' | 'permanent') => setDeleteType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Soft Delete (Can be restored)</SelectItem>
                <SelectItem value="permanent">Permanent Delete (Cannot be restored)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {deleteType === 'soft' 
                ? 'User will be deactivated but data preserved for potential restoration'
                : 'User and all associated data will be permanently removed from the system'
              }
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setDeleteModalOpen(false)
              setUserToDelete(null)
              setDeleteReason('')
            }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={confirmDeleteUser}
            disabled={!deleteReason.trim() || actionLoading === userToDelete?.id}
            className="w-full sm:w-auto"
          >
            {actionLoading === userToDelete?.id ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteType === 'permanent' ? 'Delete Permanently' : 'Delete User'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
