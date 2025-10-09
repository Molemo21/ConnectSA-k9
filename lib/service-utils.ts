import { ServiceData } from '@/types/services';

export async function getAllServices(): Promise<ServiceData[]> {
  try {
    const response = await fetch('/api/services');
    if (!response.ok) {
      throw new Error('Failed to fetch services from API');
    }

    const services = await response.json();
    
    // Transform the data to match the ServiceData type
    return services.map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      basePrice: service.basePrice || 0,
      categoryId: service.categoryId,
      categoryName: service.categoryName,
      categoryIcon: service.categoryIcon,
      features: [
        'Professional service',
        'Quality guarantee',
        'Satisfaction guaranteed',
        'Experienced staff'
      ],
      duration: 60 // Default duration in minutes
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

export function groupServicesByCategory(services: ServiceData[]): Record<string, ServiceData[]> {
  const grouped: Record<string, ServiceData[]> = {};

  services.forEach(service => {
    const categoryId = service.categoryId;
    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
    }
    grouped[categoryId].push(service);
  });

  return grouped;
}

export function getServiceById(id: string, services: ServiceData[]): ServiceData | undefined {
  return services.find(service => service.id === id);
}

export function getServicesByCategory(categoryId: string, services: ServiceData[]): ServiceData[] {
  return services.filter(service => service.categoryId === categoryId);
}