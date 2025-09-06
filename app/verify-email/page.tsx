"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle, XCircle, Loader2, Shield, Clock, Users } from "lucide-react"

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
  
  // Use a ref to track if verification has been attempted for this token
  // This prevents multiple API calls even if the component re-renders
  const verificationAttempted = useRef<Set<string>>(new Set());

  // Handle token verification if token is present
  useEffect(() => {
    if (token && !verifying && !verifyResult && !verificationAttempted.current.has(token)) {
      console.log("🔍 Frontend: Starting verification for token:", token.substring(0, 8) + "...")
      console.log("🔍 Frontend: Verification state - verifying:", verifying, "verifyResult:", verifyResult)
      console.log("🔍 Frontend: Tokens already attempted:", Array.from(verificationAttempted.current))
      
      setVerifying(true)
      verificationAttempted.current.add(token)
      
      fetch(`/api/auth/verify-email?token=${token}`)
        .then(async (res) => {
          console.log("🔍 Frontend: Verification response status:", res.status)
          const data = await res.json()
          console.log("🔍 Frontend: Verification response data:", data)
          
          if (res.ok) {
            console.log("✅ Frontend: Verification successful, setting success state")
            setVerifyResult({ success: true, message: data.message || "Email verified successfully!" })
            // Clean up localStorage here instead of in a separate useEffect
            localStorage.removeItem("pendingVerificationEmail");
          } else {
            console.log("❌ Frontend: Verification failed, setting error state")
            // Check if user is already verified (this can happen with double-clicks)
            if (data.message && data.message.includes('already verified')) {
              setVerifyResult({ success: true, message: "Email already verified! You can now log in." })
            } else if (res.status === 429) {
              setVerifyResult({ success: false, message: "Too many attempts. Please wait 30 seconds and try again." })
            } else if (res.status === 400 && data.error && data.error.includes('expired')) {
              setVerifyResult({ success: false, message: "Verification link has expired. Please request a new one." })
            } else if (res.status === 400 && data.error && data.error.includes('Invalid or expired token')) {
              setVerifyResult({ success: false, message: "Invalid verification link. Please check your email or request a new one." })
            } else {
              setVerifyResult({ success: false, message: data.error || "Verification failed. Please try again." })
            }
          }
        })
        .catch((error) => {
          console.error("❌ Frontend: Verification request failed:", error)
          setVerifyResult({ success: false, message: "Verification failed. Please try again." })
        })
        .finally(() => {
          console.log("🔍 Frontend: Verification process completed")
          setVerifying(false)
        })
    } else if (token) {
      console.log("🔍 Frontend: Skipping verification - already attempted or in progress")
      console.log("🔍 Frontend: Token:", token.substring(0, 8) + "...")
      console.log("🔍 Frontend: Verifying:", verifying)
      console.log("🔍 Frontend: VerifyResult:", verifyResult)
      console.log("🔍 Frontend: Already attempted:", verificationAttempted.current.has(token))
    }
  }, [token]) // Only depend on token - run once per token

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

  // Remove the conflicting useEffect that was causing re-renders
  // We'll handle localStorage cleanup in the verification success handler instead

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

  const features = [
    {
      icon: Shield,
      title: "Secure & Verified",
      description: "All providers are background-checked and verified"
    },
    {
      icon: Clock,
      title: "Quick Booking",
      description: "Book services in minutes with instant confirmation"
    },
    {
      icon: Users,
      title: "Trusted Community",
      description: "Join thousands of satisfied customers"
    }
  ]

  // Render token verification result if token is present
  if (token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
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
                      <div className="space-y-3">
                        <Button asChild className="w-full">
                          <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/login">Back to Login</Link>
                        </Button>
                      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile First */}
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                <span className="text-white font-bold text-lg sm:text-xl">P</span>
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">ProLiink Connect</span>
                <div className="text-xs sm:text-sm text-gray-500">Trusted Services</div>
              </div>
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">Verify Your Email</h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">Complete your account setup by verifying your email address</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Left Side - Verification Form - Mobile First */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl text-center">Email Verification</CardTitle>
                  <CardDescription className="text-center text-sm sm:text-base">Check your email and click the verification link</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
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
                        <li>• Look for emails from <strong>no-reply@app.proliinkconnect.co.za</strong></li>
                        <li>• Click the verification link in the email</li>
                        <li>• You'll be redirected back here to complete setup</li>
                      </ul>
                    </div>

                    {showEmailPrompt && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="h-11 sm:h-12 text-base"
                          />
                        </div>
                      </div>
                    )}

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

            {/* Right Side - Features - Mobile First */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Why Choose ProLiink Connect?</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">Join our trusted community of service providers and clients</p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Ready to get started?</h3>
                  <p className="text-blue-800 text-sm leading-relaxed mb-3">
                    Once you verify your email, you'll have access to all our features and can start booking or providing services immediately.
                  </p>
                  <Button asChild size="sm" className="w-full sm:w-auto">
                    <Link href="/dashboard">Explore Dashboard</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
