"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CheckCircle, 
  Play, 
  DollarSign, 
  TrendingUp, 
  Star
} from "lucide-react"

interface ProviderStats {
  pendingJobs: number
  confirmedJobs: number
  pendingExecutionJobs: number
  inProgressJobs: number
  completedJobs: number
  totalEarnings: number
  thisMonthEarnings: number
  averageRating: number
  totalReviews: number
}

interface ProviderStatsCardsProps {
  stats: ProviderStats
}

export function ProviderStatsCards({ stats }: ProviderStatsCardsProps) {
  const jobStats = [
    {
      title: "Pending Jobs",
      value: stats.pendingJobs,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "New",
      changeType: "neutral"
    },
    {
      title: "Confirmed Jobs",
      value: stats.confirmedJobs,
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "Ready",
      changeType: "positive"
    },
    {
      title: "Pending Execution",
      value: stats.pendingExecutionJobs,
      icon: Play,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "Start",
      changeType: "positive"
    },
    {
      title: "In Progress",
      value: stats.inProgressJobs,
      icon: Play,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "Active",
      changeType: "neutral"
    },
    {
      title: "Completed",
      value: stats.completedJobs,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "Done",
      changeType: "positive"
    }
  ]

  const earningsStats = [
    {
      title: "Total Earnings",
      value: `R${stats.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "+15%",
      changeType: "positive"
    },
    {
      title: "This Month",
      value: `R${stats.thisMonthEarnings.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+25%",
      changeType: "positive"
    },
    {
      title: "Average Rating",
      value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/5` : "No ratings",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: `${stats.totalReviews} reviews`,
      changeType: "neutral"
    }
  ]

  return (
    <>
      {/* Job Status Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {jobStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <Badge 
                        variant={stat.changeType === "positive" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto sm:mx-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Earnings & Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {earningsStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <Badge 
                        variant={stat.changeType === "positive" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto sm:mx-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
} 