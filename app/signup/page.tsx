"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { showToast, handleApiError } from "@/lib/toast"
import { Eye, EyeOff, User, Briefcase, CheckCircle, ArrowRight, Mail, Lock, UserPlus, Loader2 } from "lucide-react"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: (searchParams?.get("role") === "provider" ? "PROVIDER" : "CLIENT") as "CLIENT" | "PROVIDER",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Log out any previous user
        await fetch("/api/auth/logout", { method: "POST" });
        // Store the signup email for verification page
        localStorage.setItem("pendingVerificationEmail", formData.email);
        
        // Check if there's a booking draft to preserve
        const draftId = document.cookie
          .split('; ')
          .find(row => row.startsWith('booking_draft_id='))
          ?.split('=')[1]
        
        if (draftId) {
          // Store draft ID for after verification
          localStorage.setItem("pendingBookingDraftId", draftId);
          console.log('📝 Preserving booking draft for after signup:', draftId)
        }
        
        showToast.success("Account created successfully! Please check your email to verify your account.")
        router.push("/verify-email")
      } else {
        await handleApiError(response, "Failed to create account. Please try again.")
      }
    } catch (error) {
      console.error("Signup error:", error)
      showToast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background image with signup theme */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-100 opacity-90 transition-all duration-700 animate-zoom-in"
        style={{ backgroundImage: "url('/signup.jpg')" }}
      ></div>
      {/* Light overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Home button in top left */}
      <div className="absolute top-6 left-6 z-20 animate-slide-in-left">
        <Link href="/" className="inline-flex items-center space-x-3 group">
          <img 
            src="/handshake.png" 
            alt="ProLiink Connect Logo" 
            className="w-12 h-12 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
          />
          <div className="text-left">
            <span className="text-2xl font-bold text-white">ProL<span className="text-blue-400">ii</span>nk</span>
            <div className="text-xs text-gray-200">Connect</div>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10 animate-slide-in-up">
        {/* Signup Form */}
        <div className="w-full">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">Join ProLiink Connect</h1>
            <p className="text-gray-200">Create your account and start your journey with us</p>
          </div>

          <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-scale-in">
            <CardContent className="p-8">
              <Tabs 
                value={formData.role.toLowerCase()} 
                onValueChange={(value) => setFormData({ ...formData, role: value.toUpperCase() as "CLIENT" | "PROVIDER" })}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-gray-800">
                  <TabsTrigger value="client" className="flex items-center space-x-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <User className="w-4 h-4" />
                    <span>Client</span>
                  </TabsTrigger>
                  <TabsTrigger value="provider" className="flex items-center space-x-2 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Briefcase className="w-4 h-4" />
                    <span>Provider</span>
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        required
                        aria-label="Full Name"
                      />
                    </div>
                  </div>

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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        required
                        aria-label="Email Address"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      required
                      aria-label="Phone Number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
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

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <Separator className="bg-gradient-to-r from-blue-500 to-purple-500 h-0.5" />

                  <div className="text-center">
                    <p className="text-sm text-gray-300">
                      Already have an account?{" "}
                      <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading signup page...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
