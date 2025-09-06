// Avoid constructing NextRequest in Jest; use a minimal Request-like object instead
import { POST } from '@/app/api/book-service/discover-providers/route'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    provider: {
      findMany: jest.fn(),
    },
    providerService: {
      findMany: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
    },
  },
}))

// Mock auth (default and named)
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  default: {},
  getCurrentUser: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/book-service/discover-providers', () => {
  let mockRequest: any

  beforeEach(() => {
    jest.clearAllMocks()
    const body = {
      serviceId: 'clabcdefghijklmnoqrstuvwx',
      date: '2024-08-15',
      time: '14:00',
      address: '123 Test Street, Test City'
    }
    mockRequest = {
      json: async () => body,
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      url: 'http://localhost:3000/api/book-service/discover-providers'
    }
  })

  describe('POST', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue(null)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for non-client users', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue({
        id: 'user-1',
        role: 'PROVIDER'
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid request body', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      const invalidRequest = {
        json: async () => ({
          serviceId: '', // Invalid: empty string
          date: 'invalid-date', // Invalid: not ISO format
          time: '', // Invalid: empty string
          address: '' // Invalid: empty string
        }),
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        url: 'http://localhost:3000/api/book-service/discover-providers'
      }

      const response = await POST(invalidRequest)
      expect(response.status).toBe(400)
    })

    it('should successfully discover available providers', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      const mockProviders = [
        {
          id: 'provider-1',
          businessName: 'Hair Studio Pro',
          description: 'Professional haircut services',
          experience: 5,
          location: 'Test City',
          available: true,
          status: 'APPROVED',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            avatar: 'avatar1.jpg'
          },
          services: [
            {
              customRate: 30.0,
              service: {
                name: 'Haircut',
                description: 'Professional haircut and styling services',
                category: 'Beauty & Personal Care'
              }
            }
          ],
          reviews: [
            {
              id: 'review-1',
              rating: 5,
              comment: 'Excellent service!',
              createdAt: new Date(),
              client: { name: 'Client 1' }
            }
          ],
          bookings: [],
          _count: {
            reviews: 1,
            bookings: 5
          }
        }
      ]

      mockPrisma.provider.findMany.mockResolvedValue(mockProviders)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.providers).toHaveLength(1)
      expect(data.totalCount).toBe(1)
      expect(data.providers[0].id).toBe('provider-1')
      expect(data.providers[0].businessName).toBe('Hair Studio Pro')
      expect(data.providers[0].hourlyRate).toBe(30.0)
      expect(data.providers[0].averageRating).toBe(5)
      expect(data.providers[0].totalReviews).toBe(1)
      expect(data.providers[0].completedJobs).toBe(5)
    })

    it('should filter out providers with conflicting bookings', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      const mockProviders = [
        {
          id: 'provider-1',
          businessName: 'Hair Studio Pro',
          available: true,
          status: 'APPROVED',
          user: { name: 'John Doe', email: 'john@example.com', phone: '+1234567890', avatar: 'avatar1.jpg' },
          services: [{ customRate: 30.0, service: { name: 'Haircut', description: 'Professional haircut and styling services', category: 'Beauty & Personal Care' } }],
          reviews: [],
          bookings: [
            {
              scheduledDate: new Date('2024-08-15T14:00:00Z'),
              status: 'CONFIRMED'
            }
          ],
          _count: { reviews: 0, bookings: 0 }
        }
      ]

      mockPrisma.provider.findMany.mockResolvedValue(mockProviders)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('No providers are currently available')
    })

    it('should return empty array when no providers found', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      mockPrisma.provider.findMany.mockResolvedValue([])

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('No providers are currently available')
    })

    it('should sort providers by rating and experience', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      const mockProviders = [
        {
          id: 'provider-1',
          businessName: 'Hair Studio Pro',
          available: true,
          status: 'APPROVED',
          user: { name: 'John Doe', email: 'john@example.com', phone: '+1234567890', avatar: 'avatar1.jpg' },
          services: [{ customRate: 30.0, service: { name: 'Haircut', description: 'Professional haircut and styling services', category: 'Beauty & Personal Care' } }],
          reviews: [{ rating: 4, comment: 'Good service', createdAt: new Date(), client: { name: 'Client 1' } }],
          bookings: [],
          _count: { reviews: 1, bookings: 3 }
        },
        {
          id: 'provider-2',
          businessName: 'Elite Hair Salon',
          available: true,
          status: 'APPROVED',
          user: { name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', avatar: 'avatar2.jpg' },
          services: [{ customRate: 35.0, service: { name: 'Haircut', description: 'Professional haircut and styling services', category: 'Beauty & Personal Care' } }],
          reviews: [{ rating: 5, comment: 'Excellent service', createdAt: new Date(), client: { name: 'Client 2' } }],
          bookings: [],
          _count: { reviews: 1, bookings: 8 }
        }
      ]

      mockPrisma.provider.findMany.mockResolvedValue(mockProviders)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.providers).toHaveLength(2)
      // Provider 2 should be first (higher rating: 5 vs 4)
      expect(data.providers[0].id).toBe('provider-2')
      expect(data.providers[0].averageRating).toBe(5)
      expect(data.providers[1].id).toBe('provider-1')
      expect(data.providers[1].averageRating).toBe(4)
    })
  })
}) 