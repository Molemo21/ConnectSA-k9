"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowLeft } from "lucide-react"
import { SERVICE_CATEGORIES, MainCategory, ServiceCategory } from "@/config/service-categories"
import { getAllServices, groupServicesByCategory, type ServiceData } from "@/lib/service-utils"

interface ServiceSelectionProps {
  value: string
  onChange: (serviceId: string) => void
  onNext: () => void
}

export function ServiceSelection({ value, onChange, onNext }: ServiceSelectionProps) {
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [services, setServices] = useState<ServiceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadServices() {
      const allServices = await getAllServices()
      setServices(allServices)
      setLoading(false)
    }
    loadServices()
  }, [])

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null)
    } else if (selectedMainCategory) {
      setSelectedMainCategory(null)
    }
  }

  const groupedServices = groupServicesByCategory(services)

  if (loading) {
    return <div>Loading services...</div>
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {(selectedMainCategory || selectedCategory) && (
        <Button
          variant="ghost"
          className="mb-4"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      {/* Main Categories */}
      {!selectedMainCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(SERVICE_CATEGORIES).map(([id, category]) => (
            <CategoryCard
              key={id}
              title={category.name}
              icon={category.icon}
              description={`${Object.keys(category.categories).length} service categories`}
              onClick={() => setSelectedMainCategory(id as MainCategory)}
            />
          ))}
        </div>
      )}

      {/* Service Categories */}
      {selectedMainCategory && !selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(SERVICE_CATEGORIES[selectedMainCategory].categories).map(([id, category]) => (
            <CategoryCard
              key={id}
              title={category.name}
              icon={category.icon}
              description={`${category.services.length} services available`}
              onClick={() => setSelectedCategory(id as ServiceCategory)}
            />
          ))}
        </div>
      )}

      {/* Services */}
      {selectedMainCategory && selectedCategory && groupedServices[selectedMainCategory]?.[selectedCategory] && (
        <div className="space-y-4">
          {groupedServices[selectedMainCategory][selectedCategory].map((service) => (
            <ServiceCard
              key={service.id || `${service.name}-${service.basePrice}`}
              service={service}
              selected={value === service.id}
              onClick={() => {
                onChange(service.id || `${service.name}-${service.basePrice}`)
                onNext()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryCard({ title, icon, description, onClick }: {
  title: string
  icon: string
  description: string
  onClick: () => void
}) {
  return (
    <Card 
      className="hover:border-primary cursor-pointer transition-all"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function ServiceCard({ service, selected, onClick }: {
  service: ServiceData
  selected: boolean
  onClick: () => void
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        selected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{service.name}</CardTitle>
            <CardDescription>{service.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="font-medium">R{service.basePrice}</div>
            <div className="text-sm text-muted-foreground">
              {service.duration} mins
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {service.features.slice(0, 3).map(feature => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
          {service.features.length > 3 && (
            <div className="text-sm text-muted-foreground">
              +{service.features.length - 3} more features
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}