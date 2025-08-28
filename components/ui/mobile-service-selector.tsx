"use client"

import { useState, useMemo } from 'react'
import { Search, Filter, X, CheckCircle, Plus, Minus } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  category: string
  description?: string
}

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(services.map(s => s.category))]
    return ['all', ...cats]
  }, [services])

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [services, searchTerm, selectedCategory])

  // Group services by category for better organization
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {}
    filteredServices.forEach(service => {
      if (!grouped[service.category]) {
        grouped[service.category] = []
      }
      grouped[service.category].push(service)
    })
    return grouped
  }, [filteredServices])

  const handleServiceToggle = (serviceId: string) => {
    if (disabled) return
    
    if (selectedServices.includes(serviceId)) {
      onServiceToggle(serviceId)
    } else if (selectedServices.length < maxSelections) {
      onServiceToggle(serviceId)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
  }

  const hasActiveFilters = searchTerm || selectedCategory !== 'all'

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Header */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
            disabled={disabled}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
            disabled={disabled}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {searchTerm ? '1' : '0'}
                {selectedCategory !== 'all' ? '+1' : ''}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Category Filter */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  disabled={disabled}
                  className="text-xs"
                >
                  {category === 'all' ? 'All Categories' : category}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selection Counter */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {selectedServices.length} of {maxSelections} services selected
        </span>
        {selectedServices.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedServices.forEach(id => onServiceToggle(id))}
            className="text-red-600 hover:text-red-700"
            disabled={disabled}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category} className="space-y-3">
            {categories.length > 2 && (
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {category === 'all' ? 'All Services' : category}
              </h3>
            )}
            
            <div className="grid gap-3">
              {categoryServices.map(service => {
                const isSelected = selectedServices.includes(service.id)
                const isDisabled = disabled || (!isSelected && selectedServices.length >= maxSelections)
                
                return (
                  <div
                    key={service.id}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                      "touch-manipulation", // Optimize for touch
                      isSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : isDisabled
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Selection Indicator */}
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      )}>
                        {isSelected ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-xs text-gray-400">+</span>
                        )}
                      </div>

                      {/* Service Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-medium text-gray-900 mb-1",
                          isSelected && "text-blue-900"
                        )}>
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className={cn(
                            "text-sm text-gray-600 line-clamp-2",
                            isSelected && "text-blue-700"
                          )}>
                            {service.description}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button
                        size="sm"
                        variant={isSelected ? "destructive" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleServiceToggle(service.id)
                        }}
                        disabled={isDisabled}
                        className={cn(
                          "flex-shrink-0 w-8 h-8 p-0",
                          isSelected ? "bg-red-500 hover:bg-red-600" : ""
                        )}
                      >
                        {isSelected ? (
                          <Minus className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or category filters
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Selection Limit Warning */}
      {selectedServices.length >= maxSelections && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-yellow-800">!</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Selection limit reached
              </h4>
              <p className="text-sm text-yellow-700">
                You've selected the maximum number of services ({maxSelections}). 
                Remove some services to add new ones.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
