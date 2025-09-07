"use client"

import { Button } from "@/components/ui/button"
import { 
  Plus, CreditCard, HelpCircle, Calendar, MessageSquare, DollarSign
} from "lucide-react"

interface DashboardHeaderProps {
  title?: string
  onAddBooking?: () => void
  onMakePayment?: () => void
  onContactSupport?: () => void
  className?: string
}

export function DashboardHeader({ 
  title = "Dashboard",
  onAddBooking,
  onMakePayment,
  onContactSupport,
  className = ""
}: DashboardHeaderProps) {
  
  const handleAddBooking = () => {
    if (onAddBooking) {
      onAddBooking()
    } else {
      // Default action - navigate to booking page
      window.location.href = '/book-service'
    }
  }

  const handleMakePayment = () => {
    if (onMakePayment) {
      onMakePayment()
    } else {
      // Default action - navigate to payments page
      window.location.href = '/payments'
    }
  }

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport()
    } else {
      // Default action - navigate to support page
      window.location.href = '/support'
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left side - Dashboard title */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
          </div>

          {/* Right side - Quick action buttons */}
          <div className="flex items-center space-x-3">
            
            {/* Add Booking Button */}
            <Button
              onClick={handleAddBooking}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Booking</span>
              <span className="sm:hidden">Book</span>
            </Button>

            {/* Make Payment Button */}
            <Button
              onClick={handleMakePayment}
              className="rounded-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Make Payment</span>
              <span className="sm:hidden">Pay</span>
            </Button>

            {/* Contact Support Button */}
            <Button
              onClick={handleContactSupport}
              className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Contact Support</span>
              <span className="sm:hidden">Help</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Alternative version with different styling
export function DashboardHeaderAlt({ 
  title = "Dashboard",
  onAddBooking,
  onMakePayment,
  onContactSupport,
  className = ""
}: DashboardHeaderProps) {
  
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
    <header className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left side - Dashboard title */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {title}
            </h1>
          </div>

          {/* Right side - Quick action buttons */}
          <div className="flex items-center space-x-3">
            
            {/* Add Booking Button */}
            <Button
              onClick={handleAddBooking}
              className="rounded-full bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Booking</span>
              <span className="sm:hidden">Book</span>
            </Button>

            {/* Make Payment Button */}
            <Button
              onClick={handleMakePayment}
              className="rounded-full bg-white text-green-600 hover:bg-gray-100 px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Make Payment</span>
              <span className="sm:hidden">Pay</span>
            </Button>

            {/* Contact Support Button */}
            <Button
              onClick={handleContactSupport}
              className="rounded-full bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Contact Support</span>
              <span className="sm:hidden">Help</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Compact version for mobile-first design
export function DashboardHeaderCompact({ 
  title = "Dashboard",
  onAddBooking,
  onMakePayment,
  onContactSupport,
  className = ""
}: DashboardHeaderProps) {
  
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
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Left side - Dashboard title */}
          <div className="flex items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
          </div>

          {/* Right side - Quick action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Add Booking Button */}
            <Button
              onClick={handleAddBooking}
              size="sm"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Book</span>
              <span className="xs:hidden">+</span>
            </Button>

            {/* Make Payment Button */}
            <Button
              onClick={handleMakePayment}
              size="sm"
              className="rounded-full bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Pay</span>
              <span className="xs:hidden">$</span>
            </Button>

            {/* Contact Support Button */}
            <Button
              onClick={handleContactSupport}
              size="sm"
              className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Help</span>
              <span className="xs:hidden">?</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}