"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CreditCard, ExternalLink, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { showToast } from "@/lib/toast"

export default function PaymentFlowTestPage() {
  const [testBookingId, setTestBookingId] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Test payment initialization and redirect
  const testPaymentFlow = async () => {
    if (!testBookingId.trim()) {
      showToast.error("Please enter a valid booking ID")
      return
    }

    setIsTesting(true)
    setTestResults(null)
    setCurrentStatus(null)
    
    try {
      console.log('🧪 Testing payment flow for booking:', testBookingId)
      
      // Step 1: Initialize payment
      const response = await fetch(`/api/book-service/${testBookingId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callbackUrl: `${window.location.origin}/dashboard?payment=success&booking=${testBookingId}`
        }),
      })

      const data = await response.json()
      console.log('🧪 Payment API response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed')
      }

      if (!data.authorizationUrl) {
        throw new Error('No authorization URL received')
      }

      setTestResults({
        success: true,
        authorizationUrl: data.authorizationUrl,
        payment: data.payment,
        message: 'Payment initialized successfully'
      })

      showToast.success('Payment initialized! Testing redirect...')
      
      // Step 2: Test redirect methods
      console.log('🧪 Testing redirect to:', data.authorizationUrl)
      
      // Method 1: Try window.location.replace
      try {
        console.log('🧪 Method 1: Testing window.location.replace...')
        // Don't actually redirect, just test if it would work
        const testUrl = new URL(data.authorizationUrl)
        console.log('✅ URL is valid:', testUrl.toString())
        
        showToast.success('Redirect test successful! Opening payment gateway in new tab...')
        
        // Open in new tab for testing
        const newWindow = window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer')
        if (newWindow) {
          newWindow.focus()
          showToast.success('Payment gateway opened in new tab. Please complete payment there.')
          
          // Start polling for status updates
          startStatusPolling(testBookingId)
        } else {
          showToast.error('Failed to open payment gateway. Popup may be blocked.')
        }
        
      } catch (error) {
        console.error('❌ Redirect test failed:', error)
        showToast.error('Redirect test failed. Please check the console for details.')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      console.error('❌ Payment test error:', error)
      
      setTestResults({
        success: false,
        error: errorMessage
      })
      
      showToast.error(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  // Start polling for payment status updates
  const startStatusPolling = (bookingId: string) => {
    setIsPolling(true)
    console.log('🔄 Starting status polling for booking:', bookingId)
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling for payment status update...')
        
        const response = await fetch(`/api/book-service/${bookingId}/status`)
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Current status:', data)
          setCurrentStatus(data)
          
          if (data.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED'].includes(data.payment.status)) {
            console.log('✅ Payment completed!')
            showToast.success(`Payment completed! Status: ${data.payment.status}`)
            clearInterval(pollInterval)
            setIsPolling(false)
          } else if (data.payment && data.payment.status === 'FAILED') {
            console.log('❌ Payment failed!')
            showToast.error('Payment failed!')
            clearInterval(pollInterval)
            setIsPolling(false)
          }
        } else {
          console.error('❌ Failed to get status:', response.status)
        }
      } catch (error) {
        console.error('❌ Status polling error:', error)
      }
    }, 3000) // Check every 3 seconds
    
    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setIsPolling(false)
      console.log('⏰ Status polling stopped after timeout')
    }, 300000)
  }

  // Manual status check
  const checkStatus = async () => {
    if (!testBookingId.trim()) {
      showToast.error("Please enter a valid booking ID")
      return
    }
    
    try {
      const response = await fetch(`/api/book-service/${testBookingId}/status`)
      if (response.ok) {
        const data = await response.json()
        setCurrentStatus(data)
        showToast.success('Status updated!')
      } else {
        showToast.error('Failed to get status')
      }
    } catch (error) {
      showToast.error('Status check failed')
    }
  }

  // Test webhook endpoint
  const testWebhookEndpoint = async () => {
    try {
      const response = await fetch('/api/webhooks/paystack')
      if (response.ok) {
        const data = await response.json()
        console.log('🔗 Webhook endpoint test:', data)
        showToast.success('Webhook endpoint is working!')
      } else {
        showToast.error('Webhook endpoint test failed')
      }
    } catch (error) {
      showToast.error('Webhook endpoint test failed')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">🧪 Payment Flow Test</h1>
        <p className="text-muted-foreground mt-2">
          Test and debug payment initialization, redirect, and status updates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Flow Test
            </CardTitle>
            <CardDescription>
              Test payment initialization and redirect functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookingId">Test Booking ID</Label>
              <Input
                id="bookingId"
                placeholder="Enter a valid booking ID"
                value={testBookingId}
                onChange={(e) => setTestBookingId(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={testPaymentFlow} 
              disabled={isTesting || !testBookingId.trim()}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Payment Flow...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Test Payment Flow
                </>
              )}
            </Button>

            {testResults && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Test Results:</h4>
                {testResults.success ? (
                  <div className="space-y-2">
                    <p className="text-green-600">✅ {testResults.message}</p>
                    <div className="text-sm">
                      <p><strong>Payment ID:</strong> {testResults.payment?.id}</p>
                      <p><strong>Amount:</strong> R{testResults.payment?.amount}</p>
                      <p><strong>Status:</strong> {testResults.payment?.status}</p>
                    </div>
                    {testResults.authorizationUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(testResults.authorizationUrl, '_blank')}
                        className="w-full mt-2"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Payment Gateway
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">❌ {testResults.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Monitoring Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Status Monitoring
            </CardTitle>
            <CardDescription>
              Monitor payment and booking status in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkStatus} 
              disabled={!testBookingId.trim()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Current Status
            </Button>

            {isPolling && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Polling for status updates...</span>
              </div>
            )}

            {currentStatus && (
              <div className="mt-4 p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold">Current Status:</h4>
                
                {/* Booking Status */}
                <div className="flex items-center gap-2">
                  {currentStatus.booking?.status === 'CONFIRMED' && <Clock className="h-4 w-4 text-yellow-500" />}
                  {currentStatus.booking?.status === 'PENDING_EXECUTION' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {currentStatus.booking?.status === 'CANCELLED' && <XCircle className="h-4 w-4 text-red-500" />}
                  <span><strong>Booking:</strong> {currentStatus.booking?.status}</span>
                </div>

                {/* Payment Status */}
                {currentStatus.payment && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {currentStatus.payment.status === 'PENDING' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {currentStatus.payment.status === 'ESCROW' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {currentStatus.payment.status === 'FAILED' && <XCircle className="h-4 w-4 text-red-500" />}
                      <span><strong>Payment:</strong> {currentStatus.payment.status}</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      <p>Amount: R{currentStatus.payment.amount}</p>
                      <p>Reference: {currentStatus.payment.paystackRef}</p>
                      {currentStatus.payment.paidAt && (
                        <p>Paid: {new Date(currentStatus.payment.paidAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Webhook Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Webhook Endpoint Test</CardTitle>
          <CardDescription>
            Test if the webhook endpoint is accessible and working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testWebhookEndpoint} variant="outline">
            Test Webhook Endpoint
          </Button>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>🐛 Debug Information</CardTitle>
          <CardDescription>
            Useful information for debugging payment issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Current URL:</h4>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Origin:</h4>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Expected Callback URL:</h4>
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {typeof window !== 'undefined' ? `${window.location.origin}/dashboard?payment=success&booking=${testBookingId || 'BOOKING_ID'}` : 'Loading...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
