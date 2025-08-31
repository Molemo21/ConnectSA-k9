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
import { Bell, Settings, LogOut, User, CreditCard, HelpCircle, Menu, X } from "lucide-react"
import type { AuthUser } from "@/lib/auth"

interface DashboardHeaderProps {
  user: AuthUser
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  const navigationItems = user.role === "CLIENT" ? [
    { href: "/dashboard", label: "Dashboard", icon: User },
    { href: "/bookings", label: "My Bookings", icon: CreditCard },
    { href: "/services", label: "Browse Services", icon: HelpCircle },
  ] : user.role === "PROVIDER" ? [
    { href: "/provider/dashboard", label: "Dashboard", icon: User },
    { href: "/provider/bookings", label: "My Jobs", icon: CreditCard },
    { href: "/provider/profile", icon: Settings },
  ] : user.role === "ADMIN" ? [
    { href: "/admin", label: "Admin Panel", icon: Settings },
    { href: "/admin/providers", label: "Providers", icon: User },
    { href: "/admin/bookings", label: "All Bookings", icon: CreditCard },
  ] : []

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Mobile Optimized */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">S</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">ServiceHub SA</span>
            <span className="text-base font-bold text-gray-900 sm:hidden">ServiceHub</span>
          </Link>

          {/* Navigation - Desktop Only */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navigationItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="text-gray-600 hover:text-primary transition-colors text-sm lg:text-base font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-2 h-9 lg:h-10">
                  <Avatar className="w-7 h-7 lg:w-8 lg:h-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-primary text-white text-sm lg:text-base">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
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
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
            {/* Mobile Navigation Items */}
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4 text-gray-500" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile User Info */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center space-x-3 px-3 py-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <Badge className={`text-xs ${roleDisplay.color} mt-1`}>{roleDisplay.label}</Badge>
                </div>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start px-3 py-2 h-10">
                <Bell className="w-4 h-4 mr-3" />
                Notifications
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start px-3 py-2 h-10">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start px-3 py-2 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                disabled={isLoggingOut}
              >
                <LogOut className="w-4 h-4 mr-3" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
