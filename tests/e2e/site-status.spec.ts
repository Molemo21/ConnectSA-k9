import { test, expect } from '@playwright/test'

test.describe('Site Status Check', () => {
  test('should load the maintenance page', async ({ page }) => {
    // Navigate to the site
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if maintenance mode is displayed
    await expect(page.locator('text=Platform Under Maintenance')).toBeVisible()
    await expect(page.locator('text=ProLiink Connect')).toBeVisible()
    
    // Check if the page has proper structure
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('p')).toBeVisible()
  })

  test('should display contact information', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check contact information
    await expect(page.locator('text=support@proliinkconnect.co.za')).toBeVisible()
    await expect(page.locator('text=+27 68 947 6401')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if maintenance page is still visible on mobile
    await expect(page.locator('text=Platform Under Maintenance')).toBeVisible()
  })
})
