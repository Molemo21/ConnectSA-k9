"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
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
            
            // Check if there's a pending booking draft to resume
            // First check URL parameters for draft ID (cross-device support)
            const urlDraftId = searchParams.get("draftId");
            const localStorageDraftId = localStorage.getItem("pendingBookingDraftId");
            const pendingDraftId = urlDraftId || localStorageDraftId;
            
            if (pendingDraftId) {
              console.log('📝 Found pending booking draft, auto-logging in and redirecting to continue booking:', pendingDraftId)
              // Don't clean up localStorage here - let the resume page handle it
              // The draft is stored under 'booking_draft' key, not 'pendingBookingDraftId'
              // Only clean up the temporary pendingBookingDraftId if it was used
              if (localStorageDraftId) {
                localStorage.removeItem("pendingBookingDraftId");
              }
              
              // Auto-login the user first
              try {
                const autoLoginResponse = await fetch('/api/auth/auto-login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-draft-id': pendingDraftId
                  },
                  body: JSON.stringify({
                    userId: data.user.id,
                    email: data.user.email
                  })
                })

                if (autoLoginResponse.ok) {
                  const autoLoginData = await autoLoginResponse.json()
                  console.log('✅ Auto-login successful:', autoLoginData.user.email)
                  
                  // Store draft data in sessionStorage for the booking page to pick up
                  if (autoLoginData.draft) {
                    console.log('📝 Storing merged draft data for booking page:', autoLoginData.draft.id)
                    console.log('📝 Draft data:', autoLoginData.draft)
                    sessionStorage.setItem('resumeBookingData', JSON.stringify(autoLoginData.draft))
                    console.log('📝 Stored in sessionStorage as resumeBookingData')
                  } else {
                    console.log('⚠️ No draft data received from auto-login')
                  }
                  
                  // Start countdown and auto-redirect to dashboard
                  setIsRedirecting(true)
                  setCountdown(3)
                  
                  // Countdown timer
                  const countdownInterval = setInterval(() => {
                    setCountdown(prev => {
                      if (prev === null || prev <= 1) {
                        clearInterval(countdownInterval)
                        // Redirect to dashboard where user can see "Resume Booking" button
                        router.push('/dashboard')
                        return null
                      }
                      return prev - 1
                    })
                  }, 1000)
                } else {
                  console.error('❌ Auto-login failed, falling back to manual login')
                  // Fallback to manual login flow
                  router.push(`/login?intent=dashboard&draftId=${pendingDraftId}`)
                }
              } catch (error) {
                console.error('❌ Auto-login error:', error)
                // Fallback to manual login flow
                router.push(`/login?intent=dashboard&draftId=${pendingDraftId}`)
              }
            }
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
  }, [token, router, searchParams, verifyResult, verifying]) // Include all dependencies

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
      const email = user?.email || emailInput
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
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  // Removed unused features array

  // Render token verification result if token is present
  if (token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8 animate-slide-in-up">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 mb-6 group animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Image 
                src="/handshake.png" 
                alt="ProLiink Connect Logo" 
                width={40}
                height={40}
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
              />
              <div className="flex flex-col">
                <span className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 leading-tight">ProL<span className="text-blue-400">ii</span>nk</span>
                <span className="text-xs text-gray-500 leading-tight hidden xs:block">Connect</span>
              </div>
            </Link>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
                      
                      {/* Check if there's a booking draft to resume */}
                      {(() => {
                        const urlDraftId = searchParams.get("draftId");
                        const localStorageDraftId = localStorage.getItem("pendingBookingDraftId");
                        const hasBookingDraft = urlDraftId || localStorageDraftId;
                        
                        if (hasBookingDraft && isRedirecting) {
                          return (
                            <div className="space-y-4">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                </div>
                  <p className="text-sm text-blue-700 mb-2">
                    🎉 Great! You&apos;re now logged in. You can continue your booking from the dashboard.
                  </p>
                <p className="text-lg font-semibold text-blue-800 mb-4">
                  Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
                              </div>
                              
                              {/* Optional: Quick redirect button */}
                              <Button 
                                onClick={async () => {
                                  // Ensure draft data is stored before redirecting
                                  const currentDraftId = urlDraftId || localStorageDraftId;
                                  if (currentDraftId) {
                                    try {
                                      const { getBookingDraft } = await import('@/lib/booking-draft')
                                      const draft = await getBookingDraft(currentDraftId)
                                      if (draft) {
                                        sessionStorage.setItem('resumeBookingData', JSON.stringify(draft))
                                        console.log('📝 Stored draft data for manual redirect:', draft.id)
                                      }
                                    } catch (error) {
                                      console.error('Failed to get draft for manual redirect:', error)
                                    }
                                  }
                                      router.push('/dashboard');
                                }}
                                variant="outline"
                                className="w-full"
                              >
                                Go to Dashboard (Skip Countdown)
                              </Button>
                            </div>
                          );
                        } else if (hasBookingDraft && !isRedirecting) {
                          // Fallback: Manual button if auto-redirect didn't start
                          return (
                            <div className="space-y-3">
                              <Button 
                                onClick={async () => {
                                  // Ensure draft data is stored before redirecting
                                  const currentDraftId = urlDraftId || localStorageDraftId;
                                  if (currentDraftId) {
                                    try {
                                      const { getBookingDraft } = await import('@/lib/booking-draft')
                                      const draft = await getBookingDraft(currentDraftId)
                                      if (draft) {
                                        sessionStorage.setItem('resumeBookingData', JSON.stringify(draft))
                                        console.log('📝 Stored draft data for manual redirect:', draft.id)
                                      }
                                    } catch (error) {
                                      console.error('Failed to get draft for manual redirect:', error)
                                    }
                                  }
                                      router.push('/dashboard');
                                }}
                                className="w-full"
                              >
                                Go to Dashboard
                              </Button>
                              <Button asChild variant="outline" className="w-full">
                                <Link href="/book-service">Start New Booking</Link>
                              </Button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="space-y-3">
                              <Button asChild className="w-full">
                                <Link href="/dashboard">Go to Dashboard</Link>
                              </Button>
                              <Button asChild variant="outline" className="w-full">
                                <Link href="/login">Back to Login</Link>
                              </Button>
                            </div>
                          );
                        }
                      })()}
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-red-900 mb-2">Verification Failed</h2>
                      <p className="text-red-700 mb-6">{verifyResult.message}</p>
                      
                      {/* Show resend button for expired tokens */}
                      {verifyResult.message.includes('expired') ? (
                        <div className="space-y-3">
                          <Button
                            onClick={handleResendEmail}
                            disabled={isResending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isResending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              "Get New Verification Link"
                            )}
                          </Button>
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/login">Back to Login</Link>
                          </Button>
                        </div>
                      ) : (
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
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/login">Back to Login</Link>
                          </Button>
                        </div>
                      )}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative animate-fade-in">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
        style={{
          backgroundImage: "url('/clean clean.jpg')"
        }}
      />
      {/* Dim overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10 animate-slide-in-up">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile First */}
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6 group animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Image 
                src="/handshake.png" 
                alt="ProLiink Connect Logo" 
                width={40}
                height={40}
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
              />
              <div className="flex flex-col">
                <span className="text-base xs:text-lg sm:text-xl font-bold text-white leading-tight">ProL<span className="text-blue-400">ii</span>nk</span>
                <span className="text-xs text-gray-300 leading-tight hidden xs:block">Connect</span>
              </div>
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight animate-fade-in" style={{ animationDelay: '0.4s' }}>Verify Your Email</h1>
            <p className="text-lg sm:text-xl text-gray-200 leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s' }}>Complete your account setup by verifying your email address</p>
          </div>

          <div className="flex justify-center">
            {/* Verification Form - Centered */}
            <div className="w-full max-w-md">
              <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <CardHeader className="space-y-1 pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl text-center text-white">Email Verification</CardTitle>
                  <CardDescription className="text-center text-sm sm:text-base text-gray-300">Check your email and click the verification link</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
                    <p className="text-gray-300">
                      We&apos;ve sent a verification link to{" "}
                      <span className="font-medium text-white">
                        {pendingEmail || user?.email || "your email"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-300 mb-2">What&apos;s next?</h3>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• Check your email inbox (and spam folder)</li>
                        <li>• Look for emails from <strong className="text-blue-100">no-reply@app.proliinkconnect.co.za</strong></li>
                        <li>• Click the verification link in the email</li>
                        <li>• You&apos;ll be redirected back here to complete setup</li>
                      </ul>
                    </div>

                    {showEmailPrompt && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="h-11 sm:h-12 text-base bg-white/10 border-white/20 text-white placeholder-gray-400"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Button
                        onClick={handleResendEmail}
                        disabled={isResending}
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
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

                      <Button asChild variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10">
                        <Link href="/login">Back to Login</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
