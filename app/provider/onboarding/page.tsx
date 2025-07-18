import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProviderOnboardingForm } from "@/components/provider/onboarding-form"

export default async function ProviderOnboardingPage() {
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
