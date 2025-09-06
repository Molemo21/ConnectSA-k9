"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface Tab {
  id: string
  label: string
  icon?: LucideIcon
  content: React.ReactNode
  badge?: string
}

interface MobileTabbedSectionProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
  tabClassName?: string
  contentClassName?: string
}

export function MobileTabbedSection({
  tabs,
  defaultTab,
  className,
  tabClassName,
  contentClassName
}: MobileTabbedSectionProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className={cn("w-full", className)}>
      {/* Tab Navigation */}
      <div className={cn(
        "flex overflow-x-auto scrollbar-hide border-b border-gray-200 bg-white",
        "sticky top-0 z-10",
        tabClassName
      )}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
                "border-b-2 transition-colors min-h-[44px]", // Touch target
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  isActive
                    ? "bg-blue-200 text-blue-800"
                    : "bg-gray-200 text-gray-600"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className={cn("p-4 sm:p-6", contentClassName)}>
        {activeTabContent}
      </div>
    </div>
  )
}
