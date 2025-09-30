import '@testing-library/jest-dom'

// Polyfill web Fetch API classes for node environment
// Simple polyfills for testing
// @ts-ignore
global.Headers = global.Headers || class Headers {
  constructor(init?: any) {
    this.headers = new Map()
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers.set(key, value))
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.headers.set(key, value))
      }
    }
  }
  get(name: string) { return this.headers.get(name) }
  set(name: string, value: string) { this.headers.set(name, value) }
  has(name: string) { return this.headers.has(name) }
  delete(name: string) { this.headers.delete(name) }
  forEach(callback: any) { this.headers.forEach(callback) }
}

// @ts-ignore
global.Request = global.Request || class Request {
  constructor(input: any, init?: any) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers)
    this.body = init?.body
  }
}

// @ts-ignore
global.Response = global.Response || class Response {
  constructor(body?: any, init?: any) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Headers(init?.headers)
    this.ok = this.status >= 200 && this.status < 300
  }
  async json() { return JSON.parse(this.body) }
  async text() { return this.body }
  async blob() { return new Blob([this.body]) }
}

// Remove custom Request mock since we polyfill above

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', props)
  },
}))

// Mock NextResponse for API route unit tests (node environment)
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init?: { status?: number; headers?: Record<string, string> }) => ({
        status: init?.status ?? 200,
        headers: new Headers(init?.headers ?? {}),
        json: async () => body,
      }),
    },
  }
})

// Mock Paystack helpers by default for unit tests
jest.mock('@/lib/paystack', () => ({
  __esModule: true,
  paystackClient: {
    initializePayment: jest.fn(),
  },
  PAYMENT_CONSTANTS: {
    AUTO_CONFIRMATION_DAYS: 3,
  },
  paymentProcessor: {
    calculatePaymentBreakdown: jest.fn((serviceAmount: number, platformFeePercentage: number) => {
      const feeRate = platformFeePercentage <= 1 ? platformFeePercentage : platformFeePercentage / 100
      const platformFee = Math.round(serviceAmount * feeRate)
      const escrowAmount = serviceAmount - platformFee
      return { serviceAmount, platformFee, escrowAmount, totalAmount: serviceAmount }
    }),
    validateWebhookSignature: jest.fn(() => true),
    generateReference: jest.fn((prefix: string) => {
      const random = Math.random().toString(36).slice(2, 10)
      const ts = Date.now()
      return `${prefix}_${ts}_${random}`
    }),
  },
}))

// Mock auth utilities with controllable spies
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getCurrentUser: jest.fn(async () => null),
  requireUserRole: jest.fn(async () => { throw new Error('Unauthorized') }),
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch globally (Node environment)
if (!global.fetch) {
  // @ts-ignore
  global.fetch = jest.fn(async (input: any, init?: any) => {
    // Simple route stubs for component tests
    if (typeof input === 'string' && input.includes('/api/book-service/discover-providers')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          providers: [
            {
              id: 'provider-1',
              businessName: 'Hair Studio Pro',
              description: 'Professional haircut and styling services with years of experience',
              experience: 5,
              location: 'Test City, Test State',
              hourlyRate: 30,
              user: { name: 'Jane Doe', email: 'jane@example.com', avatar: '' },
              service: { name: 'Haircut', description: 'Haircut', category: 'Beauty & Personal Care' },
              averageRating: 4,
              totalReviews: 2,
              completedJobs: 150,
              recentReviews: [
                { id: 'r1', rating: 5, comment: 'Excellent service! Very professional and skilled.', client: { name: 'Sarah M.' }, createdAt: new Date().toISOString() },
                { id: 'r2', rating: 3, comment: 'Great haircut, friendly service.', client: { name: 'Mike R.' }, createdAt: new Date().toISOString() },
              ],
              isAvailable: true,
            },
            {
              id: 'provider-2',
              businessName: 'Barber Hub',
              description: 'Clean fades and classic cuts',
              experience: 3,
              location: 'Test City, Test State',
              hourlyRate: 25,
              user: { name: 'John Smith', email: 'john@example.com', avatar: '' },
              service: { name: 'Haircut', description: 'Haircut', category: 'Beauty & Personal Care' },
              averageRating: 4,
              totalReviews: 10,
              completedJobs: 90,
              recentReviews: [],
              isAvailable: true,
            },
          ],
          totalCount: 2,
        }),
        headers: new Headers(),
      } as any
    }
    if (typeof input === 'string' && input.includes('/api/book-service/send-offer')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ message: 'Offer sent successfully' }),
        headers: new Headers(),
      } as any
    }
    // Default mock response
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: new Headers(),
    } as any
  })
}

// Suppress console warnings during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
}) 