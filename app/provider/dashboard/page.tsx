import { redirect } from "next/navigation"
import { ProviderDashboardContent } from "@/components/provider/provider-dashboard-content"
import { getProviderStatus } from "./provider-check"

export default async function ProviderDashboardPage() {
  const result = await getProviderStatus()
  if (result.redirect) {
    redirect(result.redirect)
  }
  return <ProviderDashboardContent />
}