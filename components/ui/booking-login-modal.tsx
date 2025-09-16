"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { X, Loader2, ArrowRight, UserPlus, AlertCircle, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { showToast, handleApiError } from "@/lib/toast"
import Link from "next/link"

interface BookingLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: () => void
  bookingData?: {
    serviceId: string
    date: string
    time: string
    address: string
    notes?: string
  }
}

export function BookingLoginModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  bookingData 
}: BookingLoginModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  console.log('🔍 [BookingLoginModal] Render state:', { isOpen, bookingData })

  if (!isOpen) {
    console.log('🔍 [BookingLoginModal] Modal not open, returning null')
    return null
  }

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
        
        // Save booking data to sessionStorage for continuation
        if (bookingData && typeof window !== "undefined") {
          sessionStorage.setItem("bookingDetails", JSON.stringify(bookingData))
        }
        
        onLoginSuccess()
        onClose()
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden animate-fade-in">
      {/* Background image with booking theme - same as login page */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-100 opacity-90 transition-all duration-700 animate-zoom-in"
        style={{ backgroundImage: "url('/booking.jpg')" }}
      ></div>
      {/* Light overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20"></div>
      {/* Darker overlay for modal focus */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Close button in top right */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-6 right-6 z-20 text-white hover:text-gray-300 hover:bg-white/10"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Logo in top left */}
      <div className="absolute top-6 left-6 z-20 animate-slide-in-left">
        <div className="inline-flex items-center space-x-3 group">
          <img 
            src="/handshake.png" 
            alt="ProLiink Connect Logo" 
            className="w-12 h-12 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
          />
          <div className="text-left">
            <span className="text-2xl font-bold text-white">ProL<span className="text-blue-400">ii</span>nk</span>
            <div className="text-xs text-gray-200">Connect</div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10 animate-slide-in-up">
        {/* Login Form */}
        <div className="w-full">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-200">Sign in to continue your booking</p>
          </div>

          {/* Booking Summary */}
          {bookingData && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg backdrop-blur-sm animate-fade-in-up">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-300 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-100">Your booking details are saved</p>
                  <p className="text-blue-200 text-xs mt-1">
                    We'll continue your booking after you sign in
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-scale-in">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
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
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
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

                <Separator className="bg-gradient-to-r from-blue-500 to-purple-500 h-0.5" />

                <div className="text-center">
                  <p className="text-sm text-gray-300">
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
      </div>
    </div>
  )
}
