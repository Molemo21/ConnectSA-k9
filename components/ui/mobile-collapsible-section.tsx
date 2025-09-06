"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react"

interface MobileCollapsibleSectionProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: "blue" | "green" | "orange" | "purple" | "red" | "emerald"
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  badge?: string
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

export function MobileCollapsibleSection({
  title,
  description,
  icon: Icon,
  iconColor = "blue",
  defaultOpen = false,
  children,
  className,
  headerClassName,
  contentClassName,
  badge
}: MobileCollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const colors = iconColorVariants[iconColor]

  return (
    <Card className={cn(
      "shadow-sm border-0 bg-white/80 backdrop-blur-sm overflow-hidden",
      className
    )}>
      <CardHeader 
        className={cn(
          "cursor-pointer hover:bg-gray-50 transition-colors",
          headerClassName
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {Icon && (
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                colors.bg
              )}>
                <Icon className={cn("w-5 h-5", colors.icon)} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-gray-900 leading-tight truncate">
                  {title}
                </h3>
                {badge && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
          >
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className={cn("pt-0", contentClassName)}>
          {children}
        </CardContent>
      )}
    </Card>
  )
}
