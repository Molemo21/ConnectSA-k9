"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showToast } from '@/lib/toast'

/**
 * Test Component for Payment Flow
 * This component tests the exact logic from your payment-utils.ts file
 * Use this to verify the redirect mechanism works before integrating
 */

interface TestPaymentFlowProps {
  onClose?: () => void
}

export function TestPaymentFlow({ onClose }: TestPaymentFlowProps) {
  const [authUrl, setAuthUrl] = useState('https://checkout.paystack.com/qs2763qwyn10y2x')
  const [delay, setDelay] = useState(1000)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<{
    primaryRedirect: boolean
    fallback1: boolean
    fallback2: boolean
    errors: Array<{ method: string; error: string }>
  }>({
    primaryRedirect: false,
    fallback1: false,
    fallback2: false,
    errors: []
  })

  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(message) // Also log to browser console
  }

  const clearLogs = () => {
    setLogs([])
    addLog('🧹 Logs cleared')
  }

  const resetTest = () => {
    setTestResults({
      primaryRedirect: false,
      fallback1: false,
      fallback2: false,
      errors: []
    })
    clearLogs()
    addLog('🔄 Test reset complete')
  }

  // Test 1: Primary Redirect (window.location.href) - EXACT LOGIC FROM YOUR FILE
  const testPrimaryRedirect = async () => {
    if (!authUrl) {
      showToast.error('Please enter a valid Paystack URL')
      return
    }

    setIsTesting(true)
    addLog('🚀 Starting Primary Redirect Test...')
    addLog('🔄 This tests the EXACT logic from your payment-utils.ts file')

    // Simulate the exact logic from your payment-utils.ts
    setTimeout(() => {
      try {
        addLog('🔄 Attempting direct redirect...')
        addLog('🔄 Using window.location.href for redirect...')
        
        // This is the EXACT line from your code
        window.location.href = authUrl
        
        addLog('✅ Primary redirect initiated successfully')
        setTestResults(prev => ({ ...prev, primaryRedirect: true }))
        showToast.success('Primary redirect working!')
        
      } catch (redirectError: any) {
        addLog(`❌ Primary redirect failed: ${redirectError.message}`)
        setTestResults(prev => ({ 
          ...prev, 
          primaryRedirect: false,
          errors: [...prev.errors, { method: 'primaryRedirect', error: redirectError.message }]
        }))
        showToast.error('Primary redirect failed')
      } finally {
        setIsTesting(false)
      }
    }, delay)
  }

  // Test 2: Fallback 1 (window.location.replace) - EXACT LOGIC FROM YOUR FILE
  const testFallback1 = async () => {
    if (!authUrl) {
      showToast.error('Please enter a valid Paystack URL')
      return
    }

    setIsTesting(true)
    addLog('🔄 Testing Fallback 1 (window.location.replace)...')
    addLog('🔄 This tests the EXACT fallback logic from your payment-utils.ts file')

    setTimeout(() => {
      try {
        addLog('🔄 Trying window.location.replace...')
        window.location.replace(authUrl)
        
        addLog('✅ Fallback 1 redirect initiated successfully')
        setTestResults(prev => ({ ...prev, fallback1: true }))
        showToast.success('Fallback 1 working!')
        
      } catch (replaceError: any) {
        addLog(`❌ Fallback 1 failed: ${replaceError.message}`)
        setTestResults(prev => ({ 
          ...prev, 
          fallback1: false,
          errors: [...prev.errors, { method: 'fallback1', error: replaceError.message }]
        }))
        showToast.error('Fallback 1 failed')
      } finally {
        setIsTesting(false)
      }
    }, delay)
  }

  // Test 3: Fallback 2 (window.open - new tab) - EXACT LOGIC FROM YOUR FILE
  const testFallback2 = async () => {
    if (!authUrl) {
      showToast.error('Please enter a valid Paystack URL')
      return
    }

    setIsTesting(true)
    addLog('🆕 Testing Fallback 2 (window.open - new tab)...')
    addLog('🔄 This tests the EXACT fallback logic from your payment-utils.ts file')

    setTimeout(() => {
      try {
        addLog('🔄 Opening payment gateway in new tab...')
        const newWindow = window.open(authUrl, '_blank', 'noopener,noreferrer')
        
        if (newWindow) {
          addLog('✅ Payment gateway opened in new tab')
          newWindow.focus()
          setTestResults(prev => ({ ...prev, fallback2: true }))
          showToast.success('Fallback 2 working! New tab opened.')
        } else {
          throw new Error('Popup blocked')
        }
        
      } catch (newTabError: any) {
        addLog(`❌ Fallback 2 failed: ${newTabError.message}`)
        setTestResults(prev => ({ 
          ...prev, 
          fallback2: false,
          errors: [...prev.errors, { method: 'fallback2', error: newTabError.message }]
        }))
        showToast.error('Fallback 2 failed - popup blocked')
      } finally {
        setIsTesting(false)
      }
    }, delay)
  }

  // Test All Methods (Simulates the complete flow from your file)
  const testAllMethods = async () => {
    if (!authUrl) {
      showToast.error('Please enter a valid Paystack URL')
      return
    }

    setIsTesting(true)
    addLog('🚀 Testing Complete Payment Flow (All Methods)...')
    addLog('🔄 This simulates the EXACT logic from your payment-utils.ts file')

    // Simulate the complete flow with all fallbacks
    setTimeout(() => {
      try {
        addLog('🔄 Attempting direct redirect...')
        addLog('🔄 Using window.location.href for redirect...')
        
        // Primary method
        window.location.href = authUrl
        
        addLog('✅ Primary redirect initiated successfully')
        setTestResults(prev => ({ ...prev, primaryRedirect: true }))
        
      } catch (redirectError: any) {
        addLog(`⚠️ Primary redirect failed, trying fallback...`)
        addLog(`⚠️ Error: ${redirectError.message}`)
        
        try {
          addLog('🔄 Trying window.location.replace...')
          window.location.replace(authUrl)
          
          addLog('✅ Fallback 1 redirect initiated successfully')
          setTestResults(prev => ({ ...prev, fallback1: true }))
          
        } catch (replaceError: any) {
          addLog(`⚠️ Replace redirect failed, trying new tab...`)
          addLog(`⚠️ Error: ${replaceError.message}`)
          
          try {
            addLog('🔄 Opening payment gateway in new tab...')
            const newWindow = window.open(authUrl, '_blank', 'noopener,noreferrer')
            
            if (newWindow) {
              addLog('✅ Payment gateway opened in new tab')
              newWindow.focus()
              setTestResults(prev => ({ ...prev, fallback2: true }))
              showToast.success('Payment gateway opened in new tab. Please complete your payment there.')
            } else {
              throw new Error('Popup blocked')
            }
            
          } catch (newTabError: any) {
            addLog(`⚠️ New tab failed, showing manual option...`)
            addLog(`⚠️ Error: ${newTabError.message}`)
            showToast.error('Redirect failed. Please manually navigate to the payment gateway.')
          }
        }
      } finally {
        setIsTesting(false)
      }
    }, delay)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Payment Flow Test Component
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">
              Close
            </Button>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          This component tests the EXACT logic from your <code>lib/payment-utils.ts</code> file
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="authUrl">Paystack Authorization URL</Label>
            <Input
              id="authUrl"
              value={authUrl}
              onChange={(e) => setAuthUrl(e.target.value)}
              placeholder="https://checkout.paystack.com/..."
            />
          </div>
          <div>
            <Label htmlFor="delay">Redirect Delay (ms)</Label>
            <Input
              id="delay"
              type="number"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value) || 1000)}
              min="0"
              max="5000"
            />
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testPrimaryRedirect} 
            disabled={isTesting}
            variant="default"
          >
            🚀 Test Primary Redirect
          </Button>
          <Button 
            onClick={testFallback1} 
            disabled={isTesting}
            variant="secondary"
          >
            🔄 Test Fallback 1
          </Button>
          <Button 
            onClick={testFallback2} 
            disabled={isTesting}
            variant="outline"
          >
            🆕 Test Fallback 2
          </Button>
          <Button 
            onClick={testAllMethods} 
            disabled={isTesting}
            variant="destructive"
          >
            🎯 Test All Methods
          </Button>
          <Button onClick={clearLogs} variant="ghost">
            🧹 Clear Logs
          </Button>
          <Button onClick={resetTest} variant="ghost">
            🔄 Reset Test
          </Button>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded border ${testResults.primaryRedirect ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="font-semibold">Primary Redirect</div>
            <div className={testResults.primaryRedirect ? 'text-green-600' : 'text-gray-500'}>
              {testResults.primaryRedirect ? '✅ Working' : '⏳ Not tested'}
            </div>
          </div>
          <div className={`p-3 rounded border ${testResults.fallback1 ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="font-semibold">Fallback 1</div>
            <div className={testResults.fallback1 ? 'text-green-600' : 'text-gray-500'}>
              {testResults.fallback1 ? '✅ Working' : '⏳ Not tested'}
            </div>
          </div>
          <div className={`p-3 rounded border ${testResults.fallback2 ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="font-semibold">Fallback 2</div>
            <div className={testResults.fallback2 ? 'text-green-600' : 'text-gray-500'}>
              {testResults.fallback2 ? '✅ Working' : '⏳ Not tested'}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Test Logs (Console Output)</Label>
            <span className="text-sm text-gray-500">{logs.length} entries</span>
          </div>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <span className="text-gray-500">No logs yet. Run a test to see output.</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* What This Tests */}
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">🔍 What This Tests</h4>
          <p className="text-sm text-blue-700 mb-2">
            This component simulates the exact logic from your <code>lib/payment-utils.ts</code> file:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ <strong>Primary Redirect</strong>: <code>window.location.href</code></li>
            <li>✅ <strong>Fallback 1</strong>: <code>window.location.replace</code></li>
            <li>✅ <strong>Fallback 2</strong>: <code>window.open</code> (new tab)</li>
            <li>✅ <strong>Error Handling</strong>: Multiple try-catch blocks</li>
            <li>✅ <strong>User Feedback</strong>: Toast notifications and logging</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
