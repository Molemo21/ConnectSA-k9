"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, DollarSign } from "lucide-react"
import { Service } from "@/types/services"
import { SERVICES } from "@/config/services"

interface ServicesStepProps {
  data: {
    selectedServices: string[]
    customRates: Record<string, number>
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

  // Filter services to only show cleaning services
  const services = useMemo(() => 
    SERVICES.filter(service => service.category === "CLEANING"),
    []
  )

  // Filter services based on search
  const filteredServices = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return services.filter(service => 
      service.name.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term) ||
      service.features.some(feature => feature.toLowerCase().includes(term))
    )
  }, [services, searchTerm])

  const handleServiceToggle = (serviceId: string) => {
    const newSelectedServices = data.selectedServices.includes(serviceId)
      ? data.selectedServices.filter(id => id !== serviceId)
      : [...data.selectedServices, serviceId]

    onChange({
      ...data,
      selectedServices: newSelectedServices
    })
  }

  const handleRateChange = (serviceId: string, rate: string) => {
    const numericRate = parseFloat(rate) || 0
    onChange({
      ...data,
      customRates: {
        ...data.customRates,
        [serviceId]: numericRate
      }
    })
  }

  const canProceed = data.selectedServices.length > 0 &&
    data.selectedServices.every(serviceId => 
      data.customRates[serviceId] && data.customRates[serviceId] > 0
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Select Your Cleaning Services
        </h2>
        <p className="text-gray-400 mt-1">
          Choose the cleaning services you want to offer and set your rates
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
                type="text"
          placeholder="Search cleaning services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
          </div>

          {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
            {filteredServices.map(service => {
              const isSelected = data.selectedServices.includes(service.id)
          const customRate = data.customRates[service.id] || ""

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
                  {/* Features */}
                  <div className="space-y-2">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary/70" />
                        <span>{feature}</span>
                      </div>
                    ))}
                          </div>

                  {/* Base Price */}
                  <div className="flex items-center text-sm text-gray-300">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>Base price: R{service.basePrice.toFixed(2)}</span>
                      </div>

                  {/* Custom Rate Input */}
                  {isSelected && (
                    <div
                      className="mt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        type="number"
                        placeholder="Your rate (R)"
                        value={customRate}
                        onChange={(e) => handleRateChange(service.id, e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                      {errors[`rates.${service.id}`] && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors[`rates.${service.id}`]}
                        </p>
                      )}
                    </div>
                  )}
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
