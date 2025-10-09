import { Service, ServiceCategory } from '@/types/services';

export const SERVICES: Partial<Service>[] = [
  {
    name: 'Carpet Cleaning',
    description: 'Professional carpet and upholstery cleaning services',
    category: 'CLEANING',
    basePrice: 400,
    isActive: true
  },
  {
    name: 'Cleaning Services',
    description: 'Professional cleaning services for homes and offices',
    category: 'CLEANING',
    basePrice: 150,
    isActive: true
  },
  {
    name: 'Deep Cleaning',
    description: 'Comprehensive deep cleaning for move-in/move-out or special occasions',
    category: 'CLEANING',
    basePrice: 600,
    isActive: true
  },
  {
    name: 'House Cleaning',
    description: 'Professional house cleaning services including dusting, vacuuming, and sanitizing',
    category: 'CLEANING',
    basePrice: 350,
    isActive: true
  },
  {
    name: 'Window Cleaning',
    description: 'Interior and exterior window cleaning services',
    category: 'CLEANING',
    basePrice: 300,
    isActive: true
  }
];