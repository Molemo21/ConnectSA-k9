import { test, expect } from '@playwright/test'

test.describe('Provider Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as provider
    await page.goto('/login')
    await page.fill('input[type="email"]', 'thabangnakin17@gmail.com')
    await page.fill('input[type="password"]', 'Thabang17')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
  })

  test('should display provider dashboard correctly', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    // Check dashboard elements
    await expect(page.locator('text=Provider Dashboard')).toBeVisible()
    await expect(page.locator('text=Thabang Nakin')).toBeVisible()
    await expect(page.locator('text=My Bookings')).toBeVisible()
    await expect(page.locator('text=Earnings')).toBeVisible()
  })

  test('should display incoming booking requests', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    // Check for pending bookings
    const pendingBookings = page.locator('[data-testid="booking-card"]:has-text("PENDING")')
    
    if (await pendingBookings.count() > 0) {
      await expect(pendingBookings.first()).toBeVisible()
      await expect(pendingBookings.first().locator('button:has-text("Accept")')).toBeVisible()
      await expect(pendingBookings.first().locator('button:has-text("Decline")')).toBeVisible()
    }
  })

  test('should accept booking request', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    const pendingBooking = page.locator('[data-testid="booking-card"]:has-text("PENDING")').first()
    
    if (await pendingBooking.isVisible()) {
      // Click accept button
      await pendingBooking.click('button:has-text("Accept")')
      
      // Should show confirmation dialog
      await expect(page.locator('text=Accept Booking')).toBeVisible()
      await expect(page.locator('text=Are you sure you want to accept this booking?')).toBeVisible()
      
      // Confirm acceptance
      await page.click('button:has-text("Yes, Accept")')
      
      // Should show success message
      await expect(page.locator('text=Booking accepted successfully')).toBeVisible()
      
      // Booking status should change to CONFIRMED
      await expect(pendingBooking.locator('[data-testid="status-badge"]:has-text("CONFIRMED")')).toBeVisible()
    }
  })

  test('should decline booking request', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    const pendingBooking = page.locator('[data-testid="booking-card"]:has-text("PENDING")').first()
    
    if (await pendingBooking.isVisible()) {
      // Click decline button
      await pendingBooking.click('button:has-text("Decline")')
      
      // Should show confirmation dialog
      await expect(page.locator('text=Decline Booking')).toBeVisible()
      
      // Add decline reason
      await page.fill('textarea[name="reason"]', 'Not available at this time')
      
      // Confirm decline
      await page.click('button:has-text("Yes, Decline")')
      
      // Should show success message
      await expect(page.locator('text=Booking declined')).toBeVisible()
    }
  })

  test('should start service for confirmed booking', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      // Click start service button
      await confirmedBooking.click('button:has-text("Start Service")')
      
      // Should show confirmation
      await expect(page.locator('text=Start Service')).toBeVisible()
      
      // Confirm start
      await page.click('button:has-text("Yes, Start")')
      
      // Should show success message
      await expect(page.locator('text=Service started')).toBeVisible()
      
      // Status should change to IN_PROGRESS
      await expect(confirmedBooking.locator('[data-testid="status-badge"]:has-text("IN_PROGRESS")')).toBeVisible()
    }
  })

  test('should complete service', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    const inProgressBooking = page.locator('[data-testid="booking-card"]:has-text("IN_PROGRESS")').first()
    
    if (await inProgressBooking.isVisible()) {
      // Click complete service button
      await inProgressBooking.click('button:has-text("Complete Service")')
      
      // Should show completion form
      await expect(page.locator('text=Complete Service')).toBeVisible()
      
      // Add completion notes
      await page.fill('textarea[name="notes"]', 'Service completed successfully')
      
      // Upload completion photo (if available)
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.isVisible()) {
        // Mock file upload
        await fileInput.setInputFiles({
          name: 'completion.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data')
        })
      }
      
      // Submit completion
      await page.click('button:has-text("Submit Completion")')
      
      // Should show success message
      await expect(page.locator('text=Service completed successfully')).toBeVisible()
      
      // Status should change to AWAITING_CONFIRMATION
      await expect(inProgressBooking.locator('[data-testid="status-badge"]:has-text("AWAITING_CONFIRMATION")')).toBeVisible()
    }
  })

  test('should view earnings and statistics', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    // Click on earnings section
    await page.click('text=Earnings')
    
    // Should show earnings dashboard
    await expect(page.locator('text=Earnings Overview')).toBeVisible()
    await expect(page.locator('text=Total Earnings')).toBeVisible()
    await expect(page.locator('text=This Month')).toBeVisible()
    await expect(page.locator('text=Pending Payments')).toBeVisible()
  })

  test('should update profile information', async ({ page }) => {
    await page.goto('/provider/profile')
    
    // Check profile form
    await expect(page.locator('text=Profile Settings')).toBeVisible()
    await expect(page.locator('input[name="businessName"]')).toBeVisible()
    await expect(page.locator('input[name="hourlyRate"]')).toBeVisible()
    
    // Update business name
    await page.fill('input[name="businessName"]', 'Updated Business Name')
    
    // Save changes
    await page.click('button:has-text("Save Changes")')
    
    // Should show success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
  })

  test('should manage service offerings', async ({ page }) => {
    await page.goto('/provider/services')
    
    // Check services management
    await expect(page.locator('text=My Services')).toBeVisible()
    
    // Add new service
    await page.click('button:has-text("Add Service")')
    
    // Fill service form
    await page.selectOption('select[name="serviceId"]', 'c1cebfd1-7656-47c6-9203-7cf0164bd705')
    await page.fill('input[name="hourlyRate"]', '200')
    await page.fill('textarea[name="description"]', 'Professional carpet cleaning service')
    
    // Save service
    await page.click('button:has-text("Add Service")')
    
    // Should show success message
    await expect(page.locator('text=Service added successfully')).toBeVisible()
  })

  test('should handle booking conflicts', async ({ page }) => {
    await page.goto('/provider/dashboard')
    
    // Try to accept conflicting booking
    const conflictingBooking = page.locator('[data-testid="booking-card"]:has-text("PENDING")').first()
    
    if (await conflictingBooking.isVisible()) {
      await conflictingBooking.click('button:has-text("Accept")')
      
      // Mock conflict response
      await page.route('**/api/book-service/*/accept', route => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Provider has a conflicting booking at this time'
          })
        })
      })
      
      await page.click('button:has-text("Yes, Accept")')
      
      // Should show conflict error
      await expect(page.locator('text=Provider has a conflicting booking at this time')).toBeVisible()
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/provider/dashboard')
    
    // Check mobile layout
    await expect(page.locator('text=Provider Dashboard')).toBeVisible()
    await expect(page.locator('[data-testid="booking-card"]')).toBeVisible()
    
    // Test mobile booking actions
    const pendingBooking = page.locator('[data-testid="booking-card"]:has-text("PENDING")').first()
    
    if (await pendingBooking.isVisible()) {
      await pendingBooking.click('button:has-text("Accept")')
      await expect(page.locator('text=Accept Booking')).toBeVisible()
    }
  })
})
