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
import { Eye, EyeOff, User, Briefcase, CheckCircle, ArrowRight, Mail, Lock, UserPlus, Loader2, AlertCircle } from "lucide-react"
import { useFormValidation } from "@/hooks/use-form-validation"

// Validation rules matching server-side schema
const signupValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      if (!value || value.trim().length === 0) return 'Full name is required'
      if (value.trim().length < 2) return 'Name must be at least 2 characters'
      if (value.trim().length > 50) return 'Name must be no more than 50 characters'
      return null
    }
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value || value.trim().length === 0) return 'Email address is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address (e.g., name@example.com)'
      return null
    }
  },
  phone: {
    required: true,
    // Pattern removed - using custom validation only to ensure helpful error messages with examples
    custom: (value: string) => {
      if (!value || value.trim().length === 0) return 'Phone number is required'
      const cleaned = value.replace(/\s/g, '').replace(/-/g, '')
      
      // South African phone number formats:
      // Local: 0821234567 (10 digits, starts with 0)
      // International: +27821234567 (12 chars, starts with +27)
      const localFormat = /^0[1-9]\d{8}$/ // 0 followed by 9 digits (10 total)
      const internationalFormat = /^\+27[1-9]\d{8}$/ // +27 followed by 9 digits (12 total)
      
      if (!localFormat.test(cleaned) && !internationalFormat.test(cleaned)) {
        return 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)'
      }
      return null
    }
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      if (!value || value.length === 0) return 'Password is required'
      if (value.length < 8) return 'Password must be at least 8 characters long'
      if (value.length > 128) return 'Password must be no more than 128 characters'
      
      // Strong password requirements
      const hasUpperCase = /[A-Z]/.test(value)
      const hasLowerCase = /[a-z]/.test(value)
      const hasNumber = /[0-9]/.test(value)
      const hasSpecialChar = /[^a-zA-Z0-9]/.test(value)
      
      if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter'
      }
      if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter'
      }
      if (!hasNumber) {
        return 'Password must contain at least one number'
      }
      if (!hasSpecialChar) {
        return 'Password must contain at least one special character (e.g., !@#$%^&*)'
      }
      
      return null
    }
  },
  confirmPassword: {
    required: true,
    custom: (value: string, allValues?: any) => {
      if (!value || value.length === 0) return 'Please confirm your password'
      // Note: We'll handle password match validation separately since we need access to password field
      return null
    }
  }
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: (searchParams?.get("role") === "provider" ? "PROVIDER" : "CLIENT") as "CLIENT" | "PROVIDER",
  })

  // Field-specific errors from API
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Use form validation hook
  const { errors: validationErrors, touched, markTouched, markAllTouched, validateAll } = useFormValidation(
    formData,
    signupValidationRules,
    300
  )

  // Combine validation errors and API errors (API errors take precedence)
  const fieldErrors: Record<string, string | null> = {}
  Object.keys(signupValidationRules).forEach(field => {
    fieldErrors[field] = apiErrors[field] || validationErrors[field] || null
  })
  
  // Password match validation (needs to check both fields)
  // Only show error if confirmPassword has been touched and doesn't match
  if (touched.confirmPassword && formData.confirmPassword && formData.password !== formData.confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match'
  } else if (formData.confirmPassword && formData.password === formData.confirmPassword) {
    // Clear the error if passwords match
    if (fieldErrors.confirmPassword === 'Passwords do not match') {
      fieldErrors.confirmPassword = null
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    // Clear API errors for this field when user starts typing
    if (apiErrors[field]) {
      setApiErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (generalError) {
      setGeneralError(null)
    }
    
    setFormData({ ...formData, [field]: value })
    markTouched(field)
    
    // If password or confirmPassword changes, re-validate the match
    if (field === 'password' || field === 'confirmPassword') {
      // Clear confirmPassword error if passwords now match
      if (field === 'password' && formData.confirmPassword && value === formData.confirmPassword) {
        setApiErrors(prev => {
          const next = { ...prev }
          delete next.confirmPassword
          return next
        })
      }
      if (field === 'confirmPassword' && formData.password && value === formData.password) {
        setApiErrors(prev => {
          const next = { ...prev }
          delete next.confirmPassword
          return next
        })
      }
    }
  }

  const handleBlur = (field: string) => {
    markTouched(field)
  }

  const handleSignupError = (response: Response, data: any) => {
    // Clear previous errors
    setApiErrors({})
    setGeneralError(null)

    // Check if it's a Zod validation error with field-specific errors
    if (data.errors && Array.isArray(data.errors)) {
      const fieldErrorMap: Record<string, string> = {}
      data.errors.forEach((err: any) => {
        if (err.path && err.path.length > 0) {
          const fieldName = err.path[0]
          fieldErrorMap[fieldName] = err.message || 'Invalid value'
        }
      })
      setApiErrors(fieldErrorMap)
      
      // Mark all error fields as touched
      Object.keys(fieldErrorMap).forEach(field => markTouched(field))
      
      // Show toast with summary
      const errorCount = Object.keys(fieldErrorMap).length
      showToast.error(
        errorCount === 1 
          ? `Please fix the error in the form.`
          : `Please fix ${errorCount} errors in the form.`
      )
      return
    }

    // Handle specific error messages
    const errorMessage = data.error || data.message || "Failed to create account"
    
    // Map common error messages to field-specific errors
    if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("already exists")) {
      setApiErrors({ email: "This email address is already registered. Please use a different email or try logging in." })
      markTouched("email")
      showToast.error("This email is already registered. Please use a different email.")
    } else if (errorMessage.toLowerCase().includes("email") && (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("format"))) {
      setApiErrors({ email: "Please enter a valid email address." })
      markTouched("email")
      showToast.error("Please enter a valid email address.")
    } else if (errorMessage.toLowerCase().includes("password") && errorMessage.toLowerCase().includes("at least")) {
      setApiErrors({ password: "Password must be at least 6 characters long." })
      markTouched("password")
      showToast.error("Password must be at least 6 characters long.")
    } else if (errorMessage.toLowerCase().includes("name") && errorMessage.toLowerCase().includes("at least")) {
      setApiErrors({ name: "Name must be at least 2 characters long." })
      markTouched("name")
      showToast.error("Name must be at least 2 characters long.")
    } else if (errorMessage.toLowerCase().includes("phone") && (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("format"))) {
      setApiErrors({ phone: "Please enter a valid phone number." })
      markTouched("phone")
      showToast.error("Please enter a valid phone number.")
    } else if (errorMessage.includes("Too many verification requests")) {
      setGeneralError("Too many verification requests. Please wait an hour before requesting another verification email.")
      showToast.error("Too many verification requests. Please wait an hour before trying again.")
    } else {
      // Generic error fallback
      setGeneralError(errorMessage)
      showToast.error(errorMessage)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setApiErrors({})
    setGeneralError(null)
    
    // Mark all fields as touched to show validation errors
    markAllTouched()
    
    // Validate all fields - wait a bit for debounced validation to complete
    // Then check if there are any errors
    const validationErrors = validateAll()
    
    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setApiErrors({ confirmPassword: 'Passwords do not match' })
      markTouched('confirmPassword')
      showToast.error("Passwords do not match. Please check and try again.")
      return
    }
    
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== null)
    
    if (hasValidationErrors) {
      showToast.error("Please fix the errors in the form before submitting.")
      return
    }

    setIsLoading(true)

    try {
      // Get current draft ID from cookie to send in headers
      const draftId = document.cookie
        .split('; ')
        .find(row => row.startsWith('booking_draft_id='))
        ?.split('=')[1]

      // Don't send confirmPassword to the API
      const { confirmPassword, ...signupData } = formData
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(draftId && { "x-draft-id": draftId })
        },
        body: JSON.stringify(signupData),
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
        handleSignupError(response, data)
      }
    } catch (error) {
      console.error("Signup error:", error)
      setGeneralError("Network error. Please check your connection and try again.")
      showToast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:p-4 relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background image with signup theme */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-100 opacity-90 transition-all duration-700 animate-zoom-in"
        style={{ backgroundImage: "url('/signup.jpg')" }}
      ></div>
      {/* Light overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Home button in top left - isolated at the top */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-30 animate-slide-in-left">
        <Link href="/" className="inline-flex items-center space-x-2 sm:space-x-3 group">
          <img 
            src="/handshake.png" 
            alt="ProLiink Connect Logo" 
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
          />
          <div className="text-left">
            <span className="text-lg sm:text-2xl font-bold text-white">ProL<span className="text-blue-400">ii</span>nk</span>
            <div className="text-[10px] sm:text-xs text-gray-200">Connect</div>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto px-2 sm:px-4 pt-20 sm:pt-24 relative z-10 animate-slide-in-up">
        {/* Signup Form */}
        <div className="w-full">
          <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Join ProLiink Connect</h1>
            <p className="text-sm sm:text-base text-gray-200">Create your account and start your journey with us</p>
          </div>

          <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-scale-in">
            <CardContent className="p-4 sm:p-6 md:p-8">
              {/* General error message */}
              {generalError && (
                <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/50 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{generalError}</p>
                </div>
              )}

              <Tabs 
                value={formData.role.toLowerCase()} 
                onValueChange={(value) => setFormData({ ...formData, role: value.toUpperCase() as "CLIENT" | "PROVIDER" })}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-11 sm:h-12 bg-gray-800">
                  <TabsTrigger value="client" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Client</span>
                  </TabsTrigger>
                  <TabsTrigger value="provider" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Provider</span>
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base text-white">Full Name</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        className={`pl-9 sm:pl-10 h-11 sm:h-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 text-sm sm:text-base ${
                          touched.name && fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-label="Full Name"
                        aria-invalid={touched.name && !!fieldErrors.name}
                        aria-describedby={touched.name && fieldErrors.name ? "name-error" : undefined}
                      />
                    </div>
                    {touched.name && fieldErrors.name && (
                      <p id="name-error" className="text-xs sm:text-sm text-red-400 flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base text-white">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        className={`pl-9 sm:pl-10 h-11 sm:h-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 text-sm sm:text-base ${
                          touched.email && fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-label="Email Address"
                        aria-invalid={touched.email && !!fieldErrors.email}
                        aria-describedby={touched.email && fieldErrors.email ? "email-error" : undefined}
                      />
                    </div>
                    {touched.email && fieldErrors.email && (
                      <p id="email-error" className="text-xs sm:text-sm text-red-400 flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="phone" className="text-sm sm:text-base text-white">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      onBlur={() => handleBlur("phone")}
                      className={`h-11 sm:h-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 text-sm sm:text-base ${
                        touched.phone && fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      aria-label="Phone Number"
                      aria-invalid={touched.phone && !!fieldErrors.phone}
                      aria-describedby={touched.phone && fieldErrors.phone ? "phone-error" : undefined}
                    />
                    {touched.phone && fieldErrors.phone && (
                      <p id="phone-error" className="text-xs sm:text-sm text-red-400 flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="password" className="text-sm sm:text-base text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleFieldChange("password", e.target.value)}
                        onBlur={() => handleBlur("password")}
                        className={`pl-9 sm:pl-10 pr-11 sm:pr-12 h-11 sm:h-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 text-sm sm:text-base ${
                          touched.password && fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-label="Password"
                        aria-invalid={touched.password && !!fieldErrors.password}
                        aria-describedby={touched.password && fieldErrors.password ? "password-error" : undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 sm:px-4 py-2 hover:bg-transparent text-gray-400 hover:text-white focus:outline-none min-w-[44px] touch-manipulation"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {touched.password && fieldErrors.password && (
                      <p id="password-error" className="text-xs sm:text-sm text-red-400 flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                    {/* Password Requirements Helper */}
                    {touched.password && formData.password && !fieldErrors.password && (
                      <div className="p-3 rounded-md bg-blue-500/10 border border-blue-400/20 mt-2">
                        <p className="text-xs font-medium text-blue-300 mb-1.5">Password Requirements</p>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li className={`flex items-center space-x-1.5 ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                            <CheckCircle className={`w-3 h-3 ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-500'}`} />
                            <span>At least 8 characters long</span>
                          </li>
                          <li className={`flex items-center space-x-1.5 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                            <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`} />
                            <span>Contains uppercase letter</span>
                          </li>
                          <li className={`flex items-center space-x-1.5 ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                            <CheckCircle className={`w-3 h-3 ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`} />
                            <span>Contains lowercase letter</span>
                          </li>
                          <li className={`flex items-center space-x-1.5 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                            <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`} />
                            <span>Contains at least one number</span>
                          </li>
                          <li className={`flex items-center space-x-1.5 ${/[^a-zA-Z0-9]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                            <CheckCircle className={`w-3 h-3 ${/[^a-zA-Z0-9]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`} />
                            <span>Contains at least one special character</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm sm:text-base text-white">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                        onBlur={() => handleBlur("confirmPassword")}
                        className={`pl-9 sm:pl-10 pr-11 sm:pr-12 h-11 sm:h-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 text-sm sm:text-base ${
                          touched.confirmPassword && fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-label="Confirm Password"
                        aria-invalid={touched.confirmPassword && !!fieldErrors.confirmPassword}
                        aria-describedby={touched.confirmPassword && fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 sm:px-4 py-2 hover:bg-transparent text-gray-400 hover:text-white focus:outline-none min-w-[44px] touch-manipulation"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {touched.confirmPassword && fieldErrors.confirmPassword && (
                      <p id="confirmPassword-error" className="text-xs sm:text-sm text-red-400 flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                    {touched.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && !fieldErrors.confirmPassword && (
                      <p className="text-xs sm:text-sm text-green-400 flex items-center space-x-1 mt-1">
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        <span>Passwords match</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base font-medium touch-manipulation"
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

                  <Separator className="bg-gradient-to-r from-blue-500 to-blue-600 h-0.5" />

                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-300">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
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
