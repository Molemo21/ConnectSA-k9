"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MobileStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: "blue" | "green" | "orange" | "purple" | "red" | "emerald"
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  className?: string
  onClick?: () => void
}

const colorVariants = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    icon: "text-blue-600"
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    icon: "text-green-600"
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    icon: "text-orange-600"
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    icon: "text-purple-600"
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    icon: "text-red-600"
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    icon: "text-emerald-600"
  }
}

export function MobileStatsCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  change,
  changeType = "neutral",
  className,
  onClick
}: MobileStatsCardProps) {
  const colors = colorVariants[color]

  return (
    <Card 
      className={cn(
        "shadow-sm border-0 bg-white/80 backdrop-blur-sm transition-all duration-200",
        "hover:shadow-md active:scale-95",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-600 mb-1 truncate">
              {title}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {value}
            </p>
            {change && (
              <div className="mt-1">
                <Badge 
                  variant={changeType === "positive" ? "default" : "secondary"}
                  className={cn(
                    "text-xs px-2 py-0.5",
                    changeType === "positive" && "bg-green-100 text-green-800",
                    changeType === "negative" && "bg-red-100 text-red-800",
                    changeType === "neutral" && "bg-gray-100 text-gray-800"
                  )}
                >
                  {change}
                </Badge>
              </div>
            )}
          </div>
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            colors.bg
          )}>
            <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
