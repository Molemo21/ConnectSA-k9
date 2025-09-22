"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, CreditCard, HelpCircle, DollarSign, Plus, MessageSquare
} from "lucide-react"

export function ExampleDashboardCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Card 1: Upcoming Bookings */}
      <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Booking Item 1 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">House Cleaning</p>
                  <p className="text-xs text-gray-500">Tomorrow, 10:00 AM</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">Confirmed</Badge>
            </div>
            
            {/* Booking Item 2 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Plumbing Repair</p>
                  <p className="text-xs text-gray-500">Jan 25, 2:00 PM</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-800 text-xs">Pending</Badge>
            </div>
            
            {/* Booking Item 3 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Garden Maintenance</p>
                  <p className="text-xs text-gray-500">Jan 28, 9:00 AM</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">Scheduled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Payments */}
      <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-600" />
            Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center mb-6">
            <div className="mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Account Balance</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">R2,450.00</div>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">+R350 this month</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Payments</span>
              <span className="font-medium text-orange-600">R125.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed This Month</span>
              <span className="font-medium text-green-600">R1,890.00</span>
            </div>
          </div>
          
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </CardContent>
      </Card>

      {/* Card 3: Support */}
      <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
            Support
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our support team is here to assist you with any questions or issues you may have.
            </p>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Open Tickets</span>
              <Badge className="bg-red-100 text-red-800 text-xs">2</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="font-medium text-gray-900">&lt; 2 hours</span>
            </div>
          </div>
          
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Open Ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual card components for more flexibility
export function UpcomingBookingsCard() {
  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Upcoming Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Booking Item 1 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">House Cleaning</p>
                <p className="text-xs text-gray-500">Tomorrow, 10:00 AM</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 text-xs">Confirmed</Badge>
          </div>
          
          {/* Booking Item 2 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Plumbing Repair</p>
                <p className="text-xs text-gray-500">Jan 25, 2:00 PM</p>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-800 text-xs">Pending</Badge>
          </div>
          
          {/* Booking Item 3 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Garden Maintenance</p>
                <p className="text-xs text-gray-500">Jan 28, 9:00 AM</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">Scheduled</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PaymentsCard() {
  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-green-600" />
          Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Account Balance</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">R2,450.00</div>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">+R350 this month</span>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pending Payments</span>
            <span className="font-medium text-orange-600">R125.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Completed This Month</span>
            <span className="font-medium text-green-600">R1,890.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Credit</span>
            <span className="font-medium text-blue-600">R500.00</span>
          </div>
        </div>
        
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
          <DollarSign className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

export function SupportCard() {
  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
          Support
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-purple-200 transition-colors">
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Our support team is here to assist you with any questions or issues you may have.
          </p>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Open Tickets</span>
            <Badge className="bg-red-100 text-red-800 text-xs">2</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Resolved This Month</span>
            <Badge className="bg-green-100 text-green-800 text-xs">8</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Avg Response Time</span>
            <span className="font-medium text-gray-900">&lt; 2 hours</span>
          </div>
        </div>
        
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Open Ticket
        </Button>
      </CardContent>
    </Card>
  )
}