import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminProviderManagement } from '@/components/admin/admin-provider-management'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"


export default async function AdminProvidersPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return <AdminProviderManagement />
}
