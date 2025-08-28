"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CreditCard, ExternalLink } from "lucide-react"
import { showToast } from "@/lib/toast"

export default function PaymentDebugPage() {
  const [testBookingId, setTestBookingId] = useState("cmeqtz5fn0001s7a891fmo36w")
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const testPaymentRedirect = async () => {
    setIsTesting(true)
    setTestResults(null)
    
    try {
      console.log('🧪 Testing payment redirect for booking:', testBookingId)
      
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
        message: 'Payment initialized successfully'
      })

      showToast.success('Payment initialized! Testing redirect...')
      
      // Test the redirect
      console.log('🧪 Testing redirect to:', data.authorizationUrl)
      
      // Method 1: Direct redirect
      try {
        window.location.href = data.authorizationUrl
      } catch (error) {
        console.error('🧪 Direct redirect failed:', error)
        
        // Method 2: New tab
        const newWindow = window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer')
        if (newWindow) {
          newWindow.focus()
          showToast.success('Payment gateway opened in new tab')
        } else {
          showToast.error('Popup blocked. Please copy the URL manually.')
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🧪 Payment test error:', error)
      
      setTestResults({
        success: false,
        error: errorMessage
      })
      
      showToast.error(`Payment test failed: ${errorMessage}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Debug & Testing
            </CardTitle>
            <CardDescription>
              Test payment flow and redirect functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Test Payment Redirect */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Payment Redirect</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bookingId">Test Booking ID</Label>
                  <Input
                    id="bookingId"
                    value={testBookingId}
                    onChange={(e) => setTestBookingId(e.target.value)}
                    placeholder="Enter booking ID to test"
                  />
                </div>
                
                <div className="flex items-end">
              <Button 
                    onClick={testPaymentRedirect}
                    disabled={isTesting || !testBookingId}
                    className="w-full"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Test Payment Redirect
                      </>
                    )}
              </Button>
                </div>
              </div>

              {/* Test Results */}
              {testResults && (
                <div className={`p-4 rounded-lg border ${
                  testResults.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className="font-medium mb-2">
                    {testResults.success ? '✅ Test Successful' : '❌ Test Failed'}
                  </h4>
                  
                  {testResults.success ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-700">{testResults.message}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Payment URL:</span>
                        <a
                          href={testResults.authorizationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {testResults.authorizationUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-700">{testResults.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Webhook Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Webhook Endpoint</h3>
              
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/webhooks/paystack');
                    const data = await response.json();
                    console.log('Webhook test response:', data);
                    showToast.success('Webhook endpoint test completed. Check console for details.');
                  } catch (error) {
                    console.error('Webhook test error:', error);
                    showToast.error('Webhook test failed');
                  }
                }}
                variant="outline"
                className="w-full"
              >
                Test Webhook Endpoint
              </Button>
            </div>
            
            {/* Payment Status Recovery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Status Recovery</h3>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Use this to recover payments stuck in PENDING status due to webhook failures.
                </p>
                
                <Button
                  onClick={async () => {
                    try {
                      // Get current bookings to find pending payments
                      const response = await fetch('/api/bookings/my-bookings');
                      const data = await response.json();
                      
                      if (!response.ok) {
                        throw new Error('Failed to fetch bookings');
                      }
                      
                      const pendingPayments = data.bookings?.filter((b: any) => 
                        b.payment && b.payment.status === 'PENDING'
                      ) || [];
                      
                      if (pendingPayments.length === 0) {
                        showToast.info('No pending payments found');
                        return;
                      }
                      
                      showToast.info(`Found ${pendingPayments.length} pending payment(s). Attempting recovery...`);
                      
                      // Attempt recovery for each pending payment
                      for (const booking of pendingPayments) {
                        try {
                          const recoveryResponse = await fetch('/api/payment/recover-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paymentId: booking.payment.id })
                          });
                          
                          const result = await recoveryResponse.json();
                          
                          if (result.success) {
                            console.log(`✅ Payment recovery successful for booking ${booking.id}:`, result);
                            showToast.success(`Payment recovered for booking ${booking.id}`);
                          } else {
                            console.error(`❌ Payment recovery failed for booking ${booking.id}:`, result);
                            showToast.error(`Payment recovery failed for booking ${booking.id}: ${result.message}`);
                          }
                        } catch (error) {
                          console.error(`❌ Payment recovery error for booking ${booking.id}:`, error);
                          showToast.error(`Payment recovery error for booking ${booking.id}`);
                        }
                      }
                      
                    } catch (error) {
                      console.error('Payment recovery error:', error);
                      showToast.error('Payment recovery failed');
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Recover Stuck Payments
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      // Test the API endpoint directly with a sample payment ID
                      showToast.info('Testing recover-status API endpoint directly...');
                      
                      const testResponse = await fetch('/api/payment/recover-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentId: 'test-payment-id' })
                      });
                      
                      console.log('🧪 Direct API test response:', {
                        status: testResponse.status,
                        statusText: testResponse.statusText,
                        headers: Object.fromEntries(testResponse.headers.entries())
                      });
                      
                      const testResult = await testResponse.json();
                      console.log('🧪 Direct API test result:', testResult);
                      
                      if (testResponse.ok) {
                        showToast.success('API endpoint is working (expected error for invalid payment ID)');
                      } else {
                        showToast.info(`API endpoint responded with expected error: ${testResult.error || testResult.message}`);
                      }
                      
                    } catch (error) {
                      console.error('Direct API test error:', error);
                      showToast.error('Direct API test failed');
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Test API Endpoint Directly
                </Button>
                  </div>
                </div>

        {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How to Test</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Enter a valid booking ID above</li>
                <li>Click "Test Payment Redirect"</li>
                <li>Check if the payment gateway opens</li>
                <li>Complete a test payment on Paystack</li>
                <li>Return to dashboard to see status updates</li>
                <li>Use "Test Webhook Endpoint" to debug webhook issues</li>
                <li>Use "Recover Stuck Payments" if payments get stuck in PENDING status</li>
            </ol>
            
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h5 className="font-medium text-yellow-800 mb-1">Payment Status Recovery</h5>
                <p className="text-xs text-yellow-700">
                  If payments get stuck in PENDING status due to webhook failures, use the "Recover Stuck Payments" 
                  button to manually verify with Paystack and update the status to ESCROW.
              </p>
            </div>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
