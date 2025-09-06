import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminAuditLogs } from '@/components/admin/admin-audit-logs'
import { BrandHeaderClient } from '@/components/ui/brand-header-client'
import { MobileBottomNav } from '@/components/ui/mobile-bottom-nav'
import { MobileFloatingActionButton } from '@/components/ui/mobile-floating-action-button'

export default async function AdminAuditLogsPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
            <p className="text-gray-600">View and monitor all admin actions and system changes</p>
          </div>

          {/* Audit Logs Component */}
          <AdminAuditLogs />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
