"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Star, DollarSign, TrendingUp, TrendingDown, Eye, BarChart3 } from "lucide-react"

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

interface EnhancedStatsProps {
  stats: StatData[]
}

export function EnhancedStats({ stats }: EnhancedStatsProps) {
  const [selectedStat, setSelectedStat] = useState<StatData | null>(null)

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
  )
} 