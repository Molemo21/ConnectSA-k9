import { test, expect } from '@playwright/test';

test.describe('Client Journey - Edge Cases & Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/**', route => {
      route.abort('Failed');
    });
    
    await page.goto('/dashboard');
    
    // Should show error message
    await expect(page.locator('text=Failed to load data')).toBeVisible();
    await expect(page.locator('text=Please try again')).toBeVisible();
  });

  test('should handle server errors', async ({ page }) => {
    // Mock server error
    await page.route('**/api/book-service', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/book-service');
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('should handle payment failures', async ({ page }) => {
    // Mock payment failure
    await page.route('**/api/book-service/*/pay', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment failed' })
      });
    });
    
    await page.goto('/book-service/test-booking-id/pay');
    await page.click('text=Pay with Paystack');
    
    // Should show error and retry option
    await expect(page.locator('text=Payment failed')).toBeVisible();
    await expect(page.locator('text=Try Again')).toBeVisible();
  });

  test('should handle provider no-show', async ({ page }) => {
    // Mock no-show scenario
    await page.route('**/api/book-service/*/no-show', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'No-show reported. Refund initiated.',
          refundAmount: 100
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Find a booking and report no-show
    const bookingCard = page.locator('[data-testid="booking-card"]:first-child');
    await bookingCard.click();
    await page.click('text=Report No-Show');
    
    // Should show no-show handling
    await expect(page.locator('text=No-show reported')).toBeVisible();
    await expect(page.locator('text=Refund initiated')).toBeVisible();
  });

  test('should handle service disputes', async ({ page }) => {
    // Mock dispute creation
    await page.route('**/api/disputes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          disputeId: 'test-dispute',
          message: 'Dispute created successfully'
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Find a booking and create dispute
    const bookingCard = page.locator('[data-testid="booking-card"]:first-child');
    await bookingCard.click();
    await page.click('text=Report Issue');
    
    // Fill dispute form
    await page.selectOption('select[name="issueType"]', 'Poor Quality');
    await page.fill('textarea[name="description"]', 'Service was not as described');
    await page.click('text=Submit Dispute');
    
    // Should show dispute confirmation
    await expect(page.locator('text=Dispute created successfully')).toBeVisible();
  });

  test('should handle session timeout', async ({ page }) => {
    // Mock session timeout
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Session expired')).toBeVisible();
  });

  test('should handle invalid booking IDs', async ({ page }) => {
    await page.goto('/book-service/invalid-id');
    
    // Should show error
    await expect(page.locator('text=Invalid booking')).toBeVisible();
    await expect(page.locator('text=Go Back')).toBeVisible();
  });

  test('should handle concurrent booking attempts', async ({ page }) => {
    // Mock concurrent booking error
    await page.route('**/api/book-service', route => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Booking already exists' })
      });
    });
    
    await page.goto('/book-service');
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('button[type="submit"]');
    
    // Should show conflict error
    await expect(page.locator('text=Booking already exists')).toBeVisible();
  });

  test('should handle payment timeout', async ({ page }) => {
    // Mock payment timeout
    await page.route('**/api/book-service/*/pay', route => {
      setTimeout(() => {
        route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Payment timeout' })
        });
      }, 1000);
    });
    
    await page.goto('/book-service/test-booking-id/pay');
    await page.click('text=Pay with Paystack');
    
    // Should show timeout error
    await expect(page.locator('text=Payment timeout')).toBeVisible();
  });

  test('should handle provider cancellation', async ({ page }) => {
    // Mock provider cancellation
    await page.route('**/api/book-service/*/cancel', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Provider cancelled the booking',
          refundAmount: 100
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show cancellation notification
    await expect(page.locator('text=Provider cancelled the booking')).toBeVisible();
    await expect(page.locator('text=Refund initiated')).toBeVisible();
  });

  test('should handle service completion without payment', async ({ page }) => {
    // Mock service completion without payment
    await page.route('**/api/book-service/*/complete', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment required before completion' })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show payment required error
    await expect(page.locator('text=Payment required before completion')).toBeVisible();
  });

  test('should handle review submission errors', async ({ page }) => {
    // Mock review submission error
    await page.route('**/api/book-service/*/review', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to submit review' })
      });
    });
    
    await page.goto('/dashboard');
    
    // Find completed booking and try to review
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    await page.click('[data-testid="star-rating"] button:nth-child(5)');
    await page.fill('textarea[name="comment"]', 'Great service!');
    await page.click('text=Submit Review');
    
    // Should show error
    await expect(page.locator('text=Failed to submit review')).toBeVisible();
  });

  test('should handle offline mode', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/dashboard');
    
    // Should show offline message
    await expect(page.locator('text=You are offline')).toBeVisible();
    await expect(page.locator('text=Check your connection')).toBeVisible();
  });

  test('should handle slow loading', async ({ page }) => {
    // Mock slow API responses
    await page.route('**/api/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
      }, 5000);
    });
    
    await page.goto('/dashboard');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
  });

  test('should handle form validation edge cases', async ({ page }) => {
    await page.goto('/book-service');
    
    // Test extreme values
    await page.fill('input[name="date"]', '2030-12-31'); // Far future date
    await page.fill('input[name="address"]', 'A'.repeat(1000)); // Very long address
    
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Please select a reasonable date')).toBeVisible();
    await expect(page.locator('text=Address is too long')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/book-service');
    
    // Fill form partially
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.click('text=Next');
    
    // Navigate back
    await page.goBack();
    
    // Should maintain form state
    await expect(page.locator('select[name="serviceId"]')).toHaveValue(await page.locator('select[name="serviceId"] option:first-child').getAttribute('value'));
  });
});



















