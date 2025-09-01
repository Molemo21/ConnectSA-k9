"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        toast({
          title: "Check your email",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Something went wrong.",
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
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Overlay for dark effect */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>

      <div className="w-full max-w-md mx-auto relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
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
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg animate-fade-in">Forgot Password</h1>
          <p className="text-gray-300 text-base">Enter your email to receive a password reset link.</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl text-white rounded-2xl transition-all duration-300 hover:shadow-3xl">
          <CardContent className="p-8">
            {submitted ? (
              <div className="text-center py-8">
                <p className="text-green-400 font-medium mb-2">If an account with that email exists, a password reset link has been sent.</p>
                <Button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-lg py-3 rounded-xl shadow-lg transition-all duration-200" onClick={() => router.push("/login")}>Back to Login</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-blue-400 animate-fade-in" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 bg-white/20 border border-blue-500/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      aria-label="Email Address"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-lg py-3 rounded-xl shadow-lg transition-all duration-200" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center pt-2">
                  <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 