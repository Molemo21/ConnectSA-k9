import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminAnalytics } from '@/components/admin/admin-analytics'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"


export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return <AdminAnalytics />
}
