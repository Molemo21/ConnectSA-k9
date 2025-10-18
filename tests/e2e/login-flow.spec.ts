import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('should display login form correctly', async ({ page }) => {
    // Check if login form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check for login form labels
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Password')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    // Check for error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Enter valid client credentials
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    
    // Check if user is logged in
    await expect(page.locator('text=Welcome')).toBeVisible()
    await expect(page.locator('text=Sechaba Thomas Nakin')).toBeVisible()
  })

  test('should login as provider successfully', async ({ page }) => {
    // Enter valid provider credentials
    await page.fill('input[type="email"]', 'thabangnakin17@gmail.com')
    await page.fill('input[type="password"]', 'Thabang17')
    
    await page.click('button[type="submit"]')
    
    // Wait for redirect to provider dashboard
    await page.waitForURL('/provider/dashboard')
    
    // Check if provider is logged in
    await expect(page.locator('text=Provider Dashboard')).toBeVisible()
    await expect(page.locator('text=Thabang Nakin')).toBeVisible()
  })

  test('should login as admin successfully', async ({ page }) => {
    // Enter valid admin credentials
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password')
    
    await page.click('button[type="submit"]')
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin/dashboard')
    
    // Check if admin is logged in
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    await expect(page.locator('text=Admin User')).toBeVisible()
  })

  test('should remember login state after page refresh', async ({ page }) => {
    // Login successfully
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/dashboard')
    
    // Refresh the page
    await page.reload()
    
    // Check if still logged in
    await expect(page.locator('text=Welcome')).toBeVisible()
    await expect(page.locator('text=Sechaba Thomas Nakin')).toBeVisible()
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/book-service')
    
    // Should be redirected to login
    await page.waitForURL('/login')
    
    // Login
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    
    // Should be redirected back to intended page
    await page.waitForURL('/book-service')
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/dashboard')
    
    // Click logout button
    await page.click('button:has-text("Logout")')
    
    // Should be redirected to login page
    await page.waitForURL('/login')
    
    // Check if logged out
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/login', route => route.abort())
    
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    
    // Check for network error message
    await expect(page.locator('text=Network error. Please try again.')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if form is still usable on mobile
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Test mobile login
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/dashboard')
    await expect(page.locator('text=Welcome')).toBeVisible()
  })
})
