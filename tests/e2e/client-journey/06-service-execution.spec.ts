import { test, expect } from '@playwright/test';

test.describe('Client Journey - Service Execution', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should display booking status updates', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for booking status indicators
    const statuses = ['PENDING', 'CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS', 'COMPLETED'];
    
    for (const status of statuses) {
      const bookingCard = page.locator(`[data-testid="booking-card"][data-status="${status}"]`);
      if (await bookingCard.count() > 0) {
        await expect(bookingCard.locator(`text=${status}`)).toBeVisible();
      }
    }
  });

  test('should show provider information for active bookings', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for provider details in booking cards
    const bookingCard = page.locator('[data-testid="booking-card"]:first-child');
    await expect(bookingCard.locator('text=Provider')).toBeVisible();
    await expect(bookingCard.locator('text=Contact')).toBeVisible();
  });

  test('should display service progress updates', async ({ page }) => {
    // Mock real-time updates
    await page.route('**/api/book-service/*/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          message: 'Provider is working on your service',
          updatedAt: new Date().toISOString()
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show progress update
    await expect(page.locator('text=Provider is working on your service')).toBeVisible();
  });

  test('should allow messaging with provider', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on a booking card
    const bookingCard = page.locator('[data-testid="booking-card"]:first-child');
    await bookingCard.click();
    
    // Should show messaging interface
    await expect(page.locator('text=Message Provider')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="message"]')).toBeVisible();
  });

  test('should send message to provider', async ({ page }) => {
    // Mock message sending
    await page.route('**/api/messages', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/dashboard');
    
    // Open messaging
    const bookingCard = page.locator('[data-testid="booking-card"]:first-child');
    await bookingCard.click();
    
    // Send message
    await page.fill('textarea[placeholder*="message"]', 'Hello, when will you arrive?');
    await page.click('text=Send');
    
    // Should show success message
    await expect(page.locator('text=Message sent')).toBeVisible();
  });

  test('should display service completion notification', async ({ page }) => {
    // Mock service completion
    await page.route('**/api/book-service/*/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'COMPLETED',
          message: 'Service completed successfully',
          completedAt: new Date().toISOString()
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show completion notification
    await expect(page.locator('text=Service completed successfully')).toBeVisible();
  });

  test('should show job proof when available', async ({ page }) => {
    // Mock job proof data
    await page.route('**/api/book-service/*/job-proof', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          photos: ['photo1.jpg', 'photo2.jpg'],
          notes: 'Job completed as requested',
          clientConfirmed: false
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Click on completed booking
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Should show job proof
    await expect(page.locator('text=Job Proof')).toBeVisible();
    await expect(page.locator('img[alt*="job proof"]')).toHaveCount.greaterThan(0);
  });

  test('should allow confirming job completion', async ({ page }) => {
    // Mock job confirmation
    await page.route('**/api/book-service/*/confirm-completion', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/dashboard');
    
    // Click on completed booking
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Click confirm completion
    await page.click('text=Confirm Completion');
    
    // Should show confirmation
    await expect(page.locator('text=Job completion confirmed')).toBeVisible();
  });

  test('should handle service issues and disputes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on a booking card
    const bookingCard = page.locator('[data-testid="booking-card"]:first-child');
    await bookingCard.click();
    
    // Should show dispute option
    await expect(page.locator('text=Report Issue')).toBeVisible();
    
    // Click report issue
    await page.click('text=Report Issue');
    
    // Should show dispute form
    await expect(page.locator('text=Report a Problem')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="describe"]')).toBeVisible();
  });

  test('should display real-time status updates', async ({ page }) => {
    // Mock WebSocket or polling updates
    await page.route('**/api/bookings', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bookings: [{
            id: 'test-booking',
            status: 'IN_PROGRESS',
            updatedAt: new Date().toISOString()
          }]
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show real-time updates
    await expect(page.locator('[data-testid="booking-card"][data-status="IN_PROGRESS"]')).toBeVisible();
  });

  test('should show payment status during service', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for payment status indicators
    const paymentStatuses = ['PENDING', 'ESCROW', 'RELEASED'];
    
    for (const status of paymentStatuses) {
      const paymentIndicator = page.locator(`[data-testid="payment-status"][data-status="${status}"]`);
      if (await paymentIndicator.count() > 0) {
        await expect(paymentIndicator).toBeVisible();
      }
    }
  });

  test('should handle provider no-show', async ({ page }) => {
    // Mock no-show scenario
    await page.route('**/api/book-service/*/no-show', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'No-show reported. Refund will be processed.',
          refundAmount: 100
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Click on a booking
    const bookingCard = page.locator('[data-testid="booking-card"]:first-child');
    await bookingCard.click();
    
    // Click report no-show
    await page.click('text=Report No-Show');
    
    // Should show no-show confirmation
    await expect(page.locator('text=No-show reported')).toBeVisible();
    await expect(page.locator('text=Refund will be processed')).toBeVisible();
  });
});









