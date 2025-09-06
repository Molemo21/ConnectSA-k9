import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSystemManagement } from '@/components/admin/admin-system-management'

export default async function AdminSystemPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return <AdminSystemManagement />
}
