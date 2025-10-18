import { test, expect } from '@playwright/test'

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin/dashboard')
  })

  test('should display admin dashboard correctly', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Check dashboard elements
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    await expect(page.locator('text=System Overview')).toBeVisible()
    await expect(page.locator('text=Total Users')).toBeVisible()
    await expect(page.locator('text=Total Bookings')).toBeVisible()
    await expect(page.locator('text=Total Revenue')).toBeVisible()
  })

  test('should display system statistics', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Check statistics cards
    await expect(page.locator('[data-testid="stat-card"]:has-text("27")')).toBeVisible() // Total Users
    await expect(page.locator('[data-testid="stat-card"]:has-text("45")')).toBeVisible() // Total Bookings
    await expect(page.locator('[data-testid="stat-card"]:has-text("R1,400")')).toBeVisible() // Total Revenue
    await expect(page.locator('[data-testid="stat-card"]:has-text("7")')).toBeVisible() // Total Providers
  })

  test('should manage user accounts', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Check users management page
    await expect(page.locator('text=User Management')).toBeVisible()
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible()
    
    // Check user actions
    const userRow = page.locator('[data-testid="user-row"]').first()
    await expect(userRow.locator('button:has-text("View")')).toBeVisible()
    await expect(userRow.locator('button:has-text("Edit")')).toBeVisible()
    await expect(userRow.locator('button:has-text("Suspend")')).toBeVisible()
  })

  test('should suspend user account', async ({ page }) => {
    await page.goto('/admin/users')
    
    const userRow = page.locator('[data-testid="user-row"]').first()
    
    // Click suspend button
    await userRow.click('button:has-text("Suspend")')
    
    // Should show confirmation dialog
    await expect(page.locator('text=Suspend User')).toBeVisible()
    await expect(page.locator('text=Are you sure you want to suspend this user?')).toBeVisible()
    
    // Add suspension reason
    await page.fill('textarea[name="reason"]', 'Violation of terms of service')
    
    // Confirm suspension
    await page.click('button:has-text("Yes, Suspend")')
    
    // Should show success message
    await expect(page.locator('text=User suspended successfully')).toBeVisible()
  })

  test('should manage provider applications', async ({ page }) => {
    await page.goto('/admin/providers')
    
    // Check providers management
    await expect(page.locator('text=Provider Management')).toBeVisible()
    await expect(page.locator('[data-testid="provider-table"]')).toBeVisible()
    
    // Check pending applications
    const pendingProvider = page.locator('[data-testid="provider-row"]:has-text("PENDING")').first()
    
    if (await pendingProvider.isVisible()) {
      await expect(pendingProvider.locator('button:has-text("Approve")')).toBeVisible()
      await expect(pendingProvider.locator('button:has-text("Reject")')).toBeVisible()
    }
  })

  test('should approve provider application', async ({ page }) => {
    await page.goto('/admin/providers')
    
    const pendingProvider = page.locator('[data-testid="provider-row"]:has-text("PENDING")').first()
    
    if (await pendingProvider.isVisible()) {
      // Click approve button
      await pendingProvider.click('button:has-text("Approve")')
      
      // Should show confirmation dialog
      await expect(page.locator('text=Approve Provider')).toBeVisible()
      
      // Add approval notes
      await page.fill('textarea[name="notes"]', 'All documents verified and approved')
      
      // Confirm approval
      await page.click('button:has-text("Yes, Approve")')
      
      // Should show success message
      await expect(page.locator('text=Provider approved successfully')).toBeVisible()
    }
  })

  test('should reject provider application', async ({ page }) => {
    await page.goto('/admin/providers')
    
    const pendingProvider = page.locator('[data-testid="provider-row"]:has-text("PENDING")').first()
    
    if (await pendingProvider.isVisible()) {
      // Click reject button
      await pendingProvider.click('button:has-text("Reject")')
      
      // Should show rejection form
      await expect(page.locator('text=Reject Provider Application')).toBeVisible()
      
      // Add rejection reason
      await page.fill('textarea[name="reason"]', 'Incomplete documentation')
      
      // Confirm rejection
      await page.click('button:has-text("Yes, Reject")')
      
      // Should show success message
      await expect(page.locator('text=Provider application rejected')).toBeVisible()
    }
  })

  test('should monitor all bookings', async ({ page }) => {
    await page.goto('/admin/bookings')
    
    // Check bookings management
    await expect(page.locator('text=Booking Management')).toBeVisible()
    await expect(page.locator('[data-testid="booking-table"]')).toBeVisible()
    
    // Check booking filters
    await expect(page.locator('select[name="status"]')).toBeVisible()
    await expect(page.locator('input[name="search"]')).toBeVisible()
    
    // Filter by status
    await page.selectOption('select[name="status"]', 'PENDING')
    
    // Should show only pending bookings
    const bookingRows = page.locator('[data-testid="booking-row"]')
    const count = await bookingRows.count()
    
    for (let i = 0; i < count; i++) {
      await expect(bookingRows.nth(i).locator('text=PENDING')).toBeVisible()
    }
  })

  test('should view booking details', async ({ page }) => {
    await page.goto('/admin/bookings')
    
    const bookingRow = page.locator('[data-testid="booking-row"]').first()
    
    // Click view details
    await bookingRow.click('button:has-text("View")')
    
    // Should show booking details modal
    await expect(page.locator('text=Booking Details')).toBeVisible()
    await expect(page.locator('text=Client Information')).toBeVisible()
    await expect(page.locator('text=Provider Information')).toBeVisible()
    await expect(page.locator('text=Service Details')).toBeVisible()
    await expect(page.locator('text=Payment Information')).toBeVisible()
  })

  test('should manage payments and refunds', async ({ page }) => {
    await page.goto('/admin/payments')
    
    // Check payments management
    await expect(page.locator('text=Payment Management')).toBeVisible()
    await expect(page.locator('[data-testid="payment-table"]')).toBeVisible()
    
    // Check payment actions
    const paymentRow = page.locator('[data-testid="payment-row"]').first()
    await expect(paymentRow.locator('button:has-text("View")')).toBeVisible()
    await expect(paymentRow.locator('button:has-text("Refund")')).toBeVisible()
  })

  test('should process refund', async ({ page }) => {
    await page.goto('/admin/payments')
    
    const paymentRow = page.locator('[data-testid="payment-row"]:has-text("SUCCESS")').first()
    
    if (await paymentRow.isVisible()) {
      // Click refund button
      await paymentRow.click('button:has-text("Refund")')
      
      // Should show refund form
      await expect(page.locator('text=Process Refund')).toBeVisible()
      
      // Add refund reason
      await page.fill('textarea[name="reason"]', 'Service not provided as promised')
      
      // Select refund amount
      await page.check('input[name="refundType"][value="full"]')
      
      // Process refund
      await page.click('button:has-text("Process Refund")')
      
      // Should show success message
      await expect(page.locator('text=Refund processed successfully')).toBeVisible()
    }
  })

  test('should view system analytics', async ({ page }) => {
    await page.goto('/admin/analytics')
    
    // Check analytics dashboard
    await expect(page.locator('text=System Analytics')).toBeVisible()
    await expect(page.locator('text=Revenue Trends')).toBeVisible()
    await expect(page.locator('text=Booking Statistics')).toBeVisible()
    await expect(page.locator('text=User Growth')).toBeVisible()
    
    // Check charts are rendered
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="bookings-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="users-chart"]')).toBeVisible()
  })

  test('should manage system settings', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // Check settings page
    await expect(page.locator('text=System Settings')).toBeVisible()
    await expect(page.locator('text=Platform Configuration')).toBeVisible()
    
    // Check setting categories
    await expect(page.locator('text=Payment Settings')).toBeVisible()
    await expect(page.locator('text=Email Settings')).toBeVisible()
    await expect(page.locator('text=Security Settings')).toBeVisible()
    
    // Update platform fee
    await page.fill('input[name="platformFee"]', '12')
    await page.click('button:has-text("Save Settings")')
    
    // Should show success message
    await expect(page.locator('text=Settings updated successfully')).toBeVisible()
  })

  test('should handle system maintenance', async ({ page }) => {
    await page.goto('/admin/maintenance')
    
    // Check maintenance page
    await expect(page.locator('text=System Maintenance')).toBeVisible()
    
    // Check maintenance options
    await expect(page.locator('button:has-text("Clear Cache")')).toBeVisible()
    await expect(page.locator('button:has-text("Optimize Database")')).toBeVisible()
    await expect(page.locator('button:has-text("Backup Data")')).toBeVisible()
    
    // Perform cache clear
    await page.click('button:has-text("Clear Cache")')
    
    // Should show confirmation
    await expect(page.locator('text=Clear System Cache')).toBeVisible()
    await page.click('button:has-text("Yes, Clear Cache")')
    
    // Should show success message
    await expect(page.locator('text=Cache cleared successfully')).toBeVisible()
  })

  test('should view audit logs', async ({ page }) => {
    await page.goto('/admin/audit-logs')
    
    // Check audit logs page
    await expect(page.locator('text=Audit Logs')).toBeVisible()
    await expect(page.locator('[data-testid="audit-table"]')).toBeVisible()
    
    // Check log filters
    await expect(page.locator('select[name="action"]')).toBeVisible()
    await expect(page.locator('input[name="user"]')).toBeVisible()
    await expect(page.locator('input[name="dateFrom"]')).toBeVisible()
    
    // Filter by action
    await page.selectOption('select[name="action"]', 'LOGIN')
    
    // Should show only login actions
    const logRows = page.locator('[data-testid="log-row"]')
    const count = await logRows.count()
    
    for (let i = 0; i < count; i++) {
      await expect(logRows.nth(i).locator('text=LOGIN')).toBeVisible()
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/admin/dashboard')
    
    // Check mobile layout
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    await expect(page.locator('[data-testid="stat-card"]')).toBeVisible()
    
    // Test mobile navigation
    await page.click('button:has-text("Menu")')
    await expect(page.locator('text=User Management')).toBeVisible()
    await expect(page.locator('text=Provider Management')).toBeVisible()
  })

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Select multiple users
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    
    if (count > 1) {
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()
      
      // Should show bulk actions
      await expect(page.locator('button:has-text("Bulk Actions")')).toBeVisible()
      
      // Click bulk actions
      await page.click('button:has-text("Bulk Actions")')
      
      // Should show bulk action options
      await expect(page.locator('button:has-text("Suspend Selected")')).toBeVisible()
      await expect(page.locator('button:has-text("Export Selected")')).toBeVisible()
    }
  })
})
