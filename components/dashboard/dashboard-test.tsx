"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Calendar, Settings, Bell, Menu } from "lucide-react"

export function DashboardTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test all the problematic classes */}
      <div className="bg-background text-foreground p-4">
        <div className="bg-card text-card-foreground border-border rounded-lg p-4">
          <h1 className="text-2xl font-bold mb-4">Dashboard Test</h1>
          
          {/* Test Avatar */}
          <div className="flex items-center space-x-4 mb-4">
            <Avatar>
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Test User</p>
              <p className="text-sm text-muted-foreground">test@example.com</p>
            </div>
          </div>
          
          {/* Test Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Welcome to your dashboard</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Bookings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manage your bookings</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configure your account</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Test Buttons */}
          <div className="flex space-x-4 mb-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
          </div>
          
          {/* Test Badges */}
          <div className="flex space-x-2 mb-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          
          {/* Test Background Classes */}
          <div className="space-y-2">
            <div className="bg-primary text-primary-foreground p-2 rounded">Primary Background</div>
            <div className="bg-secondary text-secondary-foreground p-2 rounded">Secondary Background</div>
            <div className="bg-muted text-muted-foreground p-2 rounded">Muted Background</div>
            <div className="bg-accent text-accent-foreground p-2 rounded">Accent Background</div>
          </div>
        </div>
      </div>
    </div>
  )
}