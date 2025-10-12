"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrency } from "@/contexts/currency-context"

interface Region {
  id: string
  name: string
  flag: string
  currency: string
  currencyCode: string
}

const regions: Region[] = [
  {
    id: "za",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "South African Rand",
    currencyCode: "ZAR"
  }
]

interface RegionSwitcherProps {
  onRegionChange?: (region: Region) => void
  className?: string
}

export function RegionSwitcher({ onRegionChange, className = "" }: RegionSwitcherProps) {
  const { selectedRegion, setSelectedRegion } = useCurrency()

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region)
    onRegionChange?.(region)
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white border-0 focus:ring-2 focus:ring-white/20"
          >
            <span className="text-lg">{selectedRegion.flag}</span>
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white border-0 shadow-lg rounded-xl p-2"
        >
          {regions.map((region) => (
            <DropdownMenuItem
              key={region.id}
              onClick={() => handleRegionSelect(region)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-gray-50 focus:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{region.flag}</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-gray-900 text-sm">
                  {region.name}
                </span>
                <span className="text-xs text-gray-500">
                  {region.currencyCode}
                </span>
              </div>
              {selectedRegion.id === region.id && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}