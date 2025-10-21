/**
 * Package Generation Service
 * 
 * This service automatically creates starter packages for providers
 * based on their selected services and market intelligence.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PackageTier {
  name: string;
  multiplier: number;
  duration: number;
  description: string;
  features: string[];
}

export interface MarketPricing {
  min: number;
  max: number;
  avg: number;
  competitive: number;
}

export interface ServicePackage {
  serviceId: string;
  title: string;
  shortDesc: string;
  longDesc: string;
  price: number;
  durationMins: number;
  tier: string;
}

// Standard package tiers
const PACKAGE_TIERS: PackageTier[] = [
  {
    name: 'Essential',
    multiplier: 0.8,
    duration: 60,
    description: 'Core service delivery',
    features: ['Basic service', 'Standard quality', 'Efficient delivery']
  },
  {
    name: 'Professional',
    multiplier: 1.0,
    duration: 90,
    description: 'Enhanced service with attention to detail',
    features: ['Enhanced service', 'Quality focus', 'Detailed work']
  },
  {
    name: 'Premium',
    multiplier: 1.3,
    duration: 120,
    description: 'Comprehensive service with premium touches',
    features: ['Premium service', 'Luxury quality', 'Comprehensive delivery']
  }
];

// Service-specific features
const SERVICE_FEATURES = {
  'house_cleaning': {
    essential: ['Bedroom cleaning', 'Living area cleaning', 'Kitchen basics', 'Bathroom cleaning'],
    professional: ['Deep kitchen cleaning', 'Detailed bathroom cleaning', 'Window cleaning', 'Light fixture cleaning'],
    premium: ['Inside appliances', 'Detailed organization', 'Premium products', 'Cabinet interior cleaning']
  },
  'office_cleaning': {
    essential: ['Desk cleaning', 'Floor vacuuming', 'Trash removal', 'Basic sanitizing'],
    professional: ['Deep desk cleaning', 'Window cleaning', 'Restroom sanitizing', 'Kitchen area cleaning'],
    premium: ['Complete sanitization', 'Equipment cleaning', 'Premium supplies', 'Detailed organization']
  },
  'deep_cleaning': {
    essential: ['Surface cleaning', 'Basic deep clean', 'Standard products'],
    professional: ['Deep surface cleaning', 'Grout cleaning', 'Detailed sanitizing', 'Quality products'],
    premium: ['Complete deep clean', 'Premium products', 'Detailed organization', 'Luxury touches']
  }
};

/**
 * Generate market pricing intelligence for a service
 */
