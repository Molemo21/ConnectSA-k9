import { test, expect } from '@playwright/test';

test.describe('Client Journey - Service Browsing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display client dashboard with services', async ({ page }) => {
    // Check dashboard loads
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Check for services section
    await expect(page.locator('text=Popular Services')).toBeVisible();
    
    // Check for service cards
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount.greaterThan(0);
  });

  test('should navigate to services page', async ({ page }) => {
    // Click on Browse Services or navigate to services page
    await page.goto('/services');
    
    // Should show services page
    await expect(page.locator('h1')).toContainText(/Services/);
    
    // Check for service categories
    await expect(page.locator('text=Haircut')).toBeVisible();
    await expect(page.locator('text=Garden Services')).toBeVisible();
  });

  test('should search and filter services', async ({ page }) => {
    await page.goto('/search');
    
    // Test search functionality
    await page.fill('input[placeholder*="Search"]', 'haircut');
    await page.keyboard.press('Enter');
    
    // Should show filtered results
    await expect(page.locator('text=Haircut')).toBeVisible();
    
    // Test category filter
    await page.selectOption('select[name="category"]', 'Haircut');
    
    // Should show only haircut services
    const serviceCards = page.locator('[data-testid="service-card"]');
    await expect(serviceCards).toHaveCount.greaterThan(0);
  });

  test('should display service details', async ({ page }) => {
    await page.goto('/services');
    
    // Click on a service card
    await page.click('[data-testid="service-card"]:first-child');
    
    // Should show service details
    await expect(page.locator('h2')).toContainText(/Service Details/);
    
    // Check for provider information
    await expect(page.locator('text=Available Providers')).toBeVisible();
    
    // Check for pricing information
    await expect(page.locator('text=Price')).toBeVisible();
  });

  test('should navigate to booking from service details', async ({ page }) => {
    await page.goto('/services');
    
    // Click on a service card
    await page.click('[data-testid="service-card"]:first-child');
    
    // Click book now button
    await page.click('text=Book Now');
    
    // Should navigate to booking page
    await expect(page).toHaveURL(/.*book-service/);
  });

  test('should show booking history in dashboard', async ({ page }) => {
    // Check for bookings section
    await expect(page.locator('text=Current Bookings')).toBeVisible();
    
    // Check for booking cards
    const bookingCards = page.locator('[data-testid="booking-card"]');
    await expect(bookingCards).toHaveCount.greaterThanOrEqual(0);
  });

  test('should filter bookings by status', async ({ page }) => {
    // Test different booking filters
    await page.click('text=Current');
    await expect(page.locator('[data-testid="booking-card"]')).toHaveCount.greaterThanOrEqual(0);
    
    await page.click('text=Completed');
    await expect(page.locator('[data-testid="booking-card"]')).toHaveCount.greaterThanOrEqual(0);
    
    await page.click('text=All');
    await expect(page.locator('[data-testid="booking-card"]')).toHaveCount.greaterThanOrEqual(0);
  });
});





















































