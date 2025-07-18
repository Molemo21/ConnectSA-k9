"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle, RefreshCw } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isResending, setIsResending] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    // Get current user info
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }

    fetchUser()
  }, [])

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Email sent!",
          description: "We've sent a new verification email to your inbox.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to resend verification email. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    try {
      const response = await fetch("/api/auth/check-verification")
      if (response.ok) {
        const data = await response.json()
        if (data.verified) {
          toast({
            title: "Email verified!",
            description: "Your email has been successfully verified.",
          })
          router.push(data.redirectUrl || "/dashboard")
        } else {
          toast({
            title: "Not verified yet",
            description: "Please check your email and click the verification link.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check verification status.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to{" "}
              <span className="font-medium text-gray-900">{user?.email || "your email"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Almost there, {user?.name?.split(" ")[0] || "there"}!</p>
                  <p>
                    Click the verification link in your email to activate your account and start using ServiceHub SA.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleCheckVerification} className="w-full" size="lg">
                I've Verified My Email
              </Button>

              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600 mb-2">Didn't receive the email?</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure {user?.email || "your email"} is correct</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <Link href="/support" className="text-primary hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
