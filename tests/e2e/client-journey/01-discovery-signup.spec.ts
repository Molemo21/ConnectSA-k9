import { test, expect } from '@playwright/test';

test.describe('Client Journey - Discovery & Sign Up', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with services and featured providers', async ({ page }) => {
    // Check if landing page loads
    await expect(page).toHaveTitle(/ConnectSA/);
    
    // Check for hero section
    await expect(page.locator('h1')).toContainText(/Find Reliable Service Providers/);
    
    // Check for service categories
    await expect(page.locator('text=Haircut')).toBeVisible();
    await expect(page.locator('text=Garden Services')).toBeVisible();
    
    // Check for CTA buttons
    await expect(page.locator('text=Get Started')).toBeVisible();
    await expect(page.locator('text=Browse Services')).toBeVisible();
    
    // Check for features section
    await expect(page.locator('text=Verified Professionals')).toBeVisible();
    await expect(page.locator('text=Secure & Transparent Payments')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    // Click on Get Started button
    await page.click('text=Get Started');
    
    // Should navigate to signup page
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('h1')).toContainText(/Create Account/);
  });

  test('should complete client registration successfully', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');
    
    // Fill out registration form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="phone"]', '+27123456789');
    
    // Select CLIENT role
    await page.check('input[value="CLIENT"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Account created successfully')).toBeVisible();
    
    // Should show email verification message
    await expect(page.locator('text=Please check your email')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should handle duplicate email registration', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill form with existing email
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.check('input[value="CLIENT"]');
    
    await page.click('button[type="submit"]');
    
    // Should show error for duplicate email
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click on login link
    await page.click('text=Sign In');
    
    // Should navigate to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toContainText(/Welcome Back/);
  });

  test('should complete login successfully', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});




















