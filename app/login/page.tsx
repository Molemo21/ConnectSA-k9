"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showToast } from "@/lib/toast"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

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

      if (response.ok) {
        showToast.success("Welcome back! You've been successfully logged in.")
        
        console.log('🔄 Redirecting to:', data.redirectUrl || "/dashboard")
        
        // Use window.location.href for more reliable redirect
        window.location.href = data.redirectUrl || "/dashboard"
      } else {
        console.error('❌ Login failed:', data.error)
        showToast.error(data.error || "Login failed. Please check your credentials and try again.")
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      showToast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
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
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
