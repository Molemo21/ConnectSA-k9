"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MobileActionCardProps {
  title: string
  description?: string
  icon: LucideIcon
  iconColor?: "blue" | "green" | "orange" | "purple" | "red" | "emerald"
  primaryAction?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "destructive"
    loading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  className?: string
  children?: React.ReactNode
}

const iconColorVariants = {
  blue: {
    bg: "bg-blue-100",
    icon: "text-blue-600"
  },
  green: {
    bg: "bg-green-100",
    icon: "text-green-600"
  },
  orange: {
    bg: "bg-orange-100",
    icon: "text-orange-600"
  },
  purple: {
    bg: "bg-purple-100",
    icon: "text-purple-600"
  },
  red: {
    bg: "bg-red-100",
    icon: "text-red-600"
  },
  emerald: {
    bg: "bg-emerald-100",
    icon: "text-emerald-600"
  }
}

export function MobileActionCard({
  title,
  description,
  icon: Icon,
  iconColor = "blue",
  primaryAction,
  secondaryAction,
  badge,
  className,
  children
}: MobileActionCardProps) {
  const colors = iconColorVariants[iconColor]

  return (
    <Card className={cn(
      "shadow-sm border-0 bg-white/80 backdrop-blur-sm",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              colors.bg
            )}>
              <Icon className={cn("w-5 h-5", colors.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-gray-900 leading-tight">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="flex-shrink-0">
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {children && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
      
      {(primaryAction || secondaryAction) && (
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                variant={primaryAction.variant || "default"}
                disabled={primaryAction.loading}
                className="w-full sm:w-auto h-11 text-sm font-medium"
              >
                {primaryAction.loading ? "Loading..." : primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                className="w-full sm:w-auto h-11 text-sm font-medium"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
