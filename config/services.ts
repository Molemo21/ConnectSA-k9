/**
 * Service Configuration
 * 
 * This file defines the reference data for services that can be promoted
 * from development to production using sync-reference-data-dev-to-prod.ts
 * 
 * IMPORTANT: This is the source of truth for service definitions.
 * Changes here should be synced to the database via the promotion script.
 */

/**
 * Service category type - matches database enum values
 */
export type ServiceCategoryType = 'CLEANING' | 'BEAUTY';

/**
 * Service configuration interface
 * Matches the structure needed for database seeding and promotion
 */
export interface ServiceConfig {
  /** Unique service identifier (used for matching during sync) */
  name: string;
  /** Service description */
  description: string;
  /** Category name - must match ServiceCategory.name in database */
  category: ServiceCategoryType;
  /** Base price in local currency (ZAR) */
  basePrice: number;
  /** List of service features/benefits */
  features: string[];
  /** Whether the service is active/available */
  isActive: boolean;
}

/**
 * Service configurations organized by category
 * 
 * These services will be synced to the database via:
 * npm run sync:reference:dry-run (preview)
 * npm run sync:reference:apply (apply in CI)
 */
export const SERVICES: ServiceConfig[] = [
  // ============================================================================
  // CLEANING SERVICES
  // ============================================================================
  {
    name: 'Carpet Cleaning',
    description: 'Professional carpet and upholstery cleaning services',
    category: 'CLEANING',
    basePrice: 400,
    features: [
      'Deep stain removal',
      'Odor elimination',
      'Fabric protection',
      'Eco-friendly products'
    ],
    isActive: true
  },
  {
    name: 'Office Cleaning',
    description: 'Professional cleaning services for offices',
    category: 'CLEANING',
    basePrice: 150,
    features: [
      'Dusting and vacuuming',
      'Surface sanitizing',
      'Trash removal',
      'Basic organization'
    ],
    isActive: true
  },
  {
    name: 'Deep Cleaning',
    description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
    category: 'CLEANING',
    basePrice: 600,
    features: [
      'Inside appliances',
      'Detailed organization',
      'Premium products',
      'Cabinet interior cleaning'
    ],
    isActive: true
  },
  {
    name: 'Standard House Cleaning',
    description: 'Professional house cleaning services including dusting, vacuuming, and sanitizing',
    category: 'CLEANING',
    basePrice: 350,
    features: [
      'Bedroom cleaning',
      'Living area cleaning',
      'Kitchen basics',
      'Bathroom cleaning'
    ],
    isActive: true
  },
  {
    name: 'Window Cleaning',
    description: 'Interior and exterior window cleaning services',
    category: 'CLEANING',
    basePrice: 300,
    features: [
      'Interior windows',
      'Exterior windows',
      'Window frames',
      'Screen cleaning'
    ],
    isActive: true
  },
  {
    name: 'Mobile Car Wash',
    description: 'Professional mobile car wash and detailing services at your location',
    category: 'CLEANING',
    basePrice: 100,
    features: [
      'Exterior wash',
      'Interior vacuuming',
      'Tire cleaning',
      'Window cleaning'
    ],
    isActive: true
  },

  // ============================================================================
  // BEAUTY SERVICES
  // ============================================================================
  {
    name: 'Haircut (Men & Women)',
    description: 'Professional haircut and styling services for men and women',
    category: 'BEAUTY',
    basePrice: 150,
    features: [
      'Professional haircut',
      'Styling',
      'Consultation',
      'Quality products'
    ],
    isActive: true
  },
  {
    name: 'Braiding',
    description: 'Professional hair braiding and styling services',
    category: 'BEAUTY',
    basePrice: 200,
    features: [
      'Cornrows',
      'Box braids',
      'Ghana braids',
      'Protective styling'
    ],
    isActive: true
  },
  {
    name: 'Weave Installation',
    description: 'Full installation of weave with styling included',
    category: 'BEAUTY',
    basePrice: 300,
    features: [
      'Weave installation',
      'Hair extensions',
      'Blending',
      'Styling'
    ],
    isActive: true
  },
  {
    name: 'Eyelash Extensions',
    description: 'Professional eyelash extension application',
    category: 'BEAUTY',
    basePrice: 180,
    features: [
      'Lash extensions',
      'Volume lashes',
      'Classic lashes',
      'Aftercare'
    ],
    isActive: true
  },
  {
    name: 'Facial',
    description: 'Professional facial treatment and skincare services',
    category: 'BEAUTY',
    basePrice: 220,
    features: [
      'Deep cleansing',
      'Exfoliation',
      'Moisturizing',
      'Skin analysis'
    ],
    isActive: true
  },
  {
    name: 'Waxing',
    description: 'Professional hair removal and waxing services',
    category: 'BEAUTY',
    basePrice: 100,
    features: [
      'Body waxing',
      'Facial waxing',
      'Eyebrow shaping',
      'Aftercare'
    ],
    isActive: true
  },
  {
    name: 'Bridal Makeup',
    description: 'Professional bridal makeup and styling services',
    category: 'BEAUTY',
    basePrice: 400,
    features: [
      'Bridal consultation',
      'Trial session',
      'Wedding day makeup',
      'Touch-ups'
    ],
    isActive: true
  },
  {
    name: 'Makeup Application (Regular)',
    description: 'Professional makeup application for special occasions',
    category: 'BEAUTY',
    basePrice: 200,
    features: [
      'Foundation application',
      'Eye makeup',
      'Lip styling',
      'Consultation'
    ],
    isActive: true
  },
  {
    name: 'Manicure',
    description: 'Professional nail care and manicure services',
    category: 'BEAUTY',
    basePrice: 120,
    features: [
      'Nail shaping',
      'Cuticle care',
      'Polish application',
      'Hand massage'
    ],
    isActive: true
  },
  {
    name: 'Pedicure',
    description: 'Professional foot care and pedicure services',
    category: 'BEAUTY',
    basePrice: 150,
    features: [
      'Foot soak',
      'Nail shaping',
      'Cuticle care',
      'Foot massage'
    ],
    isActive: true
  },
  {
    name: 'Nail Extensions',
    description: 'Professional nail extension and enhancement services',
    category: 'BEAUTY',
    basePrice: 250,
    features: [
      'Acrylic extensions',
      'Gel extensions',
      'Nail art',
      'Maintenance'
    ],
    isActive: true
  }
] as const;

