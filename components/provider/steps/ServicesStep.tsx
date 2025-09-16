"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft, Search, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  category: string
  description?: string
}

interface ServicesStepProps {
  data: {
    selectedServices: string[]
  }
  onChange: (data: { selectedServices: string[] }) => void
  onNext: () => void
  onBack?: () => void
  errors?: { selectedServices?: string }
  isSubmitting?: boolean
}

export function ServicesStep({ 
  data, 
  onChange, 
  onNext, 
  onBack, 
  errors = {}, 
  isSubmitting = false 
}: ServicesStepProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/services')
        if (response.ok) {
          const services = await response.json()
          setAvailableServices(services)
        }
      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const categories = Array.from(new Set(availableServices.map(s => s.category))).sort()

  const filteredServices = availableServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleService = (serviceId: string) => {
    const isSelected = data.selectedServices.includes(serviceId)
    if (isSelected) {
      onChange({ selectedServices: data.selectedServices.filter(id => id !== serviceId) })
    } else {
      onChange({ selectedServices: [...data.selectedServices, serviceId] })
    }
  }

  const isFormValid = () => {
    return data.selectedServices.length > 0
  }

  const handleNext = () => {
    if (isFormValid()) {
      onNext()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading services...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6 shadow-lg shadow-purple-500/25">
          <Search className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
          Select your services
        </h2>
        <p className="text-white text-lg max-w-2xl mx-auto drop-shadow-lg font-medium">
          Choose the services you offer to help clients find you. You can select multiple services.
        </p>
      </div>

      <Card className="border-0 shadow-2xl bg-black/20 backdrop-blur-md border-white/30">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            Available Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Search and Filter */}
          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-purple-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-black/30 border border-white/30 text-white placeholder:text-white/70 focus:bg-black/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={`text-sm px-4 py-2 rounded-full transition-all duration-300 ${
                  selectedCategory === "all" 
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25" 
                    : "bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40"
                }`}
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`text-sm px-4 py-2 rounded-full transition-all duration-300 ${
                    selectedCategory === category 
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25" 
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredServices.map(service => {
              const isSelected = data.selectedServices.includes(service.id)
              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "p-6 border rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 group",
                    isSelected 
                      ? "border-purple-400 bg-gradient-to-br from-purple-500/30 to-pink-500/30 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/25" 
                      : "border-white/30 bg-black/20 hover:border-white/50 hover:bg-black/30"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-white text-lg drop-shadow-lg">{service.name}</h3>
                        {isSelected && (
                          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <Badge 
                        className={`text-xs px-3 py-1 rounded-full mb-3 ${
                          isSelected 
                            ? "bg-white/30 text-white border-white/40" 
                            : "bg-black/30 text-white/90 border-white/30"
                        }`}
                      >
                        {service.category}
                      </Badge>
                      {service.description && (
                        <p className="text-sm text-white/90 line-clamp-2 group-hover:text-white transition-colors duration-300 drop-shadow-md">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse"></div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No services found matching your search.</p>
            </div>
          )}

          {/* Selected Services Summary */}
          {data.selectedServices.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Selected Services ({data.selectedServices.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.selectedServices.map(serviceId => {
                  const service = availableServices.find(s => s.id === serviceId)
                  return service ? (
                    <Badge key={serviceId} variant="default" className="text-xs">
                      {service.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}

          {errors.selectedServices && (
            <p className="text-sm text-red-600">{errors.selectedServices}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        {onBack && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack} 
            className="flex-1 h-12 sm:h-11 order-2 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={!isFormValid() || isSubmitting}
          className="flex-1 h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 order-1 sm:order-2"
        >
          <div className="flex items-center space-x-2">
            <span>Next: Documents</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Button>
      </div>
    </div>
  )
}
