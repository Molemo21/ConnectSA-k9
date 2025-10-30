"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, Banknote, Loader2 } from "lucide-react"
import { Service } from "@/types/services"

interface ServicesStepProps {
  data: {
    selectedServices: string[]
  }
  onChange: (data: any) => void
  onNext: () => void
  onBack: () => void
  errors?: Record<string, string>
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
  const [searchTerm, setSearchTerm] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [servicesError, setServicesError] = useState<string | null>(null)

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true)
        setServicesError(null)
        
        const response = await fetch('/api/services')
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`)
        }
        
        const servicesData = await response.json()
        setServices(servicesData)
      } catch (error) {
        console.error('Error fetching services:', error)
        setServicesError(error instanceof Error ? error.message : 'Failed to fetch services')
      } finally {
        setIsLoadingServices(false)
      }
    }

    fetchServices()
  }, [])

  // Filter services based on search
  const filteredServices = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return services.filter(service => 
      service.name.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term) ||
      (service.categoryName && service.categoryName.toLowerCase().includes(term)) ||
      (service.features && service.features.some(feature => feature.toLowerCase().includes(term)))
    )
  }, [services, searchTerm])

  const handleServiceToggle = (serviceId: string) => {
    const isCurrentlySelected = data.selectedServices.includes(serviceId)
    const newSelectedServices = isCurrentlySelected
      ? data.selectedServices.filter(id => id !== serviceId)
      : [...data.selectedServices, serviceId]

    onChange({
      ...data,
      selectedServices: newSelectedServices
    })
  }


  const canProceed = data.selectedServices.length > 0

  // Show loading state
  if (isLoadingServices) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Select Your Services</h2>
          <p className="text-gray-400">Loading available services...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Show error state
  if (servicesError) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Select Your Services</h2>
          <p className="text-red-400">Error loading services: {servicesError}</p>
        </div>
        <div className="text-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Select Your Services
        </h2>
        <p className="text-gray-400 mt-1">
          Choose the services you want to offer. You'll set your rates when creating your catalogue.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Found {services.length} services ({filteredServices.length} matching your search)
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
                type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
          </div>

          {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
            {filteredServices.map(service => {
              const isSelected = data.selectedServices.includes(service.id)

              return (
            <Card
                  key={service.id}
              className={`group cursor-pointer transition-all duration-300 ${
                    isSelected 
                  ? "bg-primary/10 border-primary"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
              onClick={() => handleServiceToggle(service.id)}
            >
              <CardHeader>
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
                <div className="space-y-4">
                  {/* Features - Show category info if features not available */}
                  <div className="space-y-2">
                    {service.features && service.features.length > 0 ? (
                      service.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 mr-2 text-primary/70" />
                          <span>{feature}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center text-sm text-gray-300">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary/70" />
                        <span>{service.categoryName || 'Professional Service'}</span>
                      </div>
                    )}
                          </div>

                  {/* Base Price */}
                  <div className="flex items-center text-sm text-gray-300">
                    <Banknote className="h-4 w-4 mr-1" />
                    <span>Base price: R{(service.basePrice || 0).toFixed(2)}</span>
                      </div>

                </div>
              </CardContent>
            </Card>
              )
            })}
          </div>

      {/* No Results */}
          {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No services found matching "{searchTerm}"
          </p>
            </div>
          )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={onBack} 
          disabled={isSubmitting}
          className="border-white/20 text-white hover:bg-white/10"
          >
            Back
          </Button>
        <Button 
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? "Saving..." : "Next"}
        </Button>
      </div>
    </div>
  )
}

