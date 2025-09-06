"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, User, Briefcase, CheckCircle, ArrowRight, Shield, Clock, Star, Users } from "lucide-react"

export default function SignupPage() {
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
    role: (searchParams.get("role") === "provider" ? "PROVIDER" : "CLIENT") as "CLIENT" | "PROVIDER",
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
        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account.",
        })
        router.push("/verify-email")
      } else {
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clientBenefits = [
    "Book trusted service providers instantly",
    "Transparent pricing with no hidden fees",
    "Secure payment processing",
    "Review and rate your experience",
  ]

  const providerBenefits = [
    "Earn money offering your services",
    "Flexible working schedule",
    "Build your customer base",
    "Get paid securely and on time",
  ]

  const features = [
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All providers are background-checked and verified"
    },
    {
      icon: Clock,
      title: "Quick Booking",
      description: "Book services in minutes with instant confirmation"
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "All services come with our satisfaction guarantee"
    },
    {
      icon: Users,
      title: "Trusted Community",
      description: "Join thousands of satisfied customers"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">Join ProLiink Connect</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">Create your account and start your journey with us</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Left Side - Signup Form - Mobile First */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl text-center">Create Account</CardTitle>
                  <CardDescription className="text-center text-sm sm:text-base">Choose your account type and get started</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <Tabs 
                    value={formData.role.toLowerCase()} 
                    onValueChange={(value) => setFormData({ ...formData, role: value.toUpperCase() as "CLIENT" | "PROVIDER" })}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-12">
                      <TabsTrigger value="client" className="flex items-center space-x-2 text-xs sm:text-sm">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Client</span>
                      </TabsTrigger>
                      <TabsTrigger value="provider" className="flex items-center space-x-2 text-xs sm:text-sm">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Provider</span>
                      </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="h-12 sm:h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-12 sm:h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="h-12 sm:h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="pr-12 h-12 sm:h-12 text-base"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 sm:h-12 text-base sm:text-lg font-medium"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating account...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>Create Account</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <span className="text-sm text-gray-600">Already have an account? </span>
                        <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Sign in
                        </Link>
                      </div>
                    </form>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Benefits - Mobile First */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-xl">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  {formData.role === "CLIENT" ? "Why Join as a Client?" : "Why Join as a Provider?"}
                </h3>
                
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {(formData.role === "CLIENT" ? clientBenefits : providerBenefits).map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 sm:p-4 text-white">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Ready to get started?</h4>
                  <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                    {formData.role === "CLIENT" 
                      ? "Join thousands of satisfied customers who trust ProLiink Connect."
                      : "Start earning money by offering your services to our community."
                    }
                  </p>
                </div>
              </div>

              {/* Features - Mobile First */}
              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Why Choose ProLiink Connect?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <div key={index} className="text-center p-3 sm:p-4 bg-white/60 rounded-lg hover:scale-105 transition-transform duration-200">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 leading-tight">{feature.title}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
