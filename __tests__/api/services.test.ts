import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/services/route';
import { db } from '@/lib/db-utils';
import { SERVICES } from '@/config/services';

// Mock the database
jest.mock('@/lib/db-utils', () => ({
  db: {
    service: {
      findMany: jest.fn()
    }
  }
}));

describe('Services API', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should return only cleaning services with providers', async () => {
    // Mock database response
    const mockDbServices = SERVICES.map((service, index) => ({
      id: `service_${index}`,
      name: service.name,
      category: 'CLEANING',
      description: service.description,
      basePrice: service.basePrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        providers: 1 // Each service has one provider
      }
    }));

    (db.service.findMany as jest.Mock).mockResolvedValue(mockDbServices);

    // Make the API call
    const response = await GET();
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveLength(SERVICES.length);
    
    // Verify each service
    data.forEach((service: any) => {
      // Should be a cleaning service
      expect(service.category).toBe('CLEANING');
      
      // Should match a configured service
      const configService = SERVICES.find(s => s.name === service.name);
      expect(configService).toBeDefined();
      
      // Should have all required fields
      expect(service).toHaveProperty('id');
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('description');
      expect(service).toHaveProperty('basePrice');
      expect(service).toHaveProperty('isActive');
      expect(service).toHaveProperty('createdAt');
      expect(service).toHaveProperty('updatedAt');
      
      // Should not have internal fields
      expect(service).not.toHaveProperty('_count');
    });

    // Verify database was called correctly
    expect(db.service.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        category: 'CLEANING',
        providers: {
          some: {
            provider: {
              status: "APPROVED",
              available: true
            }
          }
        }
      },
      select: expect.any(Object),
      orderBy: { name: 'asc' }
    });
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    (db.service.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Make the API call
    const response = await GET();
    const data = await response.json();

    // Verify error response
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch services' });
  });

  it('should filter out services with no providers', async () => {
    // Mock database response with some services having no providers
    const mockDbServices = SERVICES.map((service, index) => ({
      id: `service_${index}`,
      name: service.name,
      category: 'CLEANING',
      description: service.description,
      basePrice: service.basePrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        providers: index % 2 // Alternate between 0 and 1 provider
      }
    }));

    (db.service.findMany as jest.Mock).mockResolvedValue(mockDbServices);

    // Make the API call
    const response = await GET();
    const data = await response.json();

    // Verify only services with providers are returned
    expect(data.length).toBeLessThan(mockDbServices.length);
    data.forEach((service: any) => {
      const mockService = mockDbServices.find(s => s.id === service.id);
      expect(mockService?._count.providers).toBeGreaterThan(0);
    });
  });

  it('should handle build-time requests', async () => {
    // Mock build-time environment
    const originalPhase = process.env.NEXT_PHASE;
    process.env.NEXT_PHASE = 'phase-production-build';

    // Make the API call
    const response = await GET();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(503);
    expect(data).toEqual({ error: 'Service temporarily unavailable during deployment' });

    // Restore environment
    process.env.NEXT_PHASE = originalPhase;
  });
});
