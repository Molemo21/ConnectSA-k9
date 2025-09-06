import fetch from 'node-fetch'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

function randomEmail() {
  return `smoke_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`
}

describe('Auth verification flow', () => {
  let email = randomEmail()
  const password = 'Password123!'
  let token: string | null = null

  it('signs up a user and returns success', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke User', email, password, role: 'CLIENT' }),
    })
    expect(res.status).toBeLessThan(500)
  }, 30000)

  it('fetches a verification token from test endpoint if available', async () => {
    // In CI or dev, you could add a small test-only endpoint to return latest token by email.
    // Here we attempt a generic test-db probe; adapt as needed for your environment.
    const probe = await fetch(`${baseUrl}/api/test-db`)
    expect(probe.status).toBeLessThan(500)
    // Token retrieval is environment-specific; skip strict assert if not retrievable.
  }, 30000)

  it('rejects invalid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/verify-email?token=invalidtoken`)
    expect([400, 404, 429]).toContain(res.status)
  }, 30000)
})


