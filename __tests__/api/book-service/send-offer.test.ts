// Mock Next.js Request
global.Request = class Request {
  constructor(input: any, init?: any) {
    return Object.assign(this, { input, init })
  }
} as any

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/book-service/send-offer/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    provider: {
      findFirst: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
    },
    proposal: {
      create: jest.fn(),
    },
    booking: {
      create: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/book-service/send-offer', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/book-service/send-offer', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'provider-1',
        serviceId: 'haircut-service',
        date: '2024-08-15',
        time: '14:00',
        address: '123 Test Street, Test City',
        notes: 'Please arrive 10 minutes early'
      })
    })
  })

  describe('POST', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue(null)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for non-client users', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue({
        id: 'user-1',
        role: 'PROVIDER'
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid request body', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      const invalidRequest = new NextRequest('http://localhost:3000/api/book-service/send-offer', {
        method: 'POST',
        body: JSON.stringify({
          providerId: '', // Invalid: empty string
          serviceId: '', // Invalid: empty string
          date: 'invalid-date', // Invalid: not ISO format
          time: '', // Invalid: empty string
          address: '' // Invalid: empty string
        })
      })

      const response = await POST(invalidRequest)
      expect(response.status).toBe(400)
    })

    it('should return 404 when provider not found', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      mockPrisma.provider.findFirst.mockResolvedValue(null)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Provider not found')
    })

    it('should return 400 when provider is not available for the service', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      mockPrisma.provider.findFirst.mockResolvedValue({
        id: 'provider-1',
        businessName: 'Hair Studio Pro',
        available: true,
        status: 'APPROVED',
        services: [
          {
            serviceId: 'different-service',
            customRate: 30.0,
            service: {
              name: 'Different Service',
              description: 'A different service',
              category: 'Other'
            }
          }
        ]
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Provider is not available for this service')
    })

    it('should return 400 when provider is busy at requested time', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      mockPrisma.provider.findFirst.mockResolvedValue({
        id: 'provider-1',
        businessName: 'Hair Studio Pro',
        available: true,
        status: 'APPROVED',
        services: [
          {
            serviceId: 'haircut-service',
            customRate: 30.0,
            service: {
              name: 'Haircut',
              description: 'Professional haircut and styling services',
              category: 'Beauty & Personal Care'
            }
          }
        ],
        bookings: [
          {
            scheduledDate: new Date('2024-08-15T14:00:00Z'),
            status: 'CONFIRMED'
          }
        ]
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Provider is busy at the requested time')
    })

    it('should successfully create booking and proposal', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      const mockProvider = {
        id: 'provider-1',
        businessName: 'Hair Studio Pro',
        available: true,
        status: 'APPROVED',
        services: [
          {
            serviceId: 'haircut-service',
            customRate: 30.0,
            service: {
              name: 'Haircut',
              description: 'Professional haircut and styling services',
              category: 'Beauty & Personal Care'
            }
          }
        ],
        bookings: []
      }

      const mockBooking = {
        id: 'booking-1',
        clientId: 'user-1',
        providerId: 'provider-1',
        serviceId: 'haircut-service',
        scheduledDate: new Date('2024-08-15T14:00:00Z'),
        duration: 2,
        totalAmount: 30.0,
        platformFee: 3.0,
        description: 'Please arrive 10 minutes early',
        address: '123 Test Street, Test City',
        status: 'PENDING'
      }

      const mockProposal = {
        id: 'proposal-1',
        bookingId: 'booking-1',
        providerId: 'provider-1',
        status: 'PENDING',
        message: 'Job offer sent by client'
      }

      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider)
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      mockPrisma.proposal.create.mockResolvedValue(mockProposal)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.booking).toEqual(mockBooking)
      expect(data.message).toBe('Job offer sent successfully! Provider will respond within 2 hours.')

      // Verify Prisma calls
      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: {
          clientId: 'user-1',
          providerId: 'provider-1',
          serviceId: 'haircut-service',
          scheduledDate: new Date('2024-08-15T14:00:00Z'),
          duration: 2,
          totalAmount: 30.0,
          platformFee: 3.0,
          description: 'Please arrive 10 minutes early',
          address: '123 Test Street, Test City',
          status: 'PENDING'
        }
      })

      expect(mockPrisma.proposal.create).toHaveBeenCalledWith({
        data: {
          bookingId: 'booking-1',
          providerId: 'provider-1',
          status: 'PENDING',
          message: 'Job offer sent by client'
        }
      })
    })

    it('should handle optional notes field', async () => {
      const { getServerSession } = require('@/lib/auth')
      getServerSession.mockResolvedValue({
        id: 'user-1',
        role: 'CLIENT'
      })

      const requestWithoutNotes = new NextRequest('http://localhost:3000/api/book-service/send-offer', {
        method: 'POST',
        body: JSON.stringify({
          providerId: 'provider-1',
          serviceId: 'haircut-service',
          date: '2024-08-15',
          time: '14:00',
          address: '123 Test Street, Test City'
          // notes field omitted
        })
      })

      const mockProvider = {
        id: 'provider-1',
        businessName: 'Hair Studio Pro',
        available: true,
        status: 'APPROVED',
        services: [
          {
            serviceId: 'haircut-service',
            customRate: 30.0,
            service: {
              name: 'Haircut',
              description: 'Professional haircut and styling services',
              category: 'Beauty & Personal Care'
            }
          }
        ],
        bookings: []
      }

      const mockBooking = {
        id: 'booking-1',
        clientId: 'user-1',
        providerId: 'provider-1',
        serviceId: 'haircut-service',
        scheduledDate: new Date('2024-08-15T14:00:00Z'),
        duration: 2,
        totalAmount: 30.0,
        platformFee: 3.0,
        description: null, // No notes provided
        address: '123 Test Street, Test City',
        status: 'PENDING'
      }

      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider)
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      mockPrisma.proposal.create.mockResolvedValue({
        id: 'proposal-1',
        bookingId: 'booking-1',
        providerId: 'provider-1',
        status: 'PENDING',
        message: 'Job offer sent by client'
      })

      const response = await POST(requestWithoutNotes)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.booking.description).toBeNull()
    })
  })
}) 