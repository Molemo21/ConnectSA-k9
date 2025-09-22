import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UnifiedProviderDashboard } from "@/components/provider/provider-dashboard-unified"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"

export default async function ProviderDashboardPage() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      redirect("/login")
    }

    if (user.role !== "PROVIDER") {
      redirect("/dashboard")
    }

    if (!user.emailVerified) {
      redirect("/verify-email")
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
    })

    if (!provider) {
      redirect("/provider/onboarding")
    }

    if (provider.status === "INCOMPLETE" || provider.status === "REJECTED") {
      redirect("/provider/onboarding")
    }

    if (provider.status === "PENDING") {
      redirect("/provider/pending")
    }

    // Pass user data to the unified client component with matching client dashboard design
    return <UnifiedProviderDashboard initialUser={user} />
  } catch (error) {
    console.error('Provider dashboard page error:', error)
    // If there's an error during server-side rendering, 
    // let the client component handle authentication
    return <UnifiedProviderDashboard />
  }
} 