import { UnifiedProviderDashboard } from "@/components/provider/provider-dashboard-unified"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"

export default function ProviderDashboardPage() {
  // Let the client component handle all authentication and redirects
  // This matches the pattern used in app/dashboard/page.tsx
  // and avoids server-side errors with cookies/redirects
  return <UnifiedProviderDashboard />
} 