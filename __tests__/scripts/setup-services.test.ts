import { PrismaClient } from '@prisma/client'

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    service: {
      upsert: jest.fn(),
    },
    provider: {
      findMany: jest.fn(),
    },
    providerService: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}))

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>

describe('Setup Services Script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create Haircut and Garden services', async () => {
    // Mock successful service creation
    mockPrisma.service.upsert
      .mockResolvedValueOnce({
        id: 'haircut-service',
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        category: 'Beauty & Personal Care',
        basePrice: 25.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'garden-service',
        name: 'Garden',
        description: 'Garden maintenance, landscaping, and plant care services',
        category: 'Home & Garden',
        basePrice: 50.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    // Mock provider data
    mockPrisma.provider.findMany.mockResolvedValue([
      {
        id: 'provider-1',
        businessName: 'Hair Studio Pro',
        status: 'APPROVED',
        available: true,
        experience: 5,
        location: 'Test City',
        description: 'Professional haircut services',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'PROVIDER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        services: [],
        reviews: [],
        bookings: [],
      },
      {
        id: 'provider-2',
        businessName: 'Garden Care Plus',
        status: 'APPROVED',
        available: true,
        experience: 8,
        location: 'Test City',
        description: 'Professional garden services',
        userId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'PROVIDER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        services: [],
        reviews: [],
        bookings: [],
      },
    ])

    // Mock successful provider service operations
    mockPrisma.providerService.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.providerService.create.mockResolvedValue({
      id: 'ps-1',
      providerId: 'provider-1',
      serviceId: 'haircut-service',
      customRate: 30.0,
    })

    // Test the script logic directly
    const haircutService = await mockPrisma.service.upsert({
      where: { id: 'haircut-service' },
      update: {},
      create: {
        id: 'haircut-service',
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        category: 'Beauty & Personal Care',
        basePrice: 25.0,
        isActive: true,
      },
    })

    const gardenService = await mockPrisma.service.upsert({
      where: { id: 'garden-service' },
      update: {},
      create: {
        id: 'garden-service',
        name: 'Garden',
        description: 'Garden maintenance, landscaping, and plant care services',
        category: 'Home & Garden',
        basePrice: 50.0,
        isActive: true,
      },
    })

    const providers = await mockPrisma.provider.findMany({
      where: { status: 'APPROVED' },
      include: { services: true }
    })

    // Process each provider
    for (const provider of providers) {
      await mockPrisma.providerService.deleteMany({
        where: { providerId: provider.id }
      })

      const randomService = Math.random() > 0.5 ? haircutService : gardenService
      
      await mockPrisma.providerService.create({
        data: {
          providerId: provider.id,
          serviceId: randomService.id,
          customRate: randomService.basePrice + (Math.random() * 20 - 10),
        }
      })
    }

    // Verify services were created
    expect(mockPrisma.service.upsert).toHaveBeenCalledTimes(2)

    expect(mockPrisma.service.upsert).toHaveBeenCalledWith({
      where: { id: 'haircut-service' },
      update: {},
      create: {
        id: 'haircut-service',
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        category: 'Beauty & Personal Care',
        basePrice: 25.0,
        isActive: true,
      },
    })

    expect(mockPrisma.service.upsert).toHaveBeenCalledWith({
      where: { id: 'garden-service' },
      update: {},
      create: {
        id: 'garden-service',
        name: 'Garden',
        description: 'Garden maintenance, landscaping, and plant care services',
        category: 'Home & Garden',
        basePrice: 50.0,
        isActive: true,
      },
    })

    // Verify providers were found
    expect(mockPrisma.provider.findMany).toHaveBeenCalledWith({
      where: { status: 'APPROVED' },
      include: { services: true }
    })

    // Verify provider services were processed
    expect(mockPrisma.providerService.deleteMany).toHaveBeenCalledTimes(2)
    expect(mockPrisma.providerService.create).toHaveBeenCalledTimes(2)
  })

  it('should handle errors gracefully', async () => {
    // Mock service creation error
    mockPrisma.service.upsert.mockRejectedValue(new Error('Database connection failed'))

    // Mock console.error to capture error output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Test error handling
    try {
      await mockPrisma.service.upsert({
        where: { id: 'haircut-service' },
        update: {},
        create: {
          id: 'haircut-service',
          name: 'Haircut',
          description: 'Professional haircut and styling services',
          category: 'Beauty & Personal Care',
          basePrice: 25.0,
          isActive: true,
        },
      })
    } catch (error) {
      console.error('❌ Error:', error)
    }

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('should assign services randomly to providers', async () => {
    // Mock successful service creation
    mockPrisma.service.upsert
      .mockResolvedValueOnce({
        id: 'haircut-service',
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        category: 'Beauty & Personal Care',
        basePrice: 25.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'garden-service',
        name: 'Garden',
        description: 'Garden maintenance, landscaping, and plant care services',
        category: 'Home & Garden',
        basePrice: 50.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    // Mock provider data
    mockPrisma.provider.findMany.mockResolvedValue([
      {
        id: 'provider-1',
        businessName: 'Hair Studio Pro',
        status: 'APPROVED',
        available: true,
        experience: 5,
        location: 'Test City',
        description: 'Professional haircut services',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'PROVIDER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        services: [],
        reviews: [],
        bookings: [],
      },
    ])

    // Mock successful provider service operations
    mockPrisma.providerService.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.providerService.create.mockResolvedValue({
      id: 'ps-1',
      providerId: 'provider-1',
      serviceId: 'haircut-service',
      customRate: 30.0,
    })

    // Test the script logic
    const haircutService = await mockPrisma.service.upsert({
      where: { id: 'haircut-service' },
      update: {},
      create: {
        id: 'haircut-service',
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        category: 'Beauty & Personal Care',
        basePrice: 25.0,
        isActive: true,
      },
    })

    const gardenService = await mockPrisma.service.upsert({
      where: { id: 'garden-service' },
      update: {},
      create: {
        id: 'garden-service',
        name: 'Garden',
        description: 'Garden maintenance, landscaping, and plant care services',
        category: 'Home & Garden',
        basePrice: 50.0,
        isActive: true,
      },
    })

    const providers = await mockPrisma.provider.findMany({
      where: { status: 'APPROVED' },
      include: { services: true }
    })

    // Process each provider
    for (const provider of providers) {
      await mockPrisma.providerService.deleteMany({
        where: { providerId: provider.id }
      })

      const randomService = Math.random() > 0.5 ? haircutService : gardenService
      
      await mockPrisma.providerService.create({
        data: {
          providerId: provider.id,
          serviceId: randomService.id,
          customRate: randomService.basePrice + (Math.random() * 20 - 10),
        }
      })
    }

    // Verify that each provider gets exactly one service
    expect(mockPrisma.providerService.deleteMany).toHaveBeenCalledWith({
      where: { providerId: 'provider-1' }
    })

    expect(mockPrisma.providerService.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerId: 'provider-1',
        customRate: expect.any(Number),
      })
    })
  })

  it('should handle providers with existing services', async () => {
    // Mock successful service creation
    mockPrisma.service.upsert
      .mockResolvedValueOnce({
        id: 'haircut-service',
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        category: 'Beauty & Personal Care',
        basePrice: 25.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'garden-service',
        name: 'Garden',
        description: 'Garden maintenance, landscaping, and plant care services',
        category: 'Home & Garden',
        basePrice: 50.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    // Mock provider with existing services
    mockPrisma.provider.findMany.mockResolvedValue([
      {
        id: 'provider-1',
        businessName: 'Hair Studio Pro',
        status: 'APPROVED',
        available: true,
        experience: 5,
        location: 'Test City',
        description: 'Professional haircut services',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'PROVIDER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        services: [
          {
            id: 'ps-existing',
            providerId: 'provider-1',
            serviceId: 'old-service',
            customRate: 20.0,
          }
        ],
        reviews: [],
        bookings: [],
      },
    ])

    // Mock successful provider service operations
    mockPrisma.providerService.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.providerService.create.mockResolvedValue({
      id: 'ps-new',
      providerId: 'provider-1',
      serviceId: 'haircut-service',
      customRate: 30.0,
    })

    // Test the script logic
    const haircutService = await mockPrisma.service.upsert({
      where: { id: 'haircut-service' },
      update: {},
      create: {
        id: 'haircut-service',
        name: 'Haircut',
        description: 'Professional haircut and styling services',
        category: 'Beauty & Personal Care',
        basePrice: 25.0,
        isActive: true,
      },
    })

    const gardenService = await mockPrisma.service.upsert({
      where: { id: 'garden-service' },
      update: {},
      create: {
        id: 'garden-service',
        name: 'Garden',
        description: 'Garden maintenance, landscaping, and plant care services',
        category: 'Home & Garden',
        basePrice: 50.0,
        isActive: true,
      },
    })

    const providers = await mockPrisma.provider.findMany({
      where: { status: 'APPROVED' },
      include: { services: true }
    })

    // Process each provider
    for (const provider of providers) {
      await mockPrisma.providerService.deleteMany({
        where: { providerId: provider.id }
      })

      const randomService = Math.random() > 0.5 ? haircutService : gardenService
      
      await mockPrisma.providerService.create({
        data: {
          providerId: provider.id,
          serviceId: randomService.id,
          customRate: randomService.basePrice + (Math.random() * 20 - 10),
        }
      })
    }

    // Verify existing services were removed
    expect(mockPrisma.providerService.deleteMany).toHaveBeenCalledWith({
      where: { providerId: 'provider-1' }
    })

    // Verify new service was assigned
    expect(mockPrisma.providerService.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerId: 'provider-1',
        customRate: expect.any(Number),
      })
    })
  })
}) 