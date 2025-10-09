import { ServiceData } from "@/types/services";

export type MainCategory = 'HOME_SERVICES' | 'TECHNICAL_SERVICES';
export type ServiceCategory = 'CLEANING' | 'IT_SUPPORT' | 'SECURITY_SYSTEMS';

interface CategoryConfig {
  id: ServiceCategory;
  name: string;
  icon: string;
  services: ServiceData[];
}

interface MainCategoryConfig {
  id: MainCategory;
  name: string;
  icon: string;
  description: string;
  categories: Partial<Record<ServiceCategory, CategoryConfig>>;
}

export const SERVICE_CATEGORIES: Record<MainCategory, MainCategoryConfig> = {
  HOME_SERVICES: {
    id: 'HOME_SERVICES',
    name: 'Home Services',
    icon: '🏠',
    description: 'Professional home maintenance and improvement services',
    categories: {
      CLEANING: {
        id: 'CLEANING',
        name: 'Cleaning Services',
        icon: '🧹',
        services: [
          {
            id: 'cleaning-services',
            name: 'Cleaning Services',
            description: 'Professional cleaning services for homes and offices',
            basePrice: 150.00,
            duration: 60,
            features: ['Standard cleaning', 'Dusting & vacuuming', 'Surface sanitization', 'Trash removal'],
            mainCategory: 'HOME_SERVICES',
            category: 'CLEANING',
          },
          {
            id: 'house-cleaning',
            name: 'House Cleaning',
            description: 'Professional house cleaning services including dusting, vacuuming, and sanitizing',
            basePrice: 350.00,
            duration: 60,
            features: ['Dusting & wiping', 'Vacuum & mop', 'Bathroom & kitchen cleaning', 'Trash removal'],
            mainCategory: 'HOME_SERVICES',
            category: 'CLEANING',
          },
          {
            id: 'window-cleaning',
            name: 'Window Cleaning',
            description: 'Interior and exterior window cleaning services',
            basePrice: 300.00,
            duration: 60,
            features: ['Streak-free shine', 'Interior & exterior', 'Frame wiping', 'Eco-friendly products'],
            mainCategory: 'HOME_SERVICES',
            category: 'CLEANING',
          },
          {
            id: 'deep-cleaning',
            name: 'Deep Cleaning',
            description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
            basePrice: 600.00,
            duration: 60,
            features: ['Intensive cleaning', 'Appliance exterior', 'Cabinet interiors', 'Sanitization'],
            mainCategory: 'HOME_SERVICES',
            category: 'CLEANING',
          },
          {
            id: 'carpet-cleaning',
            name: 'Carpet Cleaning',
            description: 'Professional carpet and upholstery cleaning services',
            basePrice: 400.00,
            duration: 60,
            features: ['Stain removal', 'Deep steam cleaning', 'Odor elimination', 'Quick drying'],
            mainCategory: 'HOME_SERVICES',
            category: 'CLEANING',
          },
        ],
      },
    },
  },
  TECHNICAL_SERVICES: {
    id: 'TECHNICAL_SERVICES',
    name: 'Technical Services',
    icon: '💻',
    description: 'Professional technical and IT services',
    categories: {
      IT_SUPPORT: {
        id: 'IT_SUPPORT',
        name: 'IT Support',
        icon: '🖥️',
        services: [], // Placeholder for now
      },
      SECURITY_SYSTEMS: {
        id: 'SECURITY_SYSTEMS',
        name: 'Security Systems',
        icon: '🔒',
        services: [], // Placeholder for now
      },
    },
  },
};

// Helper function to get all services
export function getAllServices(): ServiceData[] {
  const services: ServiceData[] = [];
  Object.values(SERVICE_CATEGORIES).forEach(mainCategory => {
    Object.values(mainCategory.categories).forEach(category => {
      if (category && category.services) {
        services.push(...category.services);
      }
    });
  });
  return services;
}

// Helper function to get a service by ID
export function getServiceById(id: string): ServiceData | undefined {
  return getAllServices().find(service => service.id === id);
}

// Helper function to get services by category
export function getServicesByCategory(category: ServiceCategory): ServiceData[] {
  return getAllServices().filter(service => service.category === category);
}

// Helper function to get main category by service ID
export function getMainCategoryByServiceId(serviceId: string): MainCategory | undefined {
  const service = getServiceById(serviceId);
  if (!service) return undefined;
  return service.mainCategory;
}

// Helper function to get category config
export function getCategoryConfig(category: ServiceCategory): CategoryConfig | undefined {
  for (const mainCategory of Object.values(SERVICE_CATEGORIES)) {
    const categoryConfig = mainCategory.categories[category];
    if (categoryConfig) return categoryConfig;
  }
  return undefined;
}

// Export default for convenience
export default SERVICE_CATEGORIES;