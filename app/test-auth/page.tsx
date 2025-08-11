"use client"

import { useEffect, useState } from "react"
import { checkAuth } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAuthPage() {
  const [authResult, setAuthResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      const result = await checkAuth()
      setAuthResult(result)
      console.log("Auth test result:", result)
    } catch (error) {
      console.error("Auth test error:", error)
      setAuthResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testAuth} disabled={loading}>
              {loading ? "Testing..." : "Test Auth"}
            </Button>
            
            {authResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(authResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 