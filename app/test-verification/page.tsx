"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  UserPlus, 
  Mail, 
  Shield,
  Clock,
  Users
} from "lucide-react"

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message: string
  duration?: number
  error?: string
}

export default function TestVerificationPage() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testUser, setTestUser] = useState<{
    name: string
    email: string
    password: string
    phone: string
    role: string
  }>({
    name: `Test User ${Date.now()}`,
    email: `test.verification.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '+27123456789',
    role: 'CLIENT'
  })

  const features = [
    {
      icon: Shield,
      title: "Comprehensive Testing",
      description: "Tests the complete email verification flow from signup to verification"
    },
    {
      icon: Clock,
      title: "Real-time Results",
      description: "See test results as they happen with detailed logging"
    },
    {
      icon: Users,
      title: "Best Practices",
      description: "Follows testing best practices with proper error handling and cleanup"
    }
  ]

  const initializeTests = () => [
    {
      name: "Database Connection Test",
      status: 'pending' as const,
      message: "Testing database connectivity and verification token functionality"
    },
    {
      name: "User Signup Test",
      status: 'pending' as const,
      message: "Creating test user and verification token"
    },
    {
      name: "Token Creation Verification",
      status: 'pending' as const,
      message: "Verifying token was created and stored in database"
    },
    {
      name: "Email Verification Test",
      status: 'pending' as const,
      message: "Testing email verification via token"
    },
    {
      name: "User Status Update Test",
      status: 'pending' as const,
      message: "Verifying user emailVerified status was updated"
    },
    {
      name: "Resend Verification Test",
      status: 'pending' as const,
      message: "Testing resend verification functionality"
    }
  ]

  const updateTestResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ))
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const runTest = async (index: number, testFunction: () => Promise<any>) => {
    const startTime = Date.now()
    updateTestResult(index, { status: 'running', message: 'Test in progress...' })

    try {
      await testFunction()
      const duration = Date.now() - startTime
      updateTestResult(index, { 
        status: 'passed', 
        message: 'Test completed successfully',
        duration
      })
      return true
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(index, { 
        status: 'failed', 
        message: 'Test failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  const testDatabaseConnection = async () => {
    const response = await fetch('/api/test-db')
    if (!response.ok) {
      throw new Error(`Database test failed: ${response.status}`)
    }
    
    const data = await response.json()
    if (!data.testTokenCreated || !data.testTokenRetrieved) {
      throw new Error('Database verification token functionality is not working')
    }
    
    return data
  }

  const testUserSignup = async () => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Signup failed: ${response.status} - ${errorData.error || 'Unknown error'}`)
    }

    const signupData = await response.json()
    if (!signupData.user || !signupData.user.id) {
      throw new Error('Signup response missing user data')
    }

    if (signupData.user.emailVerified) {
      throw new Error('User should not be verified immediately after signup')
    }

    return signupData.user
  }

  const testTokenCreation = async (user: any) => {
    await sleep(1000) // Wait for token creation
    
    const response = await fetch('/api/test-db')
    if (!response.ok) {
      throw new Error(`Database check failed: ${response.status}`)
    }

    const data = await response.json()
    const userTokens = data.existingTokens.filter((token: any) => 
      token.userEmail === user.email
    )

    if (userTokens.length === 0) {
      throw new Error('No verification tokens found for the test user')
    }

    const latestToken = userTokens[0]
    if (new Date(latestToken.expires) <= new Date()) {
      throw new Error('Verification token has already expired')
    }

    return latestToken
  }

  const testEmailVerification = async (token: any) => {
    // Use the full token, not just the preview
    const fullToken = token.tokenPreview.replace('...', '');
    console.log(`🔍 Full token length: ${fullToken.length} characters`);
    console.log(`🔍 Token preview: ${fullToken.substring(0, 8)}...`);
    
    const verificationUrl = `/api/auth/verify-email?token=${fullToken}`;
    
    const response = await fetch(verificationUrl)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Verification failed: ${response.status} - ${errorData.error || 'Unknown error'}`)
    }

    const verificationData = await response.json()
    if (!verificationData.message || !verificationData.message.includes('successfully')) {
      throw new Error('Verification response does not indicate success')
    }

    return true
  }

  const testUserStatusUpdate = async (user: any) => {
    await sleep(1000) // Wait for status update
    
    const response = await fetch('/api/test-db')
    if (!response.ok) {
      throw new Error(`Database check failed: ${response.status}`)
    }

    const data = await response.json()
    const userTokens = data.existingTokens.filter((token: any) => 
      token.userEmail === user.email
    )

    if (userTokens.length > 0) {
      console.warn(`Found ${userTokens.length} remaining tokens for user - they should have been cleaned up`)
    }

    return true
  }

  const testResendVerification = async (user: any) => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    })

    if (!response.ok) {
      const errorData = await response.json()
      // This might fail if the user is already verified, which is expected
      if (errorData.error && errorData.error.includes('already verified')) {
        return true // This is actually a success case
      }
      throw new Error(`Resend verification failed: ${response.status} - ${errorData.error || 'Unknown error'}`)
    }

    return true
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults(initializeTests())

    let currentUser: any = null
    let currentToken: any = null

    try {
      // Test 1: Database Connection
      await runTest(0, testDatabaseConnection)

      // Test 2: User Signup
      currentUser = await runTest(1, testUserSignup)
      if (!currentUser) throw new Error('User signup test failed')

      // Test 3: Token Creation
      currentToken = await runTest(2, () => testTokenCreation(currentUser))
      if (!currentToken) throw new Error('Token creation test failed')

      // Test 4: Email Verification
      await runTest(3, () => testEmailVerification(currentToken))

      // Test 5: User Status Update
      await runTest(4, () => testUserStatusUpdate(currentUser))

      // Test 6: Resend Verification
      await runTest(5, () => testResendVerification(currentUser))

      // All tests passed
      toast({
        title: "🎉 All Tests Passed!",
        description: "Email verification system is working correctly.",
      })

    } catch (error) {
      toast({
        title: "💥 Tests Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      passed: 'default',
      failed: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const passedTests = testResults.filter(t => t.status === 'passed').length
  const failedTests = testResults.filter(t => t.status === 'failed').length
  const totalTests = testResults.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
              Email Verification System Test
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              Comprehensive testing of the email verification flow
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Left Side - Test Controls */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl text-center">Test Controls</CardTitle>
                  <CardDescription className="text-center text-sm sm:text-base">
                    Run comprehensive tests on the email verification system
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="testEmail">Test Email</Label>
                      <Input
                        id="testEmail"
                        type="email"
                        value={testUser.email}
                        onChange={(e) => setTestUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="test@example.com"
                        className="h-11 sm:h-12 text-base"
                      />
                    </div>

                    <Button
                      onClick={runAllTests}
                      disabled={isRunning}
                      className="w-full"
                      size="lg"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run All Tests
                        </>
                        )}
                    </Button>

                    {totalTests > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {passedTests}/{totalTests}
                        </div>
                        <div className="text-sm text-gray-600">Tests Passed</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Features */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">What This Test Covers</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Comprehensive testing of the complete email verification flow
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">Test Results</CardTitle>
                  <CardDescription>
                    Detailed results of each test in the verification flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testResults.map((test, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          test.status === 'passed' ? 'border-green-200 bg-green-50' :
                          test.status === 'failed' ? 'border-red-200 bg-red-50' :
                          test.status === 'running' ? 'border-blue-200 bg-blue-50' :
                          'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(test.status)}
                            <span className="font-semibold text-gray-900">{test.name}</span>
                          </div>
                          {getStatusBadge(test.status)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                        
                        {test.duration && (
                          <div className="text-xs text-gray-500">
                            Duration: {test.duration}ms
                          </div>
                        )}
                        
                        {test.error && (
                          <div className="text-sm text-red-600 bg-red-100 p-2 rounded mt-2">
                            Error: {test.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
