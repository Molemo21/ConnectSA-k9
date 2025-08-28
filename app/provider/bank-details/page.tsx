import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProviderBankDetailsContent } from "@/components/provider/provider-bank-details-content"

export default async function ProviderBankDetailsPage() {
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

  return <ProviderBankDetailsContent providerId={provider.id} />
}
