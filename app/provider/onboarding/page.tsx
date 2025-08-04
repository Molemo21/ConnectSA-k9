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

  if (!provider || provider.status === "INCOMPLETE") {
    // Allow onboarding form
  } else if (provider.status === "REJECTED") {
    // Allow onboarding form with feedback
  } else if (provider.status === "PENDING") {
    redirect("/provider/pending")
  } else if (provider.status === "APPROVED") {
    redirect("/provider/dashboard")
  } else {
    redirect("/dashboard")
  }

  // If status is REJECTED, fetch feedback from latest ProviderReview
  let feedback = undefined;
  if (provider && provider.status === "REJECTED") {
    // Fetch latest ProviderReview for feedback (pseudo, you may need to adjust for your ORM)
    const reviews = await prisma.providerReview.findMany({
      where: { providerId: provider.id, status: "REJECTED" },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    feedback = reviews[0]?.comment;
  }

  // If status is REJECTED, allow editing and show feedback (handled in form)
  // If status is INCOMPLETE, allow editing

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

          <ProviderOnboardingForm user={user} provider={provider} readOnly={false} feedback={feedback} />
        </div>
      </div>
    </div>
  )
}
