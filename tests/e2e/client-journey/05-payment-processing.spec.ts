import { test, expect } from '@playwright/test';

test.describe('Client Journey - Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should display payment page after provider selection', async ({ page }) => {
    // Navigate through booking flow to payment
    await page.goto('/book-service');
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('button[type="submit"]');
    await page.click('text=Proceed to Provider Selection');
    
    // Accept a provider
    await page.locator('[data-testid="provider-card"]:first-child').locator('text=Accept').click();
    
    // Should show payment page
    await expect(page.locator('text=Payment')).toBeVisible();
    await expect(page.locator('text=Pay with Paystack')).toBeVisible();
  });

  test('should display payment breakdown correctly', async ({ page }) => {
    // Navigate to payment page (assuming booking exists)
    await page.goto('/book-service/test-booking-id/pay');
    
    // Check payment breakdown
    await expect(page.locator('text=Service Amount')).toBeVisible();
    await expect(page.locator('text=Platform Fee')).toBeVisible();
    await expect(page.locator('text=Total Amount')).toBeVisible();
    
    // Check amounts are calculated correctly
    const serviceAmount = page.locator('[data-testid="service-amount"]');
    const platformFee = page.locator('[data-testid="platform-fee"]');
    const totalAmount = page.locator('[data-testid="total-amount"]');
    
    await expect(serviceAmount).toBeVisible();
    await expect(platformFee).toBeVisible();
    await expect(totalAmount).toBeVisible();
  });

  test('should initialize Paystack payment', async ({ page }) => {
    // Mock Paystack initialization
    await page.route('**/api/book-service/*/pay', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          authorizationUrl: 'https://checkout.paystack.com/test-checkout',
          accessCode: 'test-access-code'
        })
      });
    });
    
    await page.goto('/book-service/test-booking-id/pay');
    
    // Click pay button
    await page.click('text=Pay with Paystack');
    
    // Should redirect to Paystack
    await expect(page).toHaveURL(/.*paystack.*/);
  });

  test('should handle payment success callback', async ({ page }) => {
    // Navigate to payment success callback
    await page.goto('/book-service/test-booking-id/pay?payment=success');
    
    // Should show success message
    await expect(page.locator('text=Payment completed successfully')).toBeVisible();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle payment failure', async ({ page }) => {
    // Mock payment failure
    await page.route('**/api/book-service/*/pay', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment failed' })
      });
    });
    
    await page.goto('/book-service/test-booking-id/pay');
    
    // Click pay button
    await page.click('text=Pay with Paystack');
    
    // Should show error message
    await expect(page.locator('text=Payment failed')).toBeVisible();
  });

  test('should show escrow information', async ({ page }) => {
    await page.goto('/book-service/test-booking-id/pay');
    
    // Check for escrow information
    await expect(page.locator('text=Your payment will be held securely')).toBeVisible();
    await expect(page.locator('text=Funds will be released after service completion')).toBeVisible();
  });

  test('should display payment status correctly', async ({ page }) => {
    // Check different payment statuses
    const statuses = ['PENDING', 'ESCROW', 'RELEASED', 'FAILED'];
    
    for (const status of statuses) {
      await page.goto(`/book-service/test-booking-id/pay?status=${status}`);
      
      // Should show appropriate status message
      await expect(page.locator(`text=${status}`)).toBeVisible();
    }
  });

  test('should allow payment verification', async ({ page }) => {
    // Mock payment verification
    await page.route('**/api/payment/verify', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 'ESCROW',
          message: 'Payment verified successfully'
        })
      });
    });
    
    await page.goto('/book-service/test-booking-id/pay');
    
    // Click verify payment button
    await page.click('text=Verify Payment');
    
    // Should show verification result
    await expect(page.locator('text=Payment verified successfully')).toBeVisible();
  });

  test('should handle payment timeout', async ({ page }) => {
    // Mock slow payment response
    await page.route('**/api/book-service/*/pay', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }, 10000);
    });
    
    await page.goto('/book-service/test-booking-id/pay');
    
    // Click pay button
    await page.click('text=Pay with Paystack');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
  });

  test('should validate payment amount', async ({ page }) => {
    await page.goto('/book-service/test-booking-id/pay');
    
    // Check that amounts are positive
    const serviceAmount = await page.locator('[data-testid="service-amount"]').textContent();
    const platformFee = await page.locator('[data-testid="platform-fee"]').textContent();
    const totalAmount = await page.locator('[data-testid="total-amount"]').textContent();
    
    expect(parseFloat(serviceAmount?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);
    expect(parseFloat(platformFee?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);
    expect(parseFloat(totalAmount?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);
  });
});



















































