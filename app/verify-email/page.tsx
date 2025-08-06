"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react"

function VerifyEmailContent() {
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
            <CardContent className="p-8">
              {verifying ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                  <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
                  <p className="text-gray-600">Please wait while we verify your email address.</p>
                </div>
              ) : verifyResult ? (
                <div className="text-center">
                  {verifyResult.success ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-green-900 mb-2">Email Verified!</h2>
                      <p className="text-green-700 mb-6">{verifyResult.message}</p>
                      <Button asChild className="w-full">
                        <Link href="/dashboard">Go to Dashboard</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-red-900 mb-2">Verification Failed</h2>
                      <p className="text-red-700 mb-6">{verifyResult.message}</p>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login">Back to Login</Link>
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render email verification prompt
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-gray-900">ProLiink Connect</span>
              <div className="text-xs text-gray-500">Trusted Services</div>
            </div>
          </Link>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
              <p className="text-gray-600">
                We've sent a verification link to{" "}
                <span className="font-medium text-gray-900">
                  {pendingEmail || user?.email || "your email"}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What's next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the verification link in the email</li>
                  <li>• You'll be redirected back here to complete setup</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading verification page...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
