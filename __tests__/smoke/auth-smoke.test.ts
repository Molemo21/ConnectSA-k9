import fetch from 'node-fetch'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Auth Smoke', () => {
  const email = `smoke_${Date.now()}@example.com`
  const password = 'Password123!'

  it('signs up a user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Smoke Test User' }),
    })
    expect(res.status).toBeLessThan(500)
  }, 30000)

  it('logs in the user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(res.status).toBeLessThan(500)
  }, 30000)
})


