"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, DollarSign, X } from "lucide-react"
import { Service } from "@/types/services"

interface MobileServiceSelectorProps {
  services: Service[]
  selectedServices: string[]
  onServiceToggle: (serviceId: string) => void
  maxSelections?: number
  className?: string
  disabled?: boolean
}

export function MobileServiceSelector({
  services,
  selectedServices,
  onServiceToggle,
  maxSelections = 10,
  className,
  disabled = false
}: MobileServiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter services based on search
  const filteredServices = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(term) ||
        service.description?.toLowerCase().includes(term) ||
        service.features.some(feature => feature.toLowerCase().includes(term))
      return matchesSearch
    })
  }, [services, searchTerm])

  const handleServiceToggle = (serviceId: string) => {
    if (disabled) return
    
    if (selectedServices.includes(serviceId)) {
      onServiceToggle(serviceId)
    } else if (selectedServices.length < maxSelections) {
      onServiceToggle(serviceId)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search cleaning services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map(service => {
          const isSelected = selectedServices.includes(service.id)

          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-300 ${
                isSelected
                  ? "bg-primary/10 border-primary"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleServiceToggle(service.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-white group-hover:text-primary transition-colors">
                    {service.name}
                  </span>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Features */}
                  <div className="space-y-2">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary/70" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {service.features.length > 3 && (
                      <p className="text-sm text-gray-400 pl-6">
                        +{service.features.length - 3} more features
                      </p>
                    )}
                  </div>

                  {/* Base Price */}
                  <div className="flex items-center text-sm text-gray-300">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>From R{service.basePrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* No Results */}
        {filteredServices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No services found matching "{searchTerm}"
            </p>
            <Button
              variant="ghost"
              onClick={clearSearch}
              className="mt-2 text-primary hover:text-primary/90"
            >
              Clear Search
            </Button>
          </div>
        )}

        {/* Selection Limit Warning */}
        {!disabled && selectedServices.length >= maxSelections && (
          <p className="text-amber-400 text-sm text-center mt-4">
            Maximum {maxSelections} services can be selected
          </p>
        )}
      </div>
    </div>
  )
}