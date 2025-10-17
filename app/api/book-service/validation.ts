import { z } from 'zod';
import { SERVICES } from '@/config/services';
import { prisma } from '@/lib/db-utils';

// Helper function to validate service exists and is a cleaning service
export async function validateCleaningService(serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      name: true,
      category: true,
      isActive: true
    }
  });

  if (!service) {
    throw new Error('Service not found');
  }

  if (!service.isActive) {
    throw new Error('Service is not active');
  }

  if (service.category !== 'CLEANING') {
    throw new Error('Only cleaning services are available');
  }

  // Verify service is in our configuration
  const configService = SERVICES.find(s => s.name === service.name);
  if (!configService) {
    throw new Error('Service configuration not found');
  }

  return service;
}

// Base schema for service ID validation
export const serviceIdSchema = z.string().regex(
  /^([a-z0-9]{25}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, 
  "Service ID must be CUID (25 chars) or UUID (36 chars) format"
);

// Schema for booking requests
export const bookingSchema = z.object({
  serviceId: serviceIdSchema,
  date: z.string(), // ISO date string
  time: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 
    "Time must be in HH:mm format"
  ),
  address: z.string().min(1),
  notes: z.string().optional(),
});

// Schema for discovering providers
export const discoverProvidersSchema = z.object({
  serviceId: serviceIdSchema,
  date: z.string(),
  time: z.string(),
  address: z.string().min(1),
});

// Schema for sending offers
export const sendOfferSchema = z.object({
  providerId: z.string().min(1),
  serviceId: serviceIdSchema,
  date: z.string(),
  time: z.string(),
  address: z.string().min(1),
  notes: z.string().optional(),
});
