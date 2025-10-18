import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should navigate to service booking page', async ({ page }) => {
    // Click on "Book Service" button
    await page.click('text=Book Service')
    
    // Should navigate to booking page
    await page.waitForURL('/book-service')
    
    // Check if booking form is visible
    await expect(page.locator('text=Book a Service')).toBeVisible()
  })

  test('should display service categories', async ({ page }) => {
    await page.goto('/book-service')
    
    // Check if service categories are displayed
    await expect(page.locator('text=Cleaning Services')).toBeVisible()
    await expect(page.locator('text=Home Services')).toBeVisible()
    
    // Check if individual services are shown
    await expect(page.locator('text=Carpet Cleaning')).toBeVisible()
    await expect(page.locator('text=House Cleaning')).toBeVisible()
  })

  test('should select a service and proceed to booking form', async ({ page }) => {
    await page.goto('/book-service')
    
    // Click on Carpet Cleaning service
    await page.click('text=Carpet Cleaning')
    
    // Should show booking form
    await expect(page.locator('text=Book Carpet Cleaning')).toBeVisible()
    await expect(page.locator('input[name="date"]')).toBeVisible()
    await expect(page.locator('input[name="time"]')).toBeVisible()
    await expect(page.locator('textarea[name="address"]')).toBeVisible()
  })

  test('should validate booking form fields', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Try to submit empty form
    await page.click('button:has-text("Find Providers")')
    
    // Check for validation errors
    await expect(page.locator('text=Date is required')).toBeVisible()
    await expect(page.locator('text=Time is required')).toBeVisible()
    await expect(page.locator('text=Address is required')).toBeVisible()
  })

  test('should validate date selection', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Try to select past date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const pastDate = yesterday.toISOString().split('T')[0]
    
    await page.fill('input[name="date"]', pastDate)
    await page.click('button:has-text("Find Providers")')
    
    // Should show error for past date
    await expect(page.locator('text=Please select a future date')).toBeVisible()
  })

  test('should validate time selection', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Select valid date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[name="date"]', futureDate)
    await page.fill('input[name="time"]', '25:00') // Invalid time
    await page.click('button:has-text("Find Providers")')
    
    // Should show error for invalid time
    await expect(page.locator('text=Please select a valid time')).toBeVisible()
  })

  test('should find available providers', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Fill booking form
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[name="date"]', futureDate)
    await page.fill('input[name="time"]', '14:00')
    await page.fill('textarea[name="address"]', '123 Test Street, Cape Town')
    await page.fill('textarea[name="notes"]', 'Test booking')
    
    await page.click('button:has-text("Find Providers")')
    
    // Should show available providers
    await expect(page.locator('text=Available Providers')).toBeVisible()
    await expect(page.locator('[data-testid="provider-card"]')).toBeVisible()
  })

  test('should display provider information correctly', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Fill form and find providers
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[name="date"]', futureDate)
    await page.fill('input[name="time"]', '14:00')
    await page.fill('textarea[name="address"]', '123 Test Street, Cape Town')
    await page.click('button:has-text("Find Providers")')
    
    // Check provider card content
    const providerCard = page.locator('[data-testid="provider-card"]').first()
    await expect(providerCard.locator('text=John\'s services')).toBeVisible()
    await expect(providerCard.locator('text=Thabang Nakin')).toBeVisible()
    await expect(providerCard.locator('text=R150/hour')).toBeVisible()
    await expect(providerCard.locator('text=4 completed jobs')).toBeVisible()
  })

  test('should send booking offer to provider', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Fill form and find providers
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[name="date"]', futureDate)
    await page.fill('input[name="time"]', '14:00')
    await page.fill('textarea[name="address"]', '123 Test Street, Cape Town')
    await page.fill('textarea[name="notes"]', 'Test booking offer')
    await page.click('button:has-text("Find Providers")')
    
    // Select first provider
    await page.click('[data-testid="provider-card"]:first-child button:has-text("Select")')
    
    // Should show confirmation dialog
    await expect(page.locator('text=Send Booking Offer')).toBeVisible()
    await expect(page.locator('text=Are you sure you want to send this booking offer?')).toBeVisible()
    
    // Confirm the offer
    await page.click('button:has-text("Send Offer")')
    
    // Should show success message
    await expect(page.locator('text=Booking offer sent successfully')).toBeVisible()
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('should track booking status', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check if bookings are displayed
    await expect(page.locator('text=My Bookings')).toBeVisible()
    
    // Check booking status
    const bookingCard = page.locator('[data-testid="booking-card"]').first()
    await expect(bookingCard).toBeVisible()
    
    // Check status badge
    await expect(bookingCard.locator('[data-testid="status-badge"]')).toBeVisible()
  })

  test('should allow booking cancellation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Find a pending booking
    const pendingBooking = page.locator('[data-testid="booking-card"]:has-text("PENDING")').first()
    
    if (await pendingBooking.isVisible()) {
      // Click cancel button
      await pendingBooking.click('button:has-text("Cancel")')
      
      // Confirm cancellation
      await page.click('button:has-text("Yes, Cancel")')
      
      // Should show success message
      await expect(page.locator('text=Booking cancelled successfully')).toBeVisible()
    }
  })

  test('should handle booking conflicts', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Try to book at a time when provider is already booked
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[name="date"]', futureDate)
    await page.fill('input[name="time"]', '10:00') // Time that might conflict
    await page.fill('textarea[name="address"]', '123 Test Street, Cape Town')
    await page.click('button:has-text("Find Providers")')
    
    // Should show no available providers or conflict message
    await expect(page.locator('text=No providers available')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/book-service')
    
    // Check if booking form is usable on mobile
    await expect(page.locator('text=Carpet Cleaning')).toBeVisible()
    
    await page.click('text=Carpet Cleaning')
    
    // Check mobile form layout
    await expect(page.locator('input[name="date"]')).toBeVisible()
    await expect(page.locator('input[name="time"]')).toBeVisible()
    await expect(page.locator('textarea[name="address"]')).toBeVisible()
  })

  test('should handle network errors during booking', async ({ page }) => {
    await page.goto('/book-service')
    await page.click('text=Carpet Cleaning')
    
    // Mock network failure
    await page.route('**/api/book-service/discover-providers', route => route.abort())
    
    // Fill form and try to find providers
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[name="date"]', futureDate)
    await page.fill('input[name="time"]', '14:00')
    await page.fill('textarea[name="address"]', '123 Test Street, Cape Town')
    await page.click('button:has-text("Find Providers")')
    
    // Should show error message
    await expect(page.locator('text=Failed to find providers. Please try again.')).toBeVisible()
  })
})
