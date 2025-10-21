"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  Shield,
  Trash2,
  Edit,
  MoreHorizontal
} from "lucide-react"
// Toast functionality will be handled with a simple alert for now
import { UserRole } from "@prisma/client"
import { UserDetailsModal } from "./user-details-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface UserWithDetails {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  provider?: {
    id: string
    status: string
    businessName?: string
  }
  _count: {
    bookings: number
    notifications: number
  }
}

interface UserManagementProps {
  className?: string
}

export function AdminUserManagement({ className }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE")
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<"suspend" | "unsuspend" | "delete" | "changeRole" | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CLIENT)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, statusFilter])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      
      if (roleFilter !== "ALL") params.append("role", roleFilter)
      if (statusFilter !== "ALL") params.append("isActive", statusFilter === "ACTIVE" ? "true" : "false")

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
        setTotalUsers(data.pagination.total)
      } else {
        alert('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Error fetching users')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      CLIENT: { color: "bg-blue-100 text-blue-800", icon: Users },
      PROVIDER: { color: "bg-green-100 text-green-800", icon: UserCheck },
      ADMIN: { color: "bg-purple-100 text-purple-800", icon: Shield },
    }

    const config = roleConfig[role]
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {role}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Suspended
      </Badge>
    )
  }

  const getStatusCounts = () => {
    return {
      total: totalUsers,
      active: users.filter(u => u.isActive).length,
      suspended: users.filter(u => !u.isActive).length,
      clients: users.filter(u => u.role === 'CLIENT').length,
      providers: users.filter(u => u.role === 'PROVIDER').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
    }
  }

  const statusCounts = getStatusCounts()

  const handleViewDetails = (user: UserWithDetails) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedUser(null)
  }

  const handleAction = (user: UserWithDetails, action: "suspend" | "unsuspend" | "delete" | "changeRole") => {
    setSelectedUser(user)
    setActionType(action)
    setActionReason("")
    setNewRole(user.role)
    setActionModalOpen(true)
  }

  const handleCloseActionModal = () => {
    setActionModalOpen(false)
    setActionType(null)
    setSelectedUser(null)
    setActionReason("")
  }

  const executeAction = async () => {
    if (!selectedUser || !actionType) return

    try {
      const body: any = { action: actionType }
      if (actionReason) body.reason = actionReason
      if (actionType === "changeRole") body.newRole = newRole
      if (actionType === "delete") body.permanent = false // Soft delete by default

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: actionType === "delete" ? "DELETE" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        alert(`User ${actionType} successful`)
        await fetchUsers() // Refresh the list
        handleCloseActionModal()
      } else {
        const error = await response.json()
        console.error(`Failed to ${actionType} user:`, error)
        alert(error.error || `Failed to ${actionType} user. Please try again.`)
      }
    } catch (error) {
      console.error(`Error ${actionType}ing user:`, error)
      alert(`Error ${actionType}ing user: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-base">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.suspended}</div>
            <div className="text-sm text-gray-600">Suspended</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.clients}</div>
            <div className="text-sm text-gray-600">Clients</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.providers}</div>
            <div className="text-sm text-gray-600">Providers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "ALL")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value={UserRole.CLIENT}>Clients</SelectItem>
                  <SelectItem value={UserRole.PROVIDER}>Providers</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                className="shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage and monitor all platform users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.isActive)}
                      {!user.emailVerified && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                      <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                      <p><strong>Bookings:</strong> {user._count.bookings}</p>
                      {user.provider && (
                        <p><strong>Provider Status:</strong> {user.provider.status}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(user)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.isActive ? (
                          <DropdownMenuItem onClick={() => handleAction(user, "suspend")}>
                            <UserX className="w-4 h-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleAction(user, "unsuspend")}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unsuspend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleAction(user, "changeRole")}>
                          <Edit className="w-4 h-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        {/* Optional: Hard delete action, only shown when safe */}
                        {user._count.bookings === 0 && user._count.notifications === 0 && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user)
                              setActionType("delete")
                              setActionReason("")
                              // Temporarily set a flag via reason suffix; executeAction sends permanent=false.
                              // We will use a confirm path below to submit permanent=true.
                              setActionModalOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleAction(user, "delete")}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete (Soft)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your criteria.
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

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        userId={selectedUser?.id}
      />

      {/* Action Confirmation Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend" && "Suspend User"}
              {actionType === "unsuspend" && "Unsuspend User"}
              {actionType === "delete" && "Delete User"}
              {actionType === "changeRole" && "Change User Role"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "suspend" && `Are you sure you want to suspend ${selectedUser?.name}?`}
              {actionType === "unsuspend" && `Are you sure you want to unsuspend ${selectedUser?.name}?`}
              {actionType === "delete" && `Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
              {actionType === "changeRole" && `Change the role for ${selectedUser?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === "changeRole" && (
              <div>
                <Label htmlFor="newRole">New Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.CLIENT}>Client</SelectItem>
                    <SelectItem value={UserRole.PROVIDER}>Provider</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseActionModal}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {actionType === "delete" && selectedUser && selectedUser._count.bookings === 0 && selectedUser._count.notifications === 0 && (
                <Button 
                  onClick={async () => {
                    if (!selectedUser) return
                    try {
                      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason: actionReason, permanent: true })
                      })
                      if (res.ok) {
                        alert('User permanently deleted')
                        await fetchUsers()
                        handleCloseActionModal()
                      } else {
                        const err = await res.json()
                        alert(err.error || 'Failed to permanently delete user')
                      }
                    } catch (e: any) {
                      alert(e.message || 'Failed to permanently delete user')
                    }
                  }}
                  variant="destructive"
                >
                  Delete Permanently
                </Button>
              )}
              <Button 
                onClick={executeAction}
                variant={actionType === "delete" ? "destructive" : "default"}
              >
                {actionType === "suspend" && "Suspend"}
                {actionType === "unsuspend" && "Unsuspend"}
                {actionType === "delete" && "Delete (Soft)"}
                {actionType === "changeRole" && "Change Role"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
