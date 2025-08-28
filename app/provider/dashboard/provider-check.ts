import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getProviderStatus() {
  const user = await getCurrentUser()
  if (!user) return { redirect: "/login" }
  if (user.role !== "PROVIDER") return { redirect: "/dashboard" }
  if (!user.emailVerified) return { redirect: "/verify-email" }

  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
  })
  if (!provider) return { redirect: "/provider/onboarding" }
  if (provider.status === "INCOMPLETE" || provider.status === "REJECTED") return { redirect: "/provider/onboarding" }
  if (provider.status === "PENDING") return { redirect: "/provider/pending" }
  return { provider }
}