/**
 * Type-safe service names
 */
export type ServiceName = typeof SERVICES[number]['name'];

/**
 * Get services by category
 */
export function getServicesByCategory(category: ServiceCategoryType): ServiceConfig[] {
  return SERVICES.filter(service => service.category === category);
}

/**
 * Get a service by name
 */
export function getServiceByName(name: string): ServiceConfig | undefined {
  return SERVICES.find(service => service.name === name);
}

/**
 * Get all active services
 */
export function getActiveServices(): ServiceConfig[] {
  return SERVICES.filter(service => service.isActive);
}

/**
 * Validate service configuration
 * Ensures all required fields are present and valid
 */
export function validateServiceConfig(service: ServiceConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!service.name || service.name.trim().length === 0) {
    errors.push('Service name is required');
  }

  if (!service.description || service.description.trim().length === 0) {
    errors.push('Service description is required');
  }

  if (!service.category || !['CLEANING', 'BEAUTY'].includes(service.category)) {
    errors.push('Service category must be CLEANING or BEAUTY');
  }

  if (typeof service.basePrice !== 'number' || service.basePrice <= 0) {
    errors.push('Service basePrice must be a positive number');
  }

  if (!Array.isArray(service.features) || service.features.length === 0) {
    errors.push('Service must have at least one feature');
  }

  if (typeof service.isActive !== 'boolean') {
    errors.push('Service isActive must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate all services
 */
export function validateAllServices(): {
  valid: boolean;
  errors: Array<{ service: string; errors: string[] }>;
} {
  const allErrors: Array<{ service: string; errors: string[] }> = [];

  SERVICES.forEach(service => {
    const validation = validateServiceConfig(service);
    if (!validation.valid) {
      allErrors.push({
        service: service.name,
        errors: validation.errors
      });
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}
