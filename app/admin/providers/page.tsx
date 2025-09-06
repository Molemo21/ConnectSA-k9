import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminProviderManagement } from '@/components/admin/admin-provider-management'

export default async function AdminProvidersPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return <AdminProviderManagement />
}
