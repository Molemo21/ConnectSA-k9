"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Check if token is present
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">ServiceHub SA</span>
            </Link>
          </div>
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Invalid Reset Link
            </h3>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or missing. Please request a new password reset.
            </p>
            <div className="space-y-3">
              <Link 
                href="/forgot-password"
                className="inline-block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Request New Reset Link
              </Link>
              <Link 
                href="/login"
                className="inline-block w-full bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Client-side validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSubmitted(true)
        console.log("Success:", data.message)
      } else {
        setError(data.error || "Something went wrong. Please try again.")
        console.error("Error:", data.error)
      }
    } catch (error) {
      const errorMessage = "Network error. Please check your connection and try again."
      setError(errorMessage)
      console.error("Network error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h1>
          <p className="text-green-700 mb-6">
            Your password has been reset successfully.
          </p>
          <Link 
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In with New Password
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">ServiceHub SA</span>
          </Link>
        </div>
        
        <div className="bg-white shadow-xl rounded-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your new password below.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters long
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !password.trim() || !confirmPassword.trim()} 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
            
            <div className="text-center pt-4 space-y-2">
              <Link 
                href="/forgot-password"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                Need a new reset link?
              </Link>
              <Link 
                href="/login"
                className="block text-sm text-gray-600 hover:text-gray-800"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading reset password page...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
} 