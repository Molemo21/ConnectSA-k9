import { validateBookingData, validateProviderData, validatePaymentData, validateUserData } from '@/lib/validation-utils'
import { z } from 'zod'

describe('Validation Utils', () => {
  describe('validateBookingData', () => {
    const validBookingData = {
      serviceId: 'c1cebfd1-7656-47c6-9203-7cf0164bd705',
      date: '2024-12-25',
      time: '14:00',
      address: '123 Test Street, Cape Town',
      notes: 'Test booking'
    }

    it('should validate correct booking data', () => {
      expect(() => validateBookingData(validBookingData)).not.toThrow()
    })

    it('should reject invalid service ID', () => {
      const invalidData = { ...validBookingData, serviceId: 'invalid-id' }
      expect(() => validateBookingData(invalidData)).toThrow()
    })

    it('should reject invalid date format', () => {
      const invalidData = { ...validBookingData, date: 'invalid-date' }
      expect(() => validateBookingData(invalidData)).toThrow()
    })

    it('should reject invalid time format', () => {
      const invalidData = { ...validBookingData, time: '25:00' }
      expect(() => validateBookingData(invalidData)).toThrow()
    })

    it('should reject empty address', () => {
      const invalidData = { ...validBookingData, address: '' }
      expect(() => validateBookingData(invalidData)).toThrow()
    })
  })

  describe('validateProviderData', () => {
    const validProviderData = {
      businessName: 'Test Business',
      location: 'Cape Town',
      hourlyRate: 150,
      services: ['c1cebfd1-7656-47c6-9203-7cf0164bd705'],
      description: 'Professional service provider'
    }

    it('should validate correct provider data', () => {
      expect(() => validateProviderData(validProviderData)).not.toThrow()
    })

    it('should reject negative hourly rate', () => {
      const invalidData = { ...validProviderData, hourlyRate: -50 }
      expect(() => validateProviderData(invalidData)).toThrow()
    })

    it('should reject empty business name', () => {
      const invalidData = { ...validProviderData, businessName: '' }
      expect(() => validateProviderData(invalidData)).toThrow()
    })

    it('should reject empty services array', () => {
      const invalidData = { ...validProviderData, services: [] }
      expect(() => validateProviderData(invalidData)).toThrow()
    })
  })

  describe('validatePaymentData', () => {
    const validPaymentData = {
      amount: 150,
      currency: 'ZAR',
      reference: 'PAY_123456789',
      callbackUrl: 'https://example.com/callback'
    }

    it('should validate correct payment data', () => {
      expect(() => validatePaymentData(validPaymentData)).not.toThrow()
    })

    it('should reject negative amount', () => {
      const invalidData = { ...validPaymentData, amount: -100 }
      expect(() => validatePaymentData(invalidData)).toThrow()
    })

    it('should reject invalid currency', () => {
      const invalidData = { ...validPaymentData, currency: 'INVALID' }
      expect(() => validatePaymentData(invalidData)).toThrow()
    })

    it('should reject invalid callback URL', () => {
      const invalidData = { ...validPaymentData, callbackUrl: 'not-a-url' }
      expect(() => validatePaymentData(invalidData)).toThrow()
    })
  })

  describe('validateUserData', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+27812345678',
      role: 'CLIENT'
    }

    it('should validate correct user data', () => {
      expect(() => validateUserData(validUserData)).not.toThrow()
    })

    it('should reject invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' }
      expect(() => validateUserData(invalidData)).toThrow()
    })

    it('should reject invalid phone', () => {
      const invalidData = { ...validUserData, phone: '123' }
      expect(() => validateUserData(invalidData)).toThrow()
    })

    it('should reject invalid role', () => {
      const invalidData = { ...validUserData, role: 'INVALID_ROLE' }
      expect(() => validateUserData(invalidData)).toThrow()
    })
  })
})
