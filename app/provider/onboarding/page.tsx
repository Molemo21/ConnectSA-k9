import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProviderOnboardingForm } from "@/components/provider/onboarding-form"

function isProfileComplete(provider: any) {
  return (
    provider.businessName &&
    provider.description &&
    provider.experience > 0 &&
    provider.hourlyRate > 0 &&
    provider.location &&
    provider.services && provider.services.length > 0
  )
}

export default async function ProviderOnboardingPage() {
  const user = await getCurrentUser()

  if (!user) {
    // Failsafe, should be handled by middleware
    redirect("/login")
  }

  // Get provider data
  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: {
      services: {
        include: {
          service: true,
        },
      },
    },
  })

  if (!provider) {
    redirect("/dashboard")
  }

  // If already approved, redirect to provider dashboard
  if (provider.status === "APPROVED") {
    redirect("/provider/dashboard")
  }

  // If profile is complete and status is PENDING, redirect to pending page
  if (provider.status === "PENDING" && isProfileComplete(provider)) {
    redirect("/provider/pending")
  }

  // Otherwise, show onboarding form (allow editing while PENDING)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Provider Profile</h1>
            <p className="text-gray-600">
              Help clients find you by completing your profile. All information will be reviewed before approval.
            </p>
          </div>

          <ProviderOnboardingForm user={user} provider={provider} />
        </div>
      </div>
    </div>
  )
}
