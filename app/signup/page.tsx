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
import { Eye, EyeOff, User, Briefcase, CheckCircle } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ServiceHub SA</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join ServiceHub SA</h1>
          <p className="text-gray-600">Create your account and start your journey with us</p>
        </div>

        <Tabs
          value={formData.role.toLowerCase()}
          onValueChange={(value) => setFormData({ ...formData, role: value.toUpperCase() as "CLIENT" | "PROVIDER" })}
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="client" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>I need services</span>
            </TabsTrigger>
            <TabsTrigger value="provider" className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>I offer services</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Benefits Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {formData.role === "CLIENT" ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-primary" />
                  )}
                  <span>{formData.role === "CLIENT" ? "Client Benefits" : "Provider Benefits"}</span>
                </CardTitle>
                <CardDescription>
                  {formData.role === "CLIENT" ? "What you get as a client" : "What you get as a service provider"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(formData.role === "CLIENT" ? clientBenefits : providerBenefits).map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
                {formData.role === "PROVIDER" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <Badge className="mb-2">Note</Badge>
                    <p className="text-sm text-gray-600">
                      Provider accounts require verification before you can start accepting bookings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signup Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Fill in your details to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27 123 456 789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
