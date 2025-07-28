"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isResending, setIsResending] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<null | { success: boolean; message: string }>(null)
  const token = searchParams.get("token")
  const [emailInput, setEmailInput] = useState("")
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Handle token verification if token is present
  useEffect(() => {
    if (token) {
      setVerifying(true)
      fetch(`/api/auth/verify-email?token=${token}`)
        .then(async (res) => {
          const data = await res.json()
          if (res.ok) {
            setVerifyResult({ success: true, message: data.message || "Email verified successfully!" })
          } else {
            setVerifyResult({ success: false, message: data.error || "Verification failed." })
          }
        })
        .catch(() => {
          setVerifyResult({ success: false, message: "Verification failed. Please try again." })
        })
        .finally(() => setVerifying(false))
    }
  }, [token])

  // Fetch user info for the 'check your email' state
  useEffect(() => {
    if (!token) {
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
    }
  }, [token])

  // Fetch pending email from localStorage if no token
  useEffect(() => {
    if (!token) {
      const email = localStorage.getItem("pendingVerificationEmail");
      if (email) setPendingEmail(email);
    }
  }, [token]);

  // Clear pending email after successful verification
  useEffect(() => {
    if (token && verifyResult?.success) {
      localStorage.removeItem("pendingVerificationEmail");
    }
  }, [token, verifyResult]);

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      let email = user?.email || emailInput
      if (!email) {
        setShowEmailPrompt(true)
        setIsResending(false)
        return
      }
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Email sent!",
          description: data.message || "We've sent a new verification email to your inbox.",
        })
        setShowEmailPrompt(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to resend verification email. Please try again.",
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

  // Render token verification result if token is present
  if (token) {
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
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${verifying ? "bg-blue-100" : verifyResult?.success ? "bg-green-100" : "bg-red-100"}`}>
                {verifying ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : verifyResult?.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {verifying
                  ? "Verifying Email..."
                  : verifyResult?.success
                  ? "Email Verified!"
                  : "Verification Failed"}
              </CardTitle>
              <CardDescription className="text-base">
                {verifying
                  ? "Please wait while we verify your email."
                  : verifyResult?.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!verifying && verifyResult?.success && (
                <Button className="w-full" size="lg" onClick={() => router.push("/login")}>Go to Login</Button>
              )}
              {!verifying && !verifyResult?.success && (
                <Button className="w-full" size="lg" onClick={() => router.push("/signup")}>Try Again</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Default: show 'check your email' state
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
              <span className="font-medium text-gray-900">{pendingEmail || user?.email || "your email"}</span>
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
              <Button onClick={handleResendEmail} variant="outline" className="w-full bg-transparent" disabled={isResending}>
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              {showEmailPrompt && (
                <div className="pt-2">
                  <input
                    type="email"
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Enter your email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                  />
                  <Button className="mt-2 w-full" onClick={handleResendEmail} disabled={isResending || !emailInput}>
                    Send Verification
                  </Button>
                </div>
              )}
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
