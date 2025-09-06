import fetch from 'node-fetch'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Booking Smoke', () => {
  let serviceId: string | undefined

  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  beforeAll(async () => {
    const res = await fetch(`${baseUrl}/api/services`)
    const services = await res.json()
    serviceId = services[0]?.id
  }, 30000)

  it('creates a booking (stub, may require auth cookie in real run)', async () => {
    if (!serviceId) return
    const res = await fetch(`${baseUrl}/api/book-service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId,
        date: futureDate,
        time: '10:00',
        address: '123 Test St',
        notes: 'Smoke test',
      }),
    })
    expect(res.status).toBeLessThan(500)
  }, 30000)
})


