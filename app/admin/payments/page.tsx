import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminPaymentManagementPage } from '@/components/admin/admin-payment-management-page'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"


export default async function AdminPaymentsPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return <AdminPaymentManagementPage />
}
