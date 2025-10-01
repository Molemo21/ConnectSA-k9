"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2, ArrowLeft, AlertCircle } from "lucide-react"
import { showToast } from "@/lib/toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Client-side email validation
    if (!email.trim()) {
      setError("Please enter your email address")
      showToast.error("Please enter your email address")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      showToast.error("Please enter a valid email address")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSubmitted(true)
        showToast.success("Password reset link sent! Check your email.", "Email Sent")
        console.log("✅ Success:", data.message)
      } else {
        const errorMsg = data.error || "Failed to send reset link. Please try again."
        setError(errorMsg)
        showToast.error(errorMsg, "Error")
        console.error("❌ Error:", data.error)
      }
    } catch (error) {
      const errorMsg = "Network error. Please check your connection and try again."
      setError(errorMsg)
      showToast.error(errorMsg, "Connection Error")
      console.error("❌ Network error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/forgot.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Home button */}
            <div className="absolute top-6 left-6 z-20">
              <Link href="/" className="inline-flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <img 
                    src="/handshake.png" 
                    alt="ProLiink Connect" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-white">ProLiink</div>
                  <div className="text-xs text-blue-300">Connect</div>
                </div>
              </Link>
            </div>

            <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
                  <p className="text-green-300">
                    If an account with that email exists, a password reset link has been sent.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                    <h3 className="font-semibold text-green-200 mb-2">What's next?</h3>
                    <ul className="text-sm text-green-300 space-y-1">
                      <li>• Check your email inbox (and spam folder)</li>
                      <li>• Click the password reset link in the email</li>
                      <li>• Create a new password for your account</li>
                    </ul>
                  </div>

                  <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in">
      {/* Background image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
        style={{ backgroundImage: "url('/forgot.jpg')" }}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Home button */}
          <div className="absolute top-6 left-6 z-20">
            <Link href="/" className="inline-flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                <img 
                  src="/handshake.png" 
                  alt="ProLiink Connect" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-white">ProLiink</div>
                <div className="text-xs text-blue-300">Connect</div>
              </div>
            </Link>
          </div>

          <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
                <p className="text-white/80">
                  Enter your email to receive a password reset link.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-300 font-medium">Error</p>
                        <p className="text-sm text-red-200 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError("") // Clear error when user types
                      }}
                      required
                      disabled={isLoading}
                      className={`w-full pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 ${
                        error ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                
                <div className="text-center pt-4">
                  <Link 
                    href="/login" 
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Remember your password? Sign in</span>
                  </Link>
                </div>
              </form>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 