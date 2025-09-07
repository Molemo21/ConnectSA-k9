"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, CreditCard, HelpCircle, Calendar, MessageSquare, DollarSign, Bell, Search
} from "lucide-react"

interface DarkHeaderProps {
  title?: string
  onAddBooking?: () => void
  onMakePayment?: () => void
  onContactSupport?: () => void
  className?: string
}

export function DarkHeader({ 
  title = "Dashboard",
  onAddBooking,
  onMakePayment,
  onContactSupport,
  className = ""
}: DarkHeaderProps) {
  
  const handleAddBooking = () => {
    if (onAddBooking) {
      onAddBooking()
    } else {
      window.location.href = '/book-service'
    }
  }

  const handleMakePayment = () => {
    if (onMakePayment) {
      onMakePayment()
    } else {
      window.location.href = '/payments'
    }
  }

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport()
    } else {
      window.location.href = '/support'
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left side - Dashboard title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
              {title}
            </h1>
            <Badge className="bg-purple-900/50 text-purple-400 border-purple-800/50">
              Live
            </Badge>
          </div>

          {/* Right side - Quick action buttons */}
          <div className="flex items-center space-x-3">
            
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-all duration-200"
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-all duration-200"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full animate-pulse"></span>
            </Button>
            
            {/* Add Booking Button */}
            <Button
              onClick={handleAddBooking}
              className="rounded-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Booking</span>
              <span className="sm:hidden">Book</span>
            </Button>

            {/* Make Payment Button */}
            <Button
              onClick={handleMakePayment}
              className="rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700 px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl border border-gray-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Payment</span>
              <span className="sm:hidden">Pay</span>
            </Button>

            {/* Contact Support Button */}
            <Button
              onClick={handleContactSupport}
              className="rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700 px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl border border-gray-700"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Support</span>
              <span className="sm:hidden">Help</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Compact version for mobile
export function DarkHeaderCompact({ 
  title = "Dashboard",
  onAddBooking,
  onMakePayment,
  onContactSupport,
  className = ""
}: DarkHeaderProps) {
  
  const handleAddBooking = () => {
    if (onAddBooking) {
      onAddBooking()
    } else {
      window.location.href = '/book-service'
    }
  }

  const handleMakePayment = () => {
    if (onMakePayment) {
      onMakePayment()
    } else {
      window.location.href = '/payments'
    }
  }

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport()
    } else {
      window.location.href = '/support'
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Left side - Dashboard title */}
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-100 tracking-tight">
              {title}
            </h1>
          </div>

          {/* Right side - Quick action buttons */}
          <div className="flex items-center space-x-2">
            
            {/* Primary Action - Add Booking */}
            <Button
              onClick={handleAddBooking}
              size="sm"
              className="rounded-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">Book</span>
            </Button>

            {/* Secondary Actions */}
            <Button
              onClick={handleMakePayment}
              size="sm"
              className="rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700 px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 border border-gray-700"
            >
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <Button
              onClick={handleContactSupport}
              size="sm"
              className="rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700 px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 border border-gray-700"
            >
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}