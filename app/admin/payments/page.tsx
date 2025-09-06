import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminPaymentManagementPage } from '@/components/admin/admin-payment-management-page'

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return <AdminPaymentManagementPage />
}
