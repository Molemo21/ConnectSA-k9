"use client"

import { SERVICE_CATEGORIES, MainCategory, ServiceCategory } from '@/config/service-categories'

export interface ServiceData {
  id?: string
  name: string
  description: string
  basePrice: number
  duration: number
  features: string[]
  mainCategory?: MainCategory
  category?: ServiceCategory
}

export async function getAllServices(): Promise<ServiceData[]> {
  try {
    // Fetch services from the API
    const response = await fetch('/api/services')
    const dbServices = await response.json()

    // Get configured services
    const configuredServices = Object.entries(SERVICE_CATEGORIES).flatMap(
      ([mainCategory, mainCategoryData]) =>
        Object.entries(mainCategoryData.categories).flatMap(
          ([category, categoryData]) =>
            categoryData.services.map(service => ({
              ...service,
              mainCategory: mainCategory as MainCategory,
              category: category as ServiceCategory
            }))
        )
    )

    // Merge database services with configured services
    const mergedServices = [
      ...configuredServices,
      ...dbServices.map((dbService: any) => ({
        id: dbService.id,
        name: dbService.name,
        description: dbService.description,
        basePrice: dbService.basePrice,
        duration: dbService.duration || 60,
        features: dbService.features || [],
        mainCategory: determineMainCategory(dbService),
        category: determineCategory(dbService)
      }))
    ]

    return mergedServices
  } catch (error) {
    console.error('Error fetching services:', error)
    return []
  }
}

function determineMainCategory(service: any): MainCategory {
  // Logic to determine main category based on service name/category
  if (service.name.toLowerCase().includes('plumb') || 
      service.name.toLowerCase().includes('electric')) {
    return 'HOME_SERVICES'
  }
  if (service.name.toLowerCase().includes('computer') || 
      service.name.toLowerCase().includes('it')) {
    return 'TECHNICAL_SERVICES'
  }
  return 'HOME_SERVICES' // Default category
}

function determineCategory(service: any): ServiceCategory {
  // Logic to determine category based on service name/category
  if (service.name.toLowerCase().includes('plumb')) {
    return 'PLUMBING'
  }
  if (service.name.toLowerCase().includes('electric')) {
    return 'ELECTRICAL'
  }
  if (service.name.toLowerCase().includes('computer') || 
      service.name.toLowerCase().includes('it')) {
    return 'IT_SUPPORT'
  }
  return 'PLUMBING' // Default category
}

export function groupServicesByCategory(services: ServiceData[]) {
  return services.reduce((acc, service) => {
    if (!service.mainCategory || !service.category) return acc

    if (!acc[service.mainCategory]) {
      acc[service.mainCategory] = {}
    }
    if (!acc[service.mainCategory][service.category]) {
      acc[service.mainCategory][service.category] = []
    }
    acc[service.mainCategory][service.category].push(service)
    return acc
  }, {} as Record<MainCategory, Record<ServiceCategory, ServiceData[]>>)
}
