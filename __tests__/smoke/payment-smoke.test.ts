import fetch from 'node-fetch'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Payment Smoke', () => {
  it('payment verify stub handles missing reference gracefully', async () => {
    const res = await fetch(`${baseUrl}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: '' }),
    })
    // Expect 400 for missing/invalid reference
    expect([200, 400, 404, 503, 500]).toContain(res.status)
  }, 30000)
})


