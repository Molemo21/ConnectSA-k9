"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showToast } from "@/lib/toast"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Form submitted!', { email: formData.email, password: formData.password ? '***' : 'empty' })
    setIsLoading(true)

    try {
      console.log('🔐 Attempting login:', { email: formData.email })
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
        credentials: 'include' // Ensure cookies are sent
      })

      console.log('📡 Login response:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })

      const data = await response.json()
      console.log('📄 Login response data:', data)
      console.log('📊 Response details:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        console.log('✅ Login successful!')
        // Clear verification state on successful login
        setNeedsVerification(false)
        setResendSuccess(false)
        showToast.success("Welcome back! You've been successfully logged in.")
        
        console.log('🔄 About to redirect to:', data.redirectUrl || "/dashboard")
        
        // Add a small delay to see the logs before redirect
        setTimeout(() => {
          console.log('🚀 Executing redirect now...')
          
          // Use Next.js router for better SPA navigation
          try {
            console.log('🔄 Using Next.js router.push for SPA navigation')
            router.push(data.redirectUrl || "/dashboard")
            
            // Fallback: if router doesn't work, use window.location
            setTimeout(() => {
              if (window.location.pathname === '/login') {
                console.log('🔄 Router failed, using window.location.replace')
                window.location.replace(data.redirectUrl || "/dashboard")
              }
            }, 100)
          } catch (error) {
            console.error('❌ Router redirect failed:', error)
            // Fallback to window.location
            console.log('🔄 Fallback to window.location.replace')
            window.location.replace(data.redirectUrl || "/dashboard")
          }
        }, 500) // Reduced delay for faster redirect
      } else {
        console.error('❌ Login failed:', data.error)
        
        // Check if error is due to unverified email
        if (response.status === 403 && data.error?.toLowerCase().includes('verify your email')) {
          setNeedsVerification(true)
          setResendSuccess(false) // Reset success state on new login attempt
          showToast.error("Please verify your email before logging in.")
        } else {
          setNeedsVerification(false) // Clear verification state for other errors
          showToast.error(data.error || "Login failed. Please check your credentials and try again.")
        }
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      setNeedsVerification(false) // Clear verification state on network errors
      showToast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!formData.email.trim()) {
      showToast.error("Please enter your email address first.")
      return
    }

    setIsResending(true)
    setResendSuccess(false)

    try {
      console.log('📧 Resending verification email to:', formData.email)
      
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()
      console.log('📧 Resend response:', data)

      if (response.ok) {
        setResendSuccess(true)
        showToast.success("Verification email sent! Please check your inbox and spam folder.")
      } else {
        // Handle specific error cases
        if (response.status === 429) {
          showToast.error("Too many attempts. Please wait a few minutes before trying again.")
        } else {
          showToast.error(data.error || "Failed to send verification email. Please try again.")
        }
      }
    } catch (error) {
      console.error('❌ Error resending verification email:', error)
      showToast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background image with booking theme */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-100 opacity-90 transition-all duration-700 animate-zoom-in"
        style={{ backgroundImage: "url('/booking.jpg')" }}
      ></div>
      {/* Light overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Home button in top left */}
      <div className="absolute top-6 left-6 z-20 animate-slide-in-left">
        <Link href="/" className="inline-flex items-center space-x-3 group">
          <Image 
            src="/handshake.png" 
            alt="ProLiink Connect Logo" 
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
          />
          <div className="text-left">
            <span className="text-2xl font-bold text-white">ProL<span className="text-blue-400">ii</span>nk</span>
            <div className="text-xs text-gray-200">Connect</div>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10 animate-slide-in-up">
        {/* Login Form */}
        <div className="w-full">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-200">Sign in to your account to continue</p>
          </div>

          <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-scale-in">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        // Clear verification state when user changes email
                        if (needsVerification) {
                          setNeedsVerification(false)
                          setResendSuccess(false)
                        }
                      }}
                      className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      required
                      aria-label="Email Address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      required
                      aria-label="Password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2">
                    Forgot password?
                  </Link>
                </div>

                {/* Resend Verification Email Section */}
                {needsVerification && (
                  <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 space-y-3 animate-fade-in">
                    <p className="text-sm text-blue-300">
                      Need a new verification email? We&apos;ll send a fresh link to <strong className="text-blue-200">{formData.email}</strong>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendVerification}
                      disabled={isResending || resendSuccess}
                      className="w-full border-blue-400/50 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200 disabled:opacity-50"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : resendSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Email Sent! Check your inbox
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-300">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
