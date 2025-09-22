import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSystemManagement } from '@/components/admin/admin-system-management'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"


export default async function AdminSystemPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return <AdminSystemManagement />
}
