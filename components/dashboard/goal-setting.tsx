"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Target, 
  Plus, 
  Edit, 
  Trophy, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Star,
  Award
} from "lucide-react"

interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  period: string
  color: string
  description: string
  category: "bookings" | "spending" | "rating" | "completion"
}

interface GoalSettingProps {
  bookings: any[]
  totalSpent: number
  averageRating: number
}

export function GoalSetting({ bookings, totalSpent, averageRating }: GoalSettingProps) {
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
      description: "Target number of bookings per month",
      category: "bookings"
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
      description: "Percentage of bookings that are completed successfully",
      category: "completion"
    },
    {
      id: "avg-rating",
      title: "Average Rating",
      target: 4.5,
      current: averageRating,
      unit: "stars",
      period: "Overall",
      color: "bg-yellow-500",
      description: "Target average rating from service reviews",
      category: "rating"
    },
    {
      id: "monthly-spending",
      title: "Monthly Spending",
      target: 2000,
      current: totalSpent * 0.3, // Rough estimate for current month
      unit: "R",
      period: "This Month",
      color: "bg-purple-500",
      description: "Target monthly spending on services",
      category: "spending"
    }
  ])

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showAddGoal, setShowAddGoal] = useState(false)

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "on-track":
        return "bg-blue-100 text-blue-800"
      case "needs-attention":
        return "bg-yellow-100 text-yellow-800"
      case "at-risk":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Trophy className="w-4 h-4" />
      case "on-track":
        return <TrendingUp className="w-4 h-4" />
      case "needs-attention":
        return <Target className="w-4 h-4" />
      case "at-risk":
        return <Award className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  const handleUpdateGoal = (goalId: string, newTarget: number) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, target: newTarget } : goal
    ))
    setEditingGoal(null)
  }

  const addNewGoal = (newGoal: Omit<Goal, 'id' | 'current'>) => {
    const goal: Goal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      current: 0
    }
    setGoals(prev => [...prev, goal])
    setShowAddGoal(false)
  }

  const completedGoals = goals.filter(g => getGoalProgress(g) >= 100).length
  const totalGoals = goals.length

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Goal Tracking</span>
            </CardTitle>
            <CardDescription>
              Set and track personal targets for your booking activity
            </CardDescription>
          </div>
          <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Goal</DialogTitle>
                <DialogDescription>
                  Create a new personal target to track
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input id="goal-title" placeholder="e.g., Weekly Bookings" />
                </div>
                <div>
                  <Label htmlFor="goal-target">Target Value</Label>
                  <Input id="goal-target" type="number" placeholder="10" />
                </div>
                <div>
                  <Label htmlFor="goal-unit">Unit</Label>
                  <Input id="goal-unit" placeholder="bookings, %, stars, R" />
                </div>
                <div>
                  <Label htmlFor="goal-period">Period</Label>
                  <Input id="goal-period" placeholder="This Week, This Month, Overall" />
                </div>
                <div>
                  <Label htmlFor="goal-description">Description</Label>
                  <Input id="goal-description" placeholder="What you want to achieve" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Add goal logic here
                  setShowAddGoal(false)
                }}>
                  Add Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Progress Summary</h4>
                <p className="text-sm text-gray-600">
                  {completedGoals} of {totalGoals} goals completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((completedGoals / totalGoals) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
          </div>
          <Progress value={(completedGoals / totalGoals) * 100} className="mt-3" />
        </div>

        {/* Goals Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = getGoalProgress(goal)
            const status = getGoalStatus(goal)
            const isCompleted = progress >= 100
            
            return (
              <Card key={goal.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
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
                      <Badge className={`text-xs ${getStatusColor(status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(status)}
                          <span>
                            {status === "completed" && "Completed!"}
                            {status === "on-track" && "On Track"}
                            {status === "needs-attention" && "Needs Attention"}
                            {status === "at-risk" && "At Risk"}
                          </span>
                        </div>
                      </Badge>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingGoal(goal)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Goal</DialogTitle>
                            <DialogDescription>
                              Update your target for {goal.title}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-target">New Target</Label>
                              <Input 
                                id="edit-target" 
                                type="number" 
                                defaultValue={goal.target}
                                placeholder={goal.target.toString()}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setEditingGoal(null)}>
                              Cancel
                            </Button>
                            <Button onClick={() => {
                              const input = document.getElementById('edit-target') as HTMLInputElement
                              const newTarget = parseFloat(input.value) || goal.target
                              handleUpdateGoal(goal.id, newTarget)
                            }}>
                              Update Goal
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {goals.filter(g => getGoalStatus(g) === "completed").length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {goals.filter(g => getGoalStatus(g) === "on-track").length}
            </div>
            <div className="text-sm text-gray-600">On Track</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {goals.filter(g => getGoalStatus(g) === "needs-attention").length}
            </div>
            <div className="text-sm text-gray-600">Needs Attention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {goals.filter(g => getGoalStatus(g) === "at-risk").length}
            </div>
            <div className="text-sm text-gray-600">At Risk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 