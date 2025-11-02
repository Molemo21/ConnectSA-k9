import { test, expect } from '@playwright/test';

test.describe('Client Journey - Booking Process', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to booking page', async ({ page }) => {
    await page.goto('/book-service');
    
    // Should show booking form
    await expect(page.locator('h1')).toContainText(/Book a Service/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should fill out booking form step by step', async ({ page }) => {
    await page.goto('/book-service');
    
    // Step 1: Select service
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.click('text=Next');
    
    // Step 2: Select date and time
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.click('text=Next');
    
    // Step 3: Enter address
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('text=Next');
    
    // Step 4: Add notes (optional)
    await page.fill('textarea[name="notes"]', 'Please bring your own tools');
    await page.click('text=Next');
    
    // Should reach review step
    await expect(page.locator('text=Review Your Booking')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/book-service');
    
    // Try to proceed without filling required fields
    await page.click('text=Next');
    
    // Should show validation errors
    await expect(page.locator('text=Please select a service')).toBeVisible();
  });

  test('should show review step for unauthenticated users', async ({ page }) => {
    // Logout first
    await page.click('text=Logout');
    await page.goto('/book-service');
    
    // Fill form
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show review step
    await expect(page.locator('text=Review Your Booking')).toBeVisible();
  });

  test('should show sign-in prompt when proceeding from review', async ({ page }) => {
    // Logout first
    await page.click('text=Logout');
    await page.goto('/book-service');
    
    // Fill and submit form
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('button[type="submit"]');
    
    // Click proceed from review
    await page.click('text=Proceed to Provider Selection');
    
    // Should show sign-in prompt
    await expect(page.locator('text=Sign in required')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should open login modal when clicking sign in', async ({ page }) => {
    // Logout first
    await page.click('text=Logout');
    await page.goto('/book-service');
    
    // Fill form and reach review
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('button[type="submit"]');
    
    // Click proceed and then sign in
    await page.click('text=Proceed to Provider Selection');
    await page.click('text=Sign In');
    
    // Should open login modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });

  test('should complete login and proceed to provider selection', async ({ page }) => {
    // Logout first
    await page.click('text=Logout');
    await page.goto('/book-service');
    
    // Fill form and reach review
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.fill('input[name="date"]', '2024-12-25');
    await page.selectOption('select[name="time"]', '14:00');
    await page.fill('input[name="address"]', '123 Test Street, Cape Town');
    await page.click('button[type="submit"]');
    
    // Click proceed and sign in
    await page.click('text=Proceed to Provider Selection');
    await page.click('text=Sign In');
    
    // Fill login form in modal
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should proceed to provider selection
    await expect(page.locator('text=Choose Your Provider')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/book-service');
    
    // Test invalid date
    await page.fill('input[name="date"]', '2023-01-01'); // Past date
    await page.click('text=Next');
    
    // Should show validation error
    await expect(page.locator('text=Please select a future date')).toBeVisible();
  });

  test('should allow going back in form steps', async ({ page }) => {
    await page.goto('/book-service');
    
    // Fill first step
    await page.selectOption('select[name="serviceId"]', { index: 0 });
    await page.click('text=Next');
    
    // Go back
    await page.click('text=Back');
    
    // Should be back on first step
    await expect(page.locator('select[name="serviceId"]')).toBeVisible();
  });
});



















































