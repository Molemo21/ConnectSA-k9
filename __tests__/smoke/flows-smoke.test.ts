/**
 * Stubbed E2E-ish smoke tests for core flows using HTTP only.
 * Replace with Playwright for true browser E2E if needed.
 */

import fetch from 'node-fetch'

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Flows Smoke', () => {
  it('can fetch services and choose one id', async () => {
    const res = await fetch(`${baseUrl}/api/services`)
    expect(res.ok).toBe(true)
    const services = await res.json()
    const serviceId = services[0]?.id
    expect(serviceId).toBeTruthy()
  }, 30000)
})


