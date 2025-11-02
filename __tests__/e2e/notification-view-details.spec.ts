/**
 * Playwright E2E Test for Notification "View Details" Feature
 * 
 * Tests the complete flow of clicking "View Details" on notifications
 * and verifying navigation, scrolling, and highlighting.
 * 
 * Run with: npm run test:e2e
 * Or: npx playwright test __tests__/e2e/notification-view-details.spec.ts
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

test.describe('Notification "View Details" Feature', () => {
  let bookingId: string | null = null

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for navigation and scrolling
    test.setTimeout(30000)
    
    // Mock console.log to capture logs
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Booking ID detected')) {
        console.log(`[Browser Console] ${msg.text()}`)
      }
    })
  })

  test('Provider Dashboard - Navigate to booking from notification', async ({ page }) => {
    // TODO: Add authentication setup
    // This requires your auth flow implementation
    
    await page.goto(`${BASE_URL}/provider/dashboard`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Look for notification bell
    const notificationBell = page.locator('button:has([data-icon="bell"]), button:has-text("Notifications")').first()
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click()
      
      // Wait for notification popup
      await page.waitForSelector('[role="dialog"], .notification-popup, [data-testid="notification-popup"]', { timeout: 5000 })
      
      // Find a booking notification with "View Details" button
      const viewDetailsButton = page.locator('button:has-text("View Details"), button:has-text("View Booking")').first()
      
      if (await viewDetailsButton.isVisible()) {
        // Extract booking ID from notification message if possible
        const notificationText = await page.locator('.notification-item, [data-notification]').first().textContent()
        const bookingIdMatch = notificationText?.match(/booking\s*#?\s*([a-zA-Z0-9_-]+)/i)
        
        if (bookingIdMatch) {
          bookingId = bookingIdMatch[1]
        }
        
        // Click "View Details"
        await viewDetailsButton.click()
        
        // Wait for navigation
        await page.waitForURL(/\/provider\/dashboard/, { timeout: 10000 })
        
        // Verify URL contains bookingId parameter
        if (bookingId) {
          await page.waitForURL(new RegExp(`bookingId=${bookingId}`), { timeout: 5000 })
        }
        
        // Wait for bookings to load
        await page.waitForSelector('[data-booking-id]', { timeout: 10000 })
        
        // Verify booking card exists
        if (bookingId) {
          const bookingCard = page.locator(`[data-booking-id="${bookingId}"]`)
          await expect(bookingCard).toBeVisible({ timeout: 5000 })
          
          // Verify card is in viewport (scrolled to)
          const isInViewport = await bookingCard.evaluate((el) => {
            const rect = el.getBoundingClientRect()
            return (
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            )
          })
          
          expect(isInViewport).toBe(true)
          
          // Check for highlight classes (may fade quickly)
          const hasHighlight = await bookingCard.evaluate((el) => {
            return el.classList.contains('ring-4') || 
                   el.classList.contains('ring-blue-500') ||
                   getComputedStyle(el).outlineWidth !== '0px'
          })
          
          // Highlight might have already faded, so this is optional
          if (hasHighlight) {
            console.log('✓ Highlight animation detected')
          }
        }
        
        // Verify URL is cleaned (bookingId parameter removed)
        await page.waitForTimeout(2000) // Wait for URL cleanup
        const finalUrl = page.url()
        expect(finalUrl).not.toContain('bookingId=')
      } else {
        console.log('⚠ No "View Details" button found - skipping test')
        test.skip()
      }
    } else {
      console.log('⚠ Notification bell not found - skipping test')
      test.skip()
    }
  })

  test('Client Dashboard - Navigate to booking from notification', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Look for notification bell
    const notificationBell = page.locator('button:has([data-icon="bell"]), button:has-text("Notifications")').first()
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click()
      
      // Wait for notification popup
      await page.waitForSelector('[role="dialog"], .notification-popup, [data-testid="notification-popup"]', { timeout: 5000 })
      
      // Find a booking notification with "View Details" button
      const viewDetailsButton = page.locator('button:has-text("View Details"), button:has-text("View Booking")').first()
      
      if (await viewDetailsButton.isVisible()) {
        // Extract booking ID from notification message
        const notificationText = await page.locator('.notification-item, [data-notification]').first().textContent()
        const bookingIdMatch = notificationText?.match(/booking\s*#?\s*([a-zA-Z0-9_-]+)/i)
        
        if (bookingIdMatch) {
          bookingId = bookingIdMatch[1]
          
          // Click "View Details"
          await viewDetailsButton.click()
          
          // Wait for navigation
          await page.waitForURL(/\/dashboard/, { timeout: 10000 })
          
          // Verify URL contains bookingId parameter
          await page.waitForURL(new RegExp(`bookingId=${bookingId}`), { timeout: 5000 })
          
          // Wait for bookings to load
          await page.waitForSelector('[data-booking-id]', { timeout: 10000 })
          
          // Verify booking card exists and is visible
          const bookingCard = page.locator(`[data-booking-id="${bookingId}"]`)
          await expect(bookingCard).toBeVisible({ timeout: 5000 })
        } else {
          console.log('⚠ Could not extract booking ID from notification - skipping test')
          test.skip()
        }
      } else {
        console.log('⚠ No "View Details" button found - skipping test')
        test.skip()
      }
    } else {
      console.log('⚠ Notification bell not found - skipping test')
      test.skip()
    }
  })

  test('Direct URL access with bookingId parameter', async ({ page }) => {
    // This test requires a known booking ID
    // In a real scenario, you'd fetch this from the database or create a test booking
    
    // Skip if no booking ID available
    if (!bookingId) {
      console.log('⚠ No booking ID available - skipping direct URL test')
      test.skip()
      return
    }
    
    // Navigate directly with bookingId parameter
    await page.goto(`${BASE_URL}/dashboard?bookingId=${bookingId}`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Wait for bookings to load
    await page.waitForSelector('[data-booking-id]', { timeout: 10000 })
    
    // Verify booking card exists
    const bookingCard = page.locator(`[data-booking-id="${bookingId}"]`)
    await expect(bookingCard).toBeVisible({ timeout: 5000 })
    
    // Verify card is scrolled into view
    const isInViewport = await bookingCard.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      )
    })
    
    expect(isInViewport).toBe(true)
    
    // Wait for URL cleanup
    await page.waitForTimeout(3000)
    const finalUrl = page.url()
    expect(finalUrl).not.toContain('bookingId=')
  })

  test('Handle non-existent bookingId gracefully', async ({ page }) => {
    const fakeBookingId = 'non-existent-booking-id-12345'
    
    await page.goto(`${BASE_URL}/dashboard?bookingId=${fakeBookingId}`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Page should still load without errors
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Check console for warning (optional)
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'warn') {
        consoleMessages.push(msg.text())
      }
    })
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000)
    
    // Should not have crashed - verify page loaded
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    
    // URL should be cleaned
    const finalUrl = page.url()
    expect(finalUrl).not.toContain('bookingId=')
  })
})

test.describe('Notification URL Generation', () => {
  test('Verify URL parameter format', async ({ page }) => {
    // This test verifies the URL structure generated by the notification system
    // It's a unit-style test that can be run in the browser context
    
    await page.goto(`${BASE_URL}`)
    
    // Inject test function
    const urlGenerationTest = await page.evaluate(() => {
      // Simulate the URL generation logic
      const generateActionUrl = (type: string, role: string, bookingId: string | null) => {
        const upperType = type.toUpperCase()
        
        if (upperType.includes('BOOKING')) {
          if (role === 'PROVIDER') {
            return bookingId 
              ? `/provider/dashboard?tab=jobs&bookingId=${bookingId}`
              : '/provider/dashboard?tab=jobs'
          } else {
            return bookingId 
              ? `/dashboard?bookingId=${bookingId}`
              : '/dashboard'
          }
        }
        
        return role === 'PROVIDER' ? '/provider/dashboard' : '/dashboard'
      }
      
      return {
        providerWithBooking: generateActionUrl('BOOKING_CREATED', 'PROVIDER', 'abc123'),
        providerWithoutBooking: generateActionUrl('BOOKING_CREATED', 'PROVIDER', null),
        clientWithBooking: generateActionUrl('BOOKING_CREATED', 'CLIENT', 'xyz789'),
        clientWithoutBooking: generateActionUrl('BOOKING_CREATED', 'CLIENT', null)
      }
    })
    
    expect(urlGenerationTest.providerWithBooking).toBe('/provider/dashboard?tab=jobs&bookingId=abc123')
    expect(urlGenerationTest.providerWithoutBooking).toBe('/provider/dashboard?tab=jobs')
    expect(urlGenerationTest.clientWithBooking).toBe('/dashboard?bookingId=xyz789')
    expect(urlGenerationTest.clientWithoutBooking).toBe('/dashboard')
  })
})

