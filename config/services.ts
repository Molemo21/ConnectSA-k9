import { Service, ServiceCategory } from '@/types/services';

export const SERVICES: Partial<Service>[] = [
  {
    name: 'Carpet Cleaning',
    description: 'Professional carpet and upholstery cleaning services',
    category: 'CLEANING',
    basePrice: 400,
    features: ['Deep stain removal', 'Odor elimination', 'Fabric protection', 'Eco-friendly products'],
    isActive: true
  },
  {
    name: 'Cleaning Services',
    description: 'Professional cleaning services for homes and offices',
    category: 'CLEANING',
    basePrice: 150,
    features: ['Dusting and vacuuming', 'Surface sanitizing', 'Trash removal', 'Basic organization'],
    isActive: true
  },
  {
    name: 'Deep Cleaning',
    description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
    category: 'CLEANING',
    basePrice: 600,
    features: ['Inside appliances', 'Detailed organization', 'Premium products', 'Cabinet interior cleaning'],
    isActive: true
  },
  {
    name: 'House Cleaning',
    description: 'Professional house cleaning services including dusting, vacuuming, and sanitizing',
    category: 'CLEANING',
    basePrice: 350,
    features: ['Bedroom cleaning', 'Living area cleaning', 'Kitchen basics', 'Bathroom cleaning'],
    isActive: true
  },
  {
    name: 'Window Cleaning',
    description: 'Interior and exterior window cleaning services',
    category: 'CLEANING',
    basePrice: 300,
    features: ['Interior windows', 'Exterior windows', 'Window frames', 'Screen cleaning'],
    isActive: true
  },
  // Beauty Services (matching database)
  {
    name: 'Haircut',
    description: 'Professional haircut and styling services',
    category: 'BEAUTY',
    basePrice: 150,
    features: ['Professional haircut', 'Styling', 'Consultation', 'Quality products'],
    isActive: true
  },
  {
    name: 'Barbering',
    description: 'Traditional barbering services including cuts and shaves',
    category: 'BEAUTY',
    basePrice: 120,
    features: ['Hair cutting', 'Beard trimming', 'Shaving', 'Styling'],
    isActive: true
  },
  {
    name: 'Braiding',
    description: 'Professional hair braiding and styling services',
    category: 'BEAUTY',
    basePrice: 200,
    features: ['Cornrows', 'Box braids', 'Ghana braids', 'Protective styling'],
    isActive: true
  },
  {
    name: 'Weave Installation',
    description: 'Professional hair weave and extension installation',
    category: 'BEAUTY',
    basePrice: 300,
    features: ['Weave installation', 'Hair extensions', 'Blending', 'Styling'],
    isActive: true
  },
  {
    name: 'Eyelash Extensions',
    description: 'Professional eyelash extension application',
    category: 'BEAUTY',
    basePrice: 180,
    features: ['Lash extensions', 'Volume lashes', 'Classic lashes', 'Aftercare'],
    isActive: true
  },
  {
    name: 'Facial',
    description: 'Professional facial treatment and skincare services',
    category: 'BEAUTY',
    basePrice: 220,
    features: ['Deep cleansing', 'Exfoliation', 'Moisturizing', 'Skin analysis'],
    isActive: true
  },
  {
    name: 'Waxing',
    description: 'Professional hair removal and waxing services',
    category: 'BEAUTY',
    basePrice: 100,
    features: ['Body waxing', 'Facial waxing', 'Eyebrow shaping', 'Aftercare'],
    isActive: true
  },
  {
    name: 'Bridal Makeup',
    description: 'Professional bridal makeup and styling services',
    category: 'BEAUTY',
    basePrice: 400,
    features: ['Bridal consultation', 'Trial session', 'Wedding day makeup', 'Touch-ups'],
    isActive: true
  },
  {
    name: 'Makeup Application',
    description: 'Professional makeup application for special occasions',
    category: 'BEAUTY',
    basePrice: 200,
    features: ['Foundation application', 'Eye makeup', 'Lip styling', 'Consultation'],
    isActive: true
  },
  {
    name: 'Manicure',
    description: 'Professional nail care and manicure services',
    category: 'BEAUTY',
    basePrice: 120,
    features: ['Nail shaping', 'Cuticle care', 'Polish application', 'Hand massage'],
    isActive: true
  },
  {
    name: 'Pedicure',
    description: 'Professional foot care and pedicure services',
    category: 'BEAUTY',
    basePrice: 150,
    features: ['Foot soak', 'Nail shaping', 'Cuticle care', 'Foot massage'],
    isActive: true
  },
  {
    name: 'Nail Extensions',
    description: 'Professional nail extension and enhancement services',
    category: 'BEAUTY',
    basePrice: 250,
    features: ['Acrylic extensions', 'Gel extensions', 'Nail art', 'Maintenance'],
    isActive: true
  }
];