export async function generateMarketPricing(serviceId: string, location?: string): Promise<MarketPricing> {
  try {
    // Get existing catalogue items for the same service
    const existingItems = await prisma.catalogueItem.findMany({
      where: {
        serviceId,
        isActive: true
      },
      select: {
        price: true,
        provider: {
          select: {
            location: true
          }
        }
      }
    });

    if (existingItems.length === 0) {
      // Default pricing if no market data
      return {
        min: 150,
        max: 300,
        avg: 225,
        competitive: 200
      };
    }

    const prices = existingItems.map(item => item.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    // Competitive pricing is 10% below average
    const competitive = Math.round(avg * 0.9);

    return { min, max, avg, competitive };
  } catch (error) {
    console.error('Error generating market pricing:', error);
    // Fallback to default pricing
    return {
      min: 150,
      max: 300,
      avg: 225,
      competitive: 200
    };
  }
}

/**
 * Create starter packages for a provider
 */
export async function createStarterPackages(providerId: string, serviceIds: string[]): Promise<ServicePackage[]> {
  try {
    console.log(`🚀 Creating starter packages for provider ${providerId} with services:`, serviceIds);

    const createdPackages: ServicePackage[] = [];

    for (const serviceId of serviceIds) {
      // Get service information
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          category: true
        }
      });

      if (!service) {
        console.warn(`Service ${serviceId} not found, skipping`);
        continue;
      }

      // Get market pricing for this service
      const marketPricing = await generateMarketPricing(serviceId);

      // Create packages for each tier
      for (const tier of PACKAGE_TIERS) {
        const price = Math.round(marketPricing.competitive * tier.multiplier);
        
        // Get service-specific features
        const serviceKey = service.name.toLowerCase().replace(/\s+/g, '_') as keyof typeof SERVICE_FEATURES;
        const features = SERVICE_FEATURES[serviceKey]?.[tier.name.toLowerCase() as keyof typeof SERVICE_FEATURES[typeof serviceKey]] || 
                        SERVICE_FEATURES['house_cleaning'][tier.name.toLowerCase() as keyof typeof SERVICE_FEATURES['house_cleaning']];

        const packageData = {
          providerId,
          serviceId,
          title: `${tier.name} ${service.name}`,
          shortDesc: `Professional ${service.name.toLowerCase()} service - ${tier.name.toLowerCase()} package`,
          longDesc: `High-quality ${service.name.toLowerCase()} service with ${tier.description}. Includes: ${features.join(', ')}.`,
          price,
          currency: 'ZAR',
          durationMins: tier.duration,
          images: [],
          isActive: true
        };

        const createdPackage = await prisma.catalogueItem.create({
          data: packageData
        });

        createdPackages.push({
          serviceId,
          title: createdPackage.title,
          shortDesc: createdPackage.shortDesc,
          longDesc: createdPackage.longDesc || '',
          price: createdPackage.price,
          durationMins: createdPackage.durationMins,
          tier: tier.name
        });

        console.log(`✅ Created ${tier.name} package: ${createdPackage.title} - R${createdPackage.price}`);
      }
    }

    console.log(`🎉 Successfully created ${createdPackages.length} starter packages for provider ${providerId}`);
    return createdPackages;

  } catch (error) {
    console.error('Error creating starter packages:', error);
    throw error;
  }
}

/**
 * Get package generation statistics
 */
export async function getPackageGenerationStats(): Promise<{
  totalProviders: number;
  providersWithPackages: number;
  totalPackages: number;
  averagePackagesPerProvider: number;
}> {
  try {
    const totalProviders = await prisma.provider.count({
      where: { status: 'APPROVED' }
    });

    const providersWithPackages = await prisma.provider.count({
      where: {
        status: 'APPROVED',
        catalogueItems: {
          some: {}
        }
      }
    });

    const totalPackages = await prisma.catalogueItem.count({
      where: { isActive: true }
    });

    const averagePackagesPerProvider = providersWithPackages > 0 
      ? Math.round(totalPackages / providersWithPackages) 
      : 0;

    return {
      totalProviders,
      providersWithPackages,
      totalPackages,
      averagePackagesPerProvider
    };
  } catch (error) {
    console.error('Error getting package generation stats:', error);
    throw error;
  }
}

/**
 * Validate package generation prerequisites
 */
export async function validatePackageGeneration(providerId: string, serviceIds: string[]): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Check if provider exists and is approved
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        services: true
      }
    });

    if (!provider) {
      errors.push('Provider not found');
    } else if (provider.status !== 'APPROVED') {
      errors.push('Provider must be approved to create packages');
    }

    // Check if provider offers the requested services
    const providerServiceIds = provider?.services.map(ps => ps.serviceId) || [];
    const invalidServices = serviceIds.filter(id => !providerServiceIds.includes(id));
    
    if (invalidServices.length > 0) {
      errors.push(`Provider does not offer services: ${invalidServices.join(', ')}`);
    }

    // Check if services exist and are active
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true
      }
    });

    const missingServices = serviceIds.filter(id => !services.some(s => s.id === id));
    if (missingServices.length > 0) {
      errors.push(`Services not found or inactive: ${missingServices.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    console.error('Error validating package generation:', error);
    return {
      isValid: false,
      errors: ['Validation error occurred']
    };
  }
}
