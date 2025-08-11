"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugLoginPage() {
  const [email, setEmail] = useState("molemonakin21@gmail.com")
  const [password, setPassword] = useState("")
  const [results, setResults] = useState<any[]>([])

  const addResult = (title: string, data: any) => {
    setResults(prev => [...prev, { title, data, timestamp: new Date().toISOString() }])
  }

  const testLogin = async () => {
    addResult("Starting login test", { email, password: password ? "***" : "empty" })
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      
      addResult("Login response", {
        status: response.status,
        ok: response.ok,
        data: data
      })

      if (response.ok) {
        addResult("Login successful", { user: data.user })
      } else {
        addResult("Login failed", { error: data.error, message: data.message })
      }
    } catch (error) {
      addResult("Network error", { error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const testAuthMe = async () => {
    addResult("Testing /api/auth/me", {})
    
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()
      
      addResult("Auth me response", {
        status: response.status,
        ok: response.ok,
        data: data
      })
    } catch (error) {
      addResult("Auth me error", { error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const testTestLogin = async () => {
    addResult("Testing /api/test-login", { email, password: password ? "***" : "empty" })
    
    try {
      const response = await fetch("/api/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      
      addResult("Test login response", {
        status: response.status,
        ok: response.ok,
        data: data
      })
    } catch (error) {
      addResult("Test login error", { error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Login Debug Page</h1>
          <p className="text-gray-600">Use this page to debug login issues</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div className="flex space-x-4">
              <Button onClick={testLogin}>Test Login</Button>
              <Button onClick={testAuthMe} variant="outline">Test Auth Me</Button>
              <Button onClick={testTestLogin} variant="outline">Test Login (Simple)</Button>
              <Button onClick={clearResults} variant="destructive">Clear Results</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-4 bg-white">
                  <h3 className="font-semibold text-blue-600">{result.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{result.timestamp}</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
              {results.length === 0 && (
                <p className="text-gray-500">No test results yet. Run a test above.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 