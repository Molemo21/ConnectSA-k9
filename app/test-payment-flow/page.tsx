import { TestPaymentFlow } from '@/components/test-payment-flow'

export default function TestPaymentFlowPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔍 Payment Flow Testing Page
        </h1>
        <p className="text-gray-600 max-w-3xl">
          This page tests the exact payment redirect logic from your <code>lib/payment-utils.ts</code> file. 
          Use this to verify that the redirect mechanism works correctly before testing in the main app.
        </p>
      </div>
      
      <TestPaymentFlow />
      
      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 How to Use This Test</h3>
        <ol className="text-sm text-yellow-700 space-y-2 list-decimal list-inside">
          <li><strong>Enter the Paystack URL</strong> from your terminal logs (already pre-filled)</li>
          <li><strong>Click "Test Primary Redirect"</strong> to test the main redirect method</li>
          <li><strong>Watch the logs</strong> to see exactly what happens</li>
          <li><strong>Check browser console</strong> for additional debugging info</li>
          <li><strong>Test fallbacks</strong> if the primary method fails</li>
        </ol>
        
        <div className="mt-4 p-4 bg-white rounded border">
          <h4 className="font-semibold text-gray-800 mb-2">🔗 Current Test URL</h4>
          <p className="text-sm text-gray-600 mb-2">
            This URL is from your recent terminal logs:
          </p>
          <code className="text-xs bg-gray-100 p-2 rounded block break-all">
            https://checkout.paystack.com/qs2763qwyn10y2x
          </code>
        </div>
      </div>
    </div>
  )
}
