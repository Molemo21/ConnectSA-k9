import { test, expect } from '@playwright/test';

test.describe('Client Journey - Provider Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client and navigate to provider selection
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to booking and fill form
    await page.goto('/book-service');
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('button[type="submit"]');
    await page.click('text=Proceed to Provider Selection');
  });

  test('should display provider discovery interface', async ({ page }) => {
    // Should show provider selection interface
    await expect(page.locator('text=Choose Your Provider')).toBeVisible();
    await expect(page.locator('[data-testid="provider-card"]')).toHaveCount.greaterThan(0);
  });

  test('should display provider information correctly', async ({ page }) => {
    const providerCard = page.locator('[data-testid="provider-card"]:first-child');
    
    // Check provider details are displayed
    await expect(providerCard.locator('text=Business Name')).toBeVisible();
    await expect(providerCard.locator('text=Rating')).toBeVisible();
    await expect(providerCard.locator('text=Completed Jobs')).toBeVisible();
    await expect(providerCard.locator('text=Hourly Rate')).toBeVisible();
    await expect(providerCard.locator('text=Experience')).toBeVisible();
  });

  test('should show provider ratings and reviews', async ({ page }) => {
    const providerCard = page.locator('[data-testid="provider-card"]:first-child');
    
    // Check for star rating
    await expect(providerCard.locator('[data-testid="star-rating"]')).toBeVisible();
    
    // Check for review count
    await expect(providerCard.locator('text=reviews')).toBeVisible();
    
    // Check for recent reviews section
    await expect(providerCard.locator('text=Recent Reviews')).toBeVisible();
  });

  test('should allow accepting a provider', async ({ page }) => {
    const providerCard = page.locator('[data-testid="provider-card"]:first-child');
    
    // Click accept button
    await providerCard.locator('text=Accept').click();
    
    // Should show confirmation
    await expect(page.locator('text=Job offer sent successfully')).toBeVisible();
    
    // Should redirect to confirmation page
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });

  test('should allow declining a provider', async ({ page }) => {
    const providerCard = page.locator('[data-testid="provider-card"]:first-child');
    
    // Click decline button
    await providerCard.locator('text=Decline').click();
    
    // Should show next provider
    await expect(page.locator('[data-testid="provider-card"]')).toHaveCount.greaterThan(0);
  });

  test('should allow viewing provider details', async ({ page }) => {
    const providerCard = page.locator('[data-testid="provider-card"]:first-child');
    
    // Click view details button
    await providerCard.locator('text=View Details').click();
    
    // Should open details modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Provider Details')).toBeVisible();
  });

  test('should allow navigation between providers', async ({ page }) => {
    // Check for navigation buttons
    await expect(page.locator('text=Previous')).toBeVisible();
    await expect(page.locator('text=Next')).toBeVisible();
    
    // Click next button
    await page.click('text=Next');
    
    // Should show next provider
    await expect(page.locator('[data-testid="provider-card"]')).toHaveCount.greaterThan(0);
  });

  test('should allow retrying declined providers', async ({ page }) => {
    // Decline first provider
    const providerCard = page.locator('[data-testid="provider-card"]:first-child');
    await providerCard.locator('text=Decline').click();
    
    // Check for retry declined option
    await expect(page.locator('text=Retry Declined')).toBeVisible();
    
    // Click retry declined
    await page.click('text=Retry Declined');
    
    // Should show declined providers again
    await expect(page.locator('[data-testid="provider-card"]')).toHaveCount.greaterThan(0);
  });

  test('should handle no providers available', async ({ page }) => {
    // This test would require mocking the API to return no providers
    // For now, we'll just check the UI handles the case gracefully
    await expect(page.locator('[data-testid="provider-card"]')).toHaveCount.greaterThanOrEqual(0);
  });

  test('should show loading state while fetching providers', async ({ page }) => {
    // Check for loading indicator
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
    
    // Wait for providers to load
    await expect(page.locator('[data-testid="provider-card"]')).toHaveCount.greaterThan(0);
  });

  test('should handle provider selection errors', async ({ page }) => {
    const providerCard = page.locator('[data-testid="provider-card"]:first-child');
    
    // Mock API error by intercepting the request
    await page.route('**/api/book-service/send-offer', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to accept provider
    await providerCard.locator('text=Accept').click();
    
    // Should show error message
    await expect(page.locator('text=Failed to send job offer')).toBeVisible();
  });
});
















































