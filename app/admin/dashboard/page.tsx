import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MobileAdminDashboard } from "@/components/admin/mobile-admin-dashboard"

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  // During build time, render with default data
  if (!user && process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    console.log('Rendering admin dashboard with default data during build time');
  } else if (!user) {
    redirect("/login")
  } else if (user && user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return <MobileAdminDashboard />
} 