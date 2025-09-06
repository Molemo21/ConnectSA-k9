/**
 * Comprehensive smoke test for signup and email verification flow
 * Tests the complete user journey from signup to email verification
 */

import fetch from 'node-fetch'
import { prisma } from '@/lib/prisma'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

function generateTestEmail() {
  return `smoke_test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`
}

describe('Signup and Email Verification Flow', () => {
  let testEmail: string
  let testPassword: string
  let testName: string
  let verificationToken: string | null = null

  beforeAll(async () => {
    testEmail = generateTestEmail()
    testPassword = 'TestPassword123!'
    testName = 'Smoke Test User'
  })

  afterAll(async () => {
    // Cleanup: Remove test user if it exists
    try {
      await prisma.user.deleteMany({
        where: {
          email: testEmail
        }
      })
    } catch (error) {
      console.warn('Failed to cleanup test user:', error)
    }
  })

  describe('User Signup', () => {
    it('should successfully create a new client user', async () => {
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          password: testPassword,
          role: 'CLIENT'
        }),
      })

      expect(response.status).toBeLessThan(500)
      
      const data = await response.json()
      expect(data.message).toContain('successfully')
      
      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      
      expect(user).toBeTruthy()
      expect(user?.name).toBe(testName)
      expect(user?.email).toBe(testEmail)
      expect(user?.role).toBe('CLIENT')
      expect(user?.emailVerified).toBe(false)
    }, 30000)

    it('should create a verification token for the new user', async () => {
      const token = await prisma.verificationToken.findFirst({
        where: {
          user: {
            email: testEmail
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      expect(token).toBeTruthy()
      expect(token?.token).toBeTruthy()
      expect(token?.expires).toBeTruthy()
      
      // Store token for verification test
      verificationToken = token?.token || null
    }, 30000)

    it('should send verification email (mocked in development)', async () => {
      // In development, emails are logged to console instead of sent
      // This test verifies the endpoint doesn't fail
      const response = await fetch(`${baseUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail
        }),
      })

      expect(response.status).toBeLessThan(500)
      
      const data = await response.json()
      expect(data.message).toContain('sent successfully')
    }, 30000)
  })

  describe('Email Verification', () => {
    it('should reject invalid verification token', async () => {
      const response = await fetch(`${baseUrl}/api/auth/verify-email?token=invalid_token_123`)
      
      expect([400, 404, 429]).toContain(response.status)
      
      const data = await response.json()
      expect(data.error).toBeTruthy()
    }, 30000)

    it('should successfully verify email with valid token', async () => {
      if (!verificationToken) {
        throw new Error('No verification token available from signup test')
      }

      const response = await fetch(`${baseUrl}/api/auth/verify-email?token=${verificationToken}`)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.message).toContain('verified successfully')

      // Verify user emailVerified status was updated
      const user = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      
      expect(user?.emailVerified).toBe(true)
    }, 30000)

    it('should reject already used verification token', async () => {
      if (!verificationToken) {
        throw new Error('No verification token available from signup test')
      }

      const response = await fetch(`${baseUrl}/api/auth/verify-email?token=${verificationToken}`)
      
      expect([400, 404]).toContain(response.status)
      
      const data = await response.json()
      expect(data.error).toBeTruthy()
    }, 30000)
  })

  describe('Login After Verification', () => {
    it('should successfully login verified user', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        }),
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.token).toBeTruthy()
      expect(data.user).toBeTruthy()
      expect(data.user.email).toBe(testEmail)
      expect(data.user.emailVerified).toBe(true)
    }, 30000)

    it('should reject login with wrong password', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword123!'
        }),
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toBeTruthy()
    }, 30000)
  })

  describe('Provider Signup Flow', () => {
    let providerEmail: string

    beforeAll(() => {
      providerEmail = generateTestEmail()
    })

    afterAll(async () => {
      // Cleanup provider user
      try {
        await prisma.user.deleteMany({
          where: {
            email: providerEmail
          }
        })
      } catch (error) {
        console.warn('Failed to cleanup provider user:', error)
      }
    })

    it('should create provider user with incomplete status', async () => {
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Provider Test User',
          email: providerEmail,
          password: testPassword,
          role: 'PROVIDER'
        }),
      })

      expect(response.status).toBeLessThan(500)
      
      const data = await response.json()
      expect(data.message).toContain('successfully')

      // Verify provider profile was created
      const user = await prisma.user.findUnique({
        where: { email: providerEmail },
        include: { provider: true }
      })
      
      expect(user).toBeTruthy()
      expect(user?.role).toBe('PROVIDER')
      expect(user?.provider).toBeTruthy()
      expect(user?.provider?.status).toBe('INCOMPLETE')
    }, 30000)
  })

  describe('Error Handling', () => {
    it('should reject signup with existing email', async () => {
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Another User',
          email: testEmail, // Using already created email
          password: testPassword,
          role: 'CLIENT'
        }),
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeTruthy()
    }, 30000)

    it('should reject signup with invalid data', async () => {
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Invalid: empty name
          email: 'invalid-email', // Invalid: not an email
          password: '123', // Invalid: too short
          role: 'CLIENT'
        }),
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeTruthy()
    }, 30000)

    it('should reject login with non-existent email', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: testPassword
        }),
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toBeTruthy()
    }, 30000)
  })
})
