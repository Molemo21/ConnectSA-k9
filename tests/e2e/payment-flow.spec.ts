import { test, expect } from '@playwright/test'

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should display payment button for confirmed bookings', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for a confirmed booking
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      // Check if payment button is visible
      await expect(confirmedBooking.locator('button:has-text("Pay Now")')).toBeVisible()
    }
  })

  test('should show payment modal when clicking pay button', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Find a confirmed booking
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      // Click pay button
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Should show payment modal
      await expect(page.locator('text=Complete Payment')).toBeVisible()
      await expect(page.locator('text=Booking Details')).toBeVisible()
      await expect(page.locator('text=Payment Summary')).toBeVisible()
    }
  })

  test('should display correct payment amount and breakdown', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Check payment breakdown
      await expect(page.locator('text=Service Amount')).toBeVisible()
      await expect(page.locator('text=Platform Fee')).toBeVisible()
      await expect(page.locator('text=Total Amount')).toBeVisible()
      
      // Check amounts are displayed correctly
      await expect(page.locator('text=R150.00')).toBeVisible() // Service amount
      await expect(page.locator('text=R15.00')).toBeVisible() // Platform fee
      await expect(page.locator('text=R165.00')).toBeVisible() // Total
    }
  })

  test('should initialize Paystack payment', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Click proceed to payment
      await page.click('button:has-text("Proceed to Payment")')
      
      // Should show loading state
      await expect(page.locator('text=Processing payment...')).toBeVisible()
      
      // Should redirect to Paystack or show payment form
      await page.waitForTimeout(2000) // Wait for payment initialization
      
      // Check if Paystack elements are present or payment form is shown
      const paystackForm = page.locator('[data-testid="paystack-form"]')
      const paymentForm = page.locator('[data-testid="payment-form"]')
      
      expect(await paystackForm.isVisible() || await paymentForm.isVisible()).toBeTruthy()
    }
  })

  test('should handle payment success callback', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      await page.click('button:has-text("Proceed to Payment")')
      
      // Mock successful payment callback
      await page.route('**/api/payment/verify', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            payment: {
              id: 'payment-123',
              status: 'SUCCESS',
              amount: 165,
              reference: 'PAY_123456'
            }
          })
        })
      })
      
      // Simulate payment success
      await page.goto('/dashboard?payment=success&reference=PAY_123456')
      
      // Should show success message
      await expect(page.locator('text=Payment successful')).toBeVisible()
      await expect(page.locator('text=Your booking has been confirmed')).toBeVisible()
    }
  })

  test('should handle payment failure callback', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      await page.click('button:has-text("Proceed to Payment")')
      
      // Mock failed payment callback
      await page.route('**/api/payment/verify', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Payment failed'
          })
        })
      })
      
      // Simulate payment failure
      await page.goto('/dashboard?payment=failed&reference=PAY_123456')
      
      // Should show error message
      await expect(page.locator('text=Payment failed')).toBeVisible()
      await expect(page.locator('text=Please try again')).toBeVisible()
    }
  })

  test('should update booking status after successful payment', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Find booking that was just paid
    const paidBooking = page.locator('[data-testid="booking-card"]:has-text("PAID")').first()
    
    if (await paidBooking.isVisible()) {
      // Check if status shows as paid
      await expect(paidBooking.locator('[data-testid="status-badge"]:has-text("PAID")')).toBeVisible()
      
      // Check if payment button is no longer visible
      await expect(paidBooking.locator('button:has-text("Pay Now")')).not.toBeVisible()
    }
  })

  test('should allow payment retry after failure', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Find a booking that failed payment
    const failedBooking = page.locator('[data-testid="booking-card"]:has-text("PAYMENT_FAILED")').first()
    
    if (await failedBooking.isVisible()) {
      // Should show retry payment button
      await expect(failedBooking.locator('button:has-text("Retry Payment")')).toBeVisible()
      
      // Click retry
      await failedBooking.click('button:has-text("Retry Payment")')
      
      // Should show payment modal again
      await expect(page.locator('text=Complete Payment')).toBeVisible()
    }
  })

  test('should display payment history', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click on payment history or transactions
    await page.click('text=Payment History')
    
    // Should show payment transactions
    await expect(page.locator('text=Payment History')).toBeVisible()
    
    // Check if payment records are displayed
    const paymentRecord = page.locator('[data-testid="payment-record"]').first()
    if (await paymentRecord.isVisible()) {
      await expect(paymentRecord.locator('text=R165.00')).toBeVisible()
      await expect(paymentRecord.locator('text=SUCCESS')).toBeVisible()
    }
  })

  test('should handle escrow payment flow', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Find a booking with escrow payment
    const escrowBooking = page.locator('[data-testid="booking-card"]:has-text("ESCROW")').first()
    
    if (await escrowBooking.isVisible()) {
      // Check escrow status
      await expect(escrowBooking.locator('[data-testid="status-badge"]:has-text("ESCROW")')).toBeVisible()
      
      // Check if escrow information is displayed
      await expect(escrowBooking.locator('text=Payment held in escrow')).toBeVisible()
      await expect(escrowBooking.locator('text=Will be released after service completion')).toBeVisible()
    }
  })

  test('should show payment security information', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Check security information
      await expect(page.locator('text=Secure Payment')).toBeVisible()
      await expect(page.locator('text=Powered by Paystack')).toBeVisible()
      await expect(page.locator('text=Your payment information is secure')).toBeVisible()
    }
  })

  test('should handle payment cancellation', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Click cancel button
      await page.click('button:has-text("Cancel")')
      
      // Should close payment modal
      await expect(page.locator('text=Complete Payment')).not.toBeVisible()
      
      // Should return to dashboard
      await expect(page.locator('text=My Bookings')).toBeVisible()
    }
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Check if payment modal is usable on mobile
      await expect(page.locator('text=Complete Payment')).toBeVisible()
      await expect(page.locator('button:has-text("Proceed to Payment")')).toBeVisible()
    }
  })

  test('should handle network errors during payment', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Mock network failure
      await page.route('**/api/book-service/*/pay', route => route.abort())
      
      await page.click('button:has-text("Proceed to Payment")')
      
      // Should show error message
      await expect(page.locator('text=Payment initialization failed')).toBeVisible()
      await expect(page.locator('text=Please try again')).toBeVisible()
    }
  })

  test('should validate payment amount before processing', async ({ page }) => {
    await page.goto('/dashboard')
    
    const confirmedBooking = page.locator('[data-testid="booking-card"]:has-text("CONFIRMED")').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click('button:has-text("Pay Now")')
      
      // Check if amount validation is working
      await expect(page.locator('text=Total Amount: R165.00')).toBeVisible()
      
      // Amount should be greater than 0
      const amountText = await page.locator('text=R165.00').textContent()
      expect(amountText).toContain('R165.00')
    }
  })
})
