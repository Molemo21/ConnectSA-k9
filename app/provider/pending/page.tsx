import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default async function ProviderPendingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "PROVIDER") {
    redirect("/dashboard")
  }

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } })

  if (!provider) {
    redirect("/provider/onboarding")
  }

  if (provider.status === "INCOMPLETE" || provider.status === "REJECTED") {
    redirect("/provider/onboarding")
  }

  if (provider.status === "APPROVED") {
    redirect("/provider/dashboard")
  }

  if (!["PENDING", "REJECTED", "SUSPENDED"].includes(provider.status)) {
    redirect("/provider/onboarding")
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: Clock,
          color: "bg-yellow-100 text-yellow-800",
          title: "Under Review",
          description: "Your profile is being reviewed by our team",
        }
      case "REJECTED":
        return {
          icon: AlertCircle,
          color: "bg-red-100 text-red-800",
          title: "Needs Attention",
          description: "Your profile needs some updates",
        }
      default:
        return {
          icon: Clock,
          color: "bg-gray-100 text-gray-800",
          title: status,
          description: "Status unknown",
        }
    }
  }

  const statusInfo = getStatusInfo(provider.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">ServiceHub SA</span>
            </Link>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <StatusIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Profile {statusInfo.title}</CardTitle>
              <CardDescription className="text-base">{statusInfo.description}</CardDescription>
              <Badge className={statusInfo.color}>{provider.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {provider.status === "PENDING" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">What's happening now?</p>
                      <ul className="space-y-1">
                        <li>✓ Your profile has been submitted</li>
                        <li>⏳ Our team is reviewing your information</li>
                        <li>⏳ We're verifying your documents</li>
                        <li>⏳ Background check in progress</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {(provider.status as string) === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-2">Action Required</p>
                      <p>
                        Your profile needs some updates before we can approve it. Please check your email for specific
                        feedback and resubmit your application.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Expected Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Profile submitted</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Review in progress (1-2 days)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Background verification (2-3 days)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Final approval & activation</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(provider.status as string) === "REJECTED" ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href="/provider/onboarding">Update Profile</Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full" size="lg">
                    Waiting for Approval
                  </Button>
                )}

                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/provider/profile">View Profile</Link>
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>support@servicehub.co.za</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>+27 11 123 4567</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
