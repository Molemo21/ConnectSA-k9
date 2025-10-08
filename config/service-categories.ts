"use client"

export type MainCategory = 'BEAUTY_AND_WELLNESS' | 'HOME_SERVICES'
export type ServiceCategory = 'HAIR_SERVICES' | 'NAILS' | 'RESIDENTIAL_CLEANING' | 'PLUMBING' | 'ELECTRICAL'

interface ServiceData {
  name: string
  description: string
  basePrice: number
  duration: number
  features: string[]
}

interface CategoryData {
  id: string
  name: string
  icon: string
  services: ServiceData[]
}

interface MainCategoryData {
  id: string
  name: string
  icon: string
  categories: Record<ServiceCategory, CategoryData>
}

export const SERVICE_CATEGORIES: Record<MainCategory, MainCategoryData> = {
  BEAUTY_AND_WELLNESS: {
    id: 'BEAUTY_AND_WELLNESS',
    name: 'Beauty & Wellness',
    icon: '✨',
    categories: {
      HAIR_SERVICES: {
        id: 'HAIR_SERVICES',
        name: 'Hair Services',
        icon: '✂️',
        services: [
          {
            name: 'Haircut & Trim',
            description: 'Professional haircut service for all hair types',
            basePrice: 250,
            duration: 60,
            features: ['Consultation', 'Wash', 'Cut', 'Style']
          },
          {
            name: 'Blow Dry & Styling',
            description: 'Professional blow dry and styling service',
            basePrice: 300,
            duration: 90,
            features: ['Wash', 'Blow dry', 'Styling', 'Heat protection']
          }
        ]
      },
      NAILS: {
        id: 'NAILS',
        name: 'Nail Services',
        icon: '💅',
        services: [
          {
            name: 'Manicure',
            description: 'Professional manicure service',
            basePrice: 200,
            duration: 45,
            features: ['Soak', 'Shape', 'Cuticle care', 'Polish']
          }
        ]
      },
      RESIDENTIAL_CLEANING: {
        id: 'RESIDENTIAL_CLEANING',
        name: 'Residential Cleaning',
        icon: '🧹',
        services: []
      },
      PLUMBING: {
        id: 'PLUMBING',
        name: 'Plumbing',
        icon: '🔧',
        services: []
      },
      ELECTRICAL: {
        id: 'ELECTRICAL',
        name: 'Electrical',
        icon: '⚡',
        services: []
      }
    }
  },
  HOME_SERVICES: {
    id: 'HOME_SERVICES',
    name: 'Home Services',
    icon: '🏠',
    categories: {
      HAIR_SERVICES: {
        id: 'HAIR_SERVICES',
        name: 'Hair Services',
        icon: '✂️',
        services: []
      },
      NAILS: {
        id: 'NAILS',
        name: 'Nail Services',
        icon: '💅',
        services: []
      },
      RESIDENTIAL_CLEANING: {
        id: 'RESIDENTIAL_CLEANING',
        name: 'Residential Cleaning',
        icon: '🧹',
        services: [
          {
            name: 'Standard Home Cleaning',
            description: 'Regular home cleaning service',
            basePrice: 400,
            duration: 180,
            features: [
              'Dusting',
              'Vacuuming',
              'Mopping',
              'Bathroom cleaning',
              'Kitchen cleaning'
            ]
          }
        ]
      },
      PLUMBING: {
        id: 'PLUMBING',
        name: 'Plumbing',
        icon: '🔧',
        services: []
      },
      ELECTRICAL: {
        id: 'ELECTRICAL',
        name: 'Electrical',
        icon: '⚡',
        services: []
      }
    }
  }
}

export function getMainCategories() {
  return Object.values(SERVICE_CATEGORIES)
}

export function getServiceCategories(mainCategory: MainCategory) {
  return Object.values(SERVICE_CATEGORIES[mainCategory].categories)
}

export function getServices(mainCategory: MainCategory, category: ServiceCategory) {
  return SERVICE_CATEGORIES[mainCategory].categories[category].services
}

export function getCategoryInfo(mainCategory: MainCategory, category: ServiceCategory) {
  return SERVICE_CATEGORIES[mainCategory].categories[category]
}

export function getMainCategoryInfo(mainCategory: MainCategory) {
  return SERVICE_CATEGORIES[mainCategory]
}