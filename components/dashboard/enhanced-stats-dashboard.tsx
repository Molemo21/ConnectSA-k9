"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  Star, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  BarChart3,
  Target,
  Plus,
  Settings,
  Award,
  Trophy,
  CheckCircle
} from "lucide-react"
import { StatsCharts } from "./stats-charts"

interface StatData {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  details?: {
    label: string
    value: string | number
    trend?: "up" | "down" | "stable"
  }[]
}

interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  period: string
  color: string
  description: string
}

interface EnhancedStatsDashboardProps {
  stats: StatData[]
  bookings: any[]
  totalSpent: number
  averageRating: number
}

export function EnhancedStatsDashboard({ 
  stats, 
  bookings, 
  totalSpent, 
  averageRating 
}: EnhancedStatsDashboardProps) {
  const [showCharts, setShowCharts] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [selectedStat, setSelectedStat] = useState<StatData | null>(null)
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "monthly-bookings",
      title: "Monthly Bookings",
      target: 10,
      current: bookings.filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        const now = new Date()
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear()
      }).length,
      unit: "bookings",
      period: "This Month",
      color: "bg-blue-500",
      description: "Target number of bookings per month"
    },
    {
      id: "completion-rate",
      title: "Completion Rate",
      target: 90,
      current: bookings.length > 0 
        ? Math.round((bookings.filter(b => b.status === "COMPLETED").length / bookings.length) * 100)
        : 0,
      unit: "%",
      period: "Overall",
      color: "bg-green-500",
      description: "Percentage of bookings that are completed successfully"
    },
    {
      id: "avg-rating",
      title: "Average Rating",
      target: 4.5,
      current: averageRating,
      unit: "stars",
      period: "Overall",
      color: "bg-yellow-500",
      description: "Target average rating from service reviews"
    },
    {
      id: "monthly-spending",
      title: "Monthly Spending",
      target: 2000,
      current: totalSpent * 0.3, // Rough estimate for current month
      unit: "R",
      period: "This Month",
      color: "bg-purple-500",
      description: "Target monthly spending on services"
    }
  ])

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "positive":
        return "text-green-600 bg-green-100"
      case "negative":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getGoalProgress = (goal: Goal) => {
    const progress = (goal.current / goal.target) * 100
    return Math.min(progress, 100)
  }

  const getGoalStatus = (goal: Goal) => {
    const progress = getGoalProgress(goal)
    if (progress >= 100) return "completed"
    if (progress >= 75) return "on-track"
    if (progress >= 50) return "needs-attention"
    return "at-risk"
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={() => setSelectedStat(stat)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                          <span>{stat.title}</span>
                        </DialogTitle>
                        <DialogDescription>
                          Detailed breakdown of your {stat.title.toLowerCase()}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {stat.value}
                          </div>
                          <Badge className={getChangeColor(stat.changeType)}>
                            {stat.change}
                          </Badge>
                        </div>
                        
                        {stat.details && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Breakdown</h4>
                            {stat.details.map((detail, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">{detail.label}</span>
                                <div className="flex items-center space-x-2">
                                  {getTrendIcon(detail.trend)}
                                  <span className="font-medium text-gray-900">{detail.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={stat.changeType === "positive" ? "default" : "secondary"}
                      className={`text-xs ${getChangeColor(stat.changeType)}`}
                    >
                      {stat.change}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant={showCharts ? "default" : "outline"}
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{showCharts ? 'Hide' : 'Show'} Analytics</span>
          </Button>
          
          <Button 
            variant={showGoals ? "default" : "outline"}
            onClick={() => setShowGoals(!showGoals)}
            className="flex items-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>{showGoals ? 'Hide' : 'Show'} Goals</span>
          </Button>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Customize Goals
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Customize Your Goals</DialogTitle>
              <DialogDescription>
                Set personal targets to track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <Label htmlFor={goal.id}>{goal.title}</Label>
                  <Input
                    id={goal.id}
                    type="number"
                    value={goal.target}
                    onChange={(e) => {
                      setGoals(prev => prev.map(g => 
                        g.id === goal.id ? { ...g, target: parseFloat(e.target.value) || 0 } : g
                      ))
                    }}
                  />
                  <p className="text-xs text-gray-500">{goal.description}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Analytics Dashboard</span>
            </CardTitle>
            <CardDescription>
              Interactive charts and detailed analytics for your booking activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatsCharts 
              bookings={bookings}
              totalSpent={totalSpent}
              averageRating={averageRating}
            />
          </CardContent>
        </Card>
      )}

      {/* Goals Section */}
      {showGoals && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Goal Tracking</span>
            </CardTitle>
            <CardDescription>
              Track your progress towards personal goals and targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {goals.map((goal) => {
                const progress = getGoalProgress(goal)
                const status = getGoalStatus(goal)
                const isCompleted = progress >= 100
                
                return (
                  <Card key={goal.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                        {isCompleted && (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">
                            {goal.current.toFixed(goal.unit === "stars" ? 1 : 0)} / {goal.target.toFixed(goal.unit === "stars" ? 1 : 0)} {goal.unit}
                          </span>
                        </div>
                        
                        <Progress value={progress} className="h-2" />
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={
                              status === "completed" ? "default" :
                              status === "on-track" ? "secondary" :
                              status === "needs-attention" ? "outline" :
                              "destructive"
                            }
                            className="text-xs"
                          >
                            {status === "completed" && "Completed!"}
                            {status === "on-track" && "On Track"}
                            {status === "needs-attention" && "Needs Attention"}
                            {status === "at-risk" && "At Risk"}
                          </Badge>
                          
                          <span className="text-xs text-gray-500">{goal.period}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {/* Achievement Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Achievement Summary</h4>
                  <p className="text-sm text-gray-600">
                    {goals.filter(g => getGoalProgress(g) >= 100).length} of {goals.length} goals completed
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 