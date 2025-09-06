/**
 * Lightweight smoke tests for critical API flows
 * Run with: npx jest __tests__/smoke/api-smoke.test.ts
 */

import fetch from 'node-fetch'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('API Smoke', () => {
  it('diagnostics endpoint returns healthy/degraded', async () => {
    const res = await fetch(`${baseUrl}/api/connection/diagnostics`)
    expect(res.status).toBeLessThan(500)
    const json = await res.json()
    expect(['healthy', 'degraded', 'deploying']).toContain(json.status)
  })

  it('services endpoint returns array', async () => {
    const res = await fetch(`${baseUrl}/api/services`)
    expect(res.ok).toBe(true)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })
})


