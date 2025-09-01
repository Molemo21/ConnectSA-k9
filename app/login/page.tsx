"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { showToast, handleApiError } from "@/lib/toast"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Clock, Users, Loader2 } from "lucide-react"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        showToast.success("Welcome back! You've been successfully logged in.")

        // Intent-based redirect
        const intent = searchParams?.get("intent")
        if (intent === "booking") {
          router.push("/book-service?intent=booking")
        } else {
          // Redirect based on user role and verification status
          router.push(data.redirectUrl || "/dashboard")
        }
      } else {
        await handleApiError(response, "Login failed. Please check your credentials and try again.")
      }
    } catch (error) {
      console.error("Login error:", error)
      showToast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gradient-to-br from-blue-900 via-purple-900 to-black overflow-hidden">
      {/* Responsive, less blurred, more visible background image using login.jpg */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-100 opacity-70 transition-all duration-700"
        style={{ backgroundImage: "url('/login.jpg')" }}
      ></div>
      {/* Overlay: lighter dim effect */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Login Form */}
        <div className="w-full max-w-md mx-auto animate-fade-in-up">
          <div className="text-center mb-8">
            {/* Handshake logo at the top with breathing animation */}
            <div className="flex justify-center mb-6">
              <button type="button" onClick={() => window.location.href = '/'}>
                <img
                  src="/handshake.png"
                  alt="Handshake Logo"
                  className="w-16 h-16 rounded-xl shadow-lg object-cover animate-breathing"
                  style={{ animation: 'breathing 2.5s ease-in-out infinite' }}
                />
              </button>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg animate-fade-in">Welcome Back</h1>
            <p className="text-gray-300 text-base">Sign in to your account to continue</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl text-white rounded-2xl transition-all duration-300 hover:shadow-3xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-blue-400 animate-fade-in" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 bg-white/20 border border-blue-500/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                      aria-label="Email Address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-purple-400 animate-fade-in" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 bg-white/20 border border-purple-500/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
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
                        <EyeOff className="w-4 h-4 animate-fade-in" />
                      ) : (
                        <Eye className="w-4 h-4 animate-fade-in" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-lg py-3 rounded-xl shadow-lg transition-all duration-200">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <Separator className="bg-gradient-to-r from-blue-500 to-purple-500 h-0.5" />

                <div className="text-center">
                  <p className="text-sm text-gray-200">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:block animate-fade-in-up">
          <div className="max-w-md bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
            <h2 className="text-4xl font-extrabold text-white mb-6 drop-shadow-lg animate-fade-in">
              Connect with Trusted Service Providers
            </h2>
            <p className="text-lg text-gray-200 mb-8">
              Join thousands of satisfied customers who trust us for their service needs.
            </p>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 animate-fade-in-up">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <feature.icon className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-200">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add breathing keyframes to global styles if not present
if (typeof window !== "undefined") {
  const styleId = "breathing-keyframes-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `@keyframes breathing { 0% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } 100% { opacity: 0.7; transform: scale(1); } } .animate-breathing { animation: breathing 2.5s ease-in-out infinite; }`;
    document.head.appendChild(style);
  }
}


export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading login page...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
