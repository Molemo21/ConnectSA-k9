import { AuthDebug } from '@/components/auth/auth-debug'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication Debug Tool
          </h1>
          <p className="text-gray-600">
            Use this tool to debug authentication issues and cookie problems
          </p>
        </div>
        
        <AuthDebug />
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-red-600">❌ Not Authenticated</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>User needs to log in through the login page</li>
                <li>Check if auth-token cookie exists in browser</li>
                <li>Verify COOKIE_DOMAIN environment variable is correct</li>
                <li>Clear browser cookies and try logging in again</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-yellow-600">⚠️ Partial Authentication</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>User might be logged in but not have PROVIDER role</li>
                <li>Check if user has a provider profile in database</li>
                <li>Verify user role is set to PROVIDER</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-green-600">✅ Fully Authenticated</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>User is properly authenticated</li>
                <li>Should be able to access provider dashboard</li>
                <li>If still getting errors, check API endpoint responses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
