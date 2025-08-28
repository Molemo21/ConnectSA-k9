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

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CLIENT"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const styleId = "breathing-keyframes-style";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `@keyframes breathing { 0% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } 100% { opacity: 0.7; transform: scale(1); } } .animate-breathing { animation: breathing 2.5s ease-in-out infinite; }`;
        document.head.appendChild(style);
      }
    }
  }, []);

  const clientBenefits = [
    "Access top-rated providers",
    "Easy booking and management",
    "Verified reviews and ratings",
    "Secure payments"
  ];
  const providerBenefits = [
    "Grow your business",
    "Connect with new clients",
    "Flexible scheduling",
    "Get paid securely"
  ];
  const features = [
    { icon: Shield, title: "Secure", description: "Your data is protected." },
    { icon: Clock, title: "Fast", description: "Quick and easy signup." },
    { icon: Star, title: "Trusted", description: "Thousands of happy users." },
    { icon: Users, title: "Community", description: "Join a growing network." }
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // Simulate async signup
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Account created!", description: "Welcome to ProLiink Connect." });
      router.push("/login");
    }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gradient-to-br from-blue-900 via-purple-900 to-black overflow-hidden">
      {/* Responsive, blurred, dimmed background image using create.jpg */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-100 blur-sm opacity-70 transition-all duration-700"
        style={{ backgroundImage: "url('/create.jpg')" }}
      ></div>
      {/* Overlay: lighter dim effect */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Signup Form */}
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
            <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg animate-fade-in">Join ProLiink Connect</h1>
            <p className="text-gray-300 text-base">Create your account and start your journey with us</p>
                  // Add breathing keyframes to global styles if not present
          </div>
            <Card className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl">
              <CardContent>
                <Tabs defaultValue="client" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="client" className="flex items-center space-x-2" onClick={() => setFormData({ ...formData, role: "CLIENT" })}>
                      <User className="w-4 h-4" />
                      <span>Client</span>
                    </TabsTrigger>
                    <TabsTrigger value="provider" className="flex items-center space-x-2" onClick={() => setFormData({ ...formData, role: "PROVIDER" })}>
                      <Briefcase className="w-4 h-4" />
                      <span>Provider</span>
                    </TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-white">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white/20 border border-blue-500/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-white/20 border border-blue-500/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-white">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-white/20 border border-blue-500/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pr-10 bg-white/20 border border-purple-500/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 animate-fade-in" /> : <Eye className="h-4 w-4 animate-fade-in" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-lg py-3 rounded-xl shadow-lg transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>

                  <div className="text-center">
                    <span className="text-sm text-gray-200">Already have an account? </span>
                    <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
                      Sign in
                    </Link>
                  </div>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
        </div>
        {/* Right Side - Benefits */}
        <div className="w-full max-w-md mx-auto animate-fade-in-up">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">
              {formData.role === "CLIENT" ? "Why Join as a Client?" : "Why Join as a Provider?"}
            </h3>
            <div className="space-y-4 mb-6">
              {(formData.role === "CLIENT" ? clientBenefits : providerBenefits).map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
              <h4 className="font-semibold mb-2">Ready to get started?</h4>
              <p className="text-blue-100 text-sm">
                {formData.role === "CLIENT" 
                  ? "Join thousands of satisfied customers who trust ProLiink Connect."
                  : "Start earning money by offering your services to our community."
                }
              </p>
            </div>
          </div>
          {/* Features */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Why Choose ProLiink Connect?</h3>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center p-4 bg-white/20 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-blue-400 animate-bounce" />
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-200">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
