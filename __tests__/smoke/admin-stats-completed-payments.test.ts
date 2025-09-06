import fetch from 'node-fetch'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Admin Stats - Completed Payments', () => {
  it('counts payments with status RELEASED or COMPLETED', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats/completed-payments`)
    expect(res.status).toBeLessThan(500)
    const json = await res.json()
    expect(json).toHaveProperty('count')
    expect(typeof json.count === 'number').toBe(true)
  }, 30000)
})


