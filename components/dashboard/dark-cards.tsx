"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, CreditCard, HelpCircle, DollarSign, Plus, MessageSquare,
  Clock, CheckCircle, AlertCircle, TrendingUp, ArrowUpRight
} from "lucide-react"

export function DarkExampleCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Card 1: Upcoming Bookings */}
      <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-400" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Booking Item 1 */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-gray-100">House Cleaning</p>
                  <p className="text-xs text-gray-400">Tomorrow, 10:00 AM</p>
                </div>
              </div>
              <Badge className="bg-purple-900/50 text-purple-400 border-purple-800/50 text-xs">Confirmed</Badge>
            </div>
            
            {/* Booking Item 2 */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-100">Plumbing Repair</p>
                  <p className="text-xs text-gray-400">Jan 25, 2:00 PM</p>
                </div>
              </div>
              <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-800/50 text-xs">Pending</Badge>
            </div>
            
            {/* Booking Item 3 */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-100">Garden Maintenance</p>
                  <p className="text-xs text-gray-400">Jan 28, 9:00 AM</p>
                </div>
              </div>
              <Badge className="bg-green-900/50 text-green-400 border-green-800/50 text-xs">Scheduled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Payments */}
      <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-400" />
            Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center mb-6">
            <div className="mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Account Balance</span>
            </div>
            <div className="text-3xl font-bold text-gray-100 mb-1">R2,450.00</div>
            <div className="flex items-center justify-center space-x-1">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-sm text-green-400">+R350 this month</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending Payments</span>
              <span className="font-medium text-yellow-400">R125.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Completed This Month</span>
              <span className="font-medium text-green-400">R1,890.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Available Credit</span>
              <span className="font-medium text-purple-400">R500.00</span>
            </div>
          </div>
          
          <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105">
            <DollarSign className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </CardContent>
      </Card>

      {/* Card 3: Support */}
      <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2 text-blue-400" />
            Support
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-gray-750 transition-all duration-200">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Our support team is here to assist you with any questions or issues you may have.
            </p>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Open Tickets</span>
              <Badge className="bg-red-900/50 text-red-400 border-red-800/50 text-xs">2</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Resolved This Month</span>
              <Badge className="bg-green-900/50 text-green-400 border-green-800/50 text-xs">8</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Avg Response Time</span>
              <span className="font-medium text-gray-100">< 2 hours</span>
            </div>
          </div>
          
          <Button className="w-full bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200 hover:scale-105 border border-gray-700">
            <Plus className="w-4 h-4 mr-2" />
            Open Ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual dark theme cards
export function DarkUpcomingBookingsCard() {
  return (
    <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-400" />
          Upcoming Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Enhanced booking items with more details */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100 group-hover:text-purple-400 transition-colors">House Cleaning</p>
                <p className="text-xs text-gray-400">Tomorrow, 10:00 AM • Sarah Johnson</p>
                <p className="text-xs text-purple-400">R450.00</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge className="bg-purple-900/50 text-purple-400 border-purple-800/50 text-xs">Confirmed</Badge>
              <span className="text-xs text-gray-400">2 hours</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100 group-hover:text-yellow-400 transition-colors">Plumbing Repair</p>
                <p className="text-xs text-gray-400">Jan 25, 2:00 PM • Mike Chen</p>
                <p className="text-xs text-yellow-400">R320.00</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-800/50 text-xs">Pending</Badge>
              <span className="text-xs text-gray-400">3 days</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100 group-hover:text-green-400 transition-colors">Garden Maintenance</p>
                <p className="text-xs text-gray-400">Jan 28, 9:00 AM • Emma Wilson</p>
                <p className="text-xs text-green-400">R280.00</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge className="bg-green-900/50 text-green-400 border-green-800/50 text-xs">Scheduled</Badge>
              <span className="text-xs text-gray-400">6 days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DarkPaymentsCard() {
  return (
    <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-green-400" />
          Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <div className="mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Account Balance</span>
          </div>
          <div className="text-3xl font-bold text-gray-100 mb-1">R2,450.00</div>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">+R350 this month</span>
          </div>
        </div>
        
        {/* Payment breakdown with progress bars */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Pending Payments</span>
              <span className="font-medium text-yellow-400">R125.00</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Completed This Month</span>
              <span className="font-medium text-green-400">R1,890.00</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
        
        <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105">
          <DollarSign className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

export function DarkSupportCard() {
  return (
    <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2 text-blue-400" />
          Support Center
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-gray-750 transition-all duration-200 group">
            <MessageSquare className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Need Assistance?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Our dedicated support team is available 24/7 to help you with any questions or technical issues.
          </p>
        </div>
        
        {/* Support stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-red-400">2</div>
            <div className="text-xs text-gray-400">Open Tickets</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-green-400">8</div>
            <div className="text-xs text-gray-400">Resolved</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-400">Avg Response Time</span>
          <Badge className="bg-blue-900/50 text-blue-400 border-blue-800/50">< 2 hours</Badge>
        </div>
        
        <Button className="w-full bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200 hover:scale-105 border border-gray-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Support Ticket
        </Button>
      </CardContent>
    </Card>
  )
}