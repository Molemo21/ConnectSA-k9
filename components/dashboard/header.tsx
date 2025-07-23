"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Bell, Settings, LogOut, User, CreditCard, HelpCircle, Menu } from "lucide-react"
import type { AuthUser } from "@/lib/auth"

interface DashboardHeaderProps {
  user: AuthUser
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been signed out of your account.",
        })
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "CLIENT":
        return { label: "Client", color: "bg-blue-100 text-blue-800" }
      case "PROVIDER":
        return { label: "Provider", color: "bg-green-100 text-green-800" }
      case "ADMIN":
        return { label: "Admin", color: "bg-purple-100 text-purple-800" }
      default:
        return { label: role, color: "bg-gray-100 text-gray-800" }
    }
  }

  const roleDisplay = getRoleDisplay(user.role)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ProLiink Connect</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            {user.role === "CLIENT" && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/bookings" className="text-gray-600 hover:text-primary transition-colors">
                  My Bookings
                </Link>
                <Link href="/services" className="text-gray-600 hover:text-primary transition-colors">
                  Browse Services
                </Link>
              </>
            )}
            {user.role === "PROVIDER" && (
              <>
                <Link href="/provider/dashboard" className="text-gray-600 hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/provider/bookings" className="text-gray-600 hover:text-primary transition-colors">
                  My Jobs
                </Link>
                <Link href="/provider/profile" className="text-gray-600 hover:text-primary transition-colors">
                  Profile
                </Link>
              </>
            )}
            {user.role === "ADMIN" && (
              <>
                <Link href="/admin" className="text-gray-600 hover:text-primary transition-colors">
                  Admin Panel
                </Link>
                <Link href="/admin/providers" className="text-gray-600 hover:text-primary transition-colors">
                  Providers
                </Link>
                <Link href="/admin/bookings" className="text-gray-600 hover:text-primary transition-colors">
                  All Bookings
                </Link>
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-primary text-white">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <Badge className={`text-xs ${roleDisplay.color}`}>{roleDisplay.label}</Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help" className="flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
