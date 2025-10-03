/**
 * E2E tests to prevent React error #185 regression
 * Tests that components render safely with edge-case data
 */

import { test, expect } from '@playwright/test';

test.describe('React Error #185 Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses with edge-case data
    await page.route('**/api/provider/bookings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          bookings: [
            // Complete booking
            {
              id: 'booking-1',
              status: 'PENDING',
              scheduledDate: '2024-01-01T10:00:00Z',
              totalAmount: 500,
              address: '123 Test St',
              service: {
                id: 'service-1',
                name: 'Test Service',
                category: 'Cleaning'
              },
              client: {
                id: 'client-1',
                name: 'Test Client',
                email: 'test@example.com'
              },
              provider: {
                id: 'provider-1',
                user: {
                  id: 'user-1',
                  name: 'Test Provider',
                  email: 'provider@example.com'
                }
              }
            },
            // Booking with null values
            {
              id: 'booking-2',
              status: 'CONFIRMED',
              scheduledDate: '2024-01-02T10:00:00Z',
              totalAmount: 600,
              address: null,
              service: {
                id: 'service-2',
                name: null,
                category: 'Maintenance'
              },
              client: {
                id: 'client-2',
                name: 'Test Client 2',
                email: null
              },
              provider: {
                id: 'provider-2',
                user: {
                  id: 'user-2',
                  name: 'Test Provider 2',
                  email: 'provider2@example.com'
                }
              }
            },
            // Booking with undefined values
            {
              id: 'booking-3',
              status: 'IN_PROGRESS',
              scheduledDate: '2024-01-03T10:00:00Z',
              totalAmount: undefined,
              address: '456 Test Ave',
              service: {
                id: 'service-3',
                name: 'Test Service 3',
                category: undefined
              },
              client: {
                id: 'client-3',
                name: undefined,
                email: 'client3@example.com'
              },
              provider: {
                id: 'provider-3',
                user: {
                  id: 'user-3',
                  name: 'Test Provider 3',
                  email: undefined
                }
              }
            },
            // Booking with object values in string fields
            {
              id: 'booking-4',
              status: { error: 'Status error' },
              scheduledDate: '2024-01-04T10:00:00Z',
              totalAmount: 'not-a-number',
              address: { message: 'Address error' },
              service: {
                id: 'service-4',
                name: ['Service', 'Name'],
                category: { error: 'Category error' }
              },
              client: {
                id: 'client-4',
                name: { message: 'Client name error' },
                email: ['email', 'error']
              },
              provider: {
                id: 'provider-4',
                user: {
                  id: 'user-4',
                  name: { error: 'Provider name error' },
                  email: { message: 'Email error' }
                }
              }
            },
            // Booking with array values
            {
              id: 'booking-5',
              status: ['PENDING', 'CONFIRMED'],
              scheduledDate: '2024-01-05T10:00:00Z',
              totalAmount: [500, 600],
              address: ['123', 'Test', 'St'],
              service: {
                id: 'service-5',
                name: ['Array', 'Service'],
                category: ['Category1', 'Category2']
              },
              client: {
                id: 'client-5',
                name: ['Array', 'Client'],
                email: ['array', 'client', 'email']
              },
              provider: {
                id: 'provider-5',
                user: {
                  id: 'user-5',
                  name: ['Array', 'Provider'],
                  email: ['array', 'provider', 'email']
                }
              }
            }
          ],
          stats: {
            pendingJobs: 1,
            confirmedJobs: 1,
            inProgressJobs: 1,
            totalEarnings: 0,
            averageRating: 0
          }
        })
      });
    });

    // Mock authentication
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-provider',
            role: 'PROVIDER',
            email: 'provider@test.com'
          }
        })
      });
    });
  });

  test('should load provider dashboard without React error #185', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for unhandled promise rejections
    const unhandledRejections: string[] = [];
    page.on('pageerror', (error) => {
      unhandledRejections.push(error.message);
    });

    // Navigate to provider dashboard
    await page.goto('/provider/dashboard');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="provider-dashboard"]', { timeout: 10000 });

    // Check that no React error #185 occurred
    const reactError185 = consoleErrors.some(error => 
      error.includes('185') || 
      error.includes('Objects are not valid as a React child') ||
      error.includes('Invalid JSX render')
    );

    expect(reactError185).toBe(false);

    // Check that no unhandled promise rejections occurred
    expect(unhandledRejections).toHaveLength(0);

    // Verify that bookings are displayed (even with fallback values)
    const bookingCards = await page.locator('[data-testid="booking-card"]').count();
    expect(bookingCards).toBeGreaterThan(0);

    // Verify that service names are displayed safely
    const serviceNames = await page.locator('[data-testid="service-name"]').allTextContents();
    expect(serviceNames.length).toBeGreaterThan(0);

    // Verify that client names are displayed safely
    const clientNames = await page.locator('[data-testid="client-name"]').allTextContents();
    expect(clientNames.length).toBeGreaterThan(0);
  });

  test('should handle socket updates without React error #185', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/provider/dashboard');
    await page.waitForSelector('[data-testid="provider-dashboard"]', { timeout: 10000 });

    // Simulate socket update with malformed data
    await page.evaluate(() => {
      // Simulate receiving a socket event with invalid data
      const event = new CustomEvent('socket-booking-update', {
        detail: {
          type: 'booking',
          action: 'update',
          data: {
            id: 'booking-update',
            status: { error: 'Invalid status' },
            service: {
              name: null,
              category: undefined
            },
            client: {
              name: ['Array', 'Name'],
              email: { message: 'Email error' }
            }
          }
        }
      });
      window.dispatchEvent(event);
    });

    // Wait a bit for the update to process
    await page.waitForTimeout(1000);

    // Check that no React error #185 occurred
    const reactError185 = consoleErrors.some(error => 
      error.includes('185') || 
      error.includes('Objects are not valid as a React child') ||
      error.includes('Invalid JSX render')
    );

    expect(reactError185).toBe(false);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/provider/bookings', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Server error' },
          details: ['Error 1', 'Error 2']
        })
      });
    });

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/provider/dashboard');

    // Wait for error state
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });

    // Check that error is displayed safely
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toBeTruthy();

    // Check that no React error #185 occurred
    const reactError185 = consoleErrors.some(error => 
      error.includes('185') || 
      error.includes('Objects are not valid as a React child') ||
      error.includes('Invalid JSX render')
    );

    expect(reactError185).toBe(false);
  });

  test('should handle empty API responses', async ({ page }) => {
    // Mock empty API response
    await page.route('**/api/provider/bookings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          bookings: [],
          stats: {
            pendingJobs: 0,
            confirmedJobs: 0,
            inProgressJobs: 0,
            totalEarnings: 0,
            averageRating: 0
          }
        })
      });
    });

    await page.goto('/provider/dashboard');
    await page.waitForSelector('[data-testid="provider-dashboard"]', { timeout: 10000 });

    // Check that empty state is displayed
    const emptyState = await page.locator('[data-testid="empty-state"]').isVisible();
    expect(emptyState).toBe(true);
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed API response
    await page.route('**/api/provider/bookings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          bookings: 'not-an-array',
          stats: null
        })
      });
    });

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/provider/dashboard');
    await page.waitForSelector('[data-testid="provider-dashboard"]', { timeout: 10000 });

    // Check that no React error #185 occurred
    const reactError185 = consoleErrors.some(error => 
      error.includes('185') || 
      error.includes('Objects are not valid as a React child') ||
      error.includes('Invalid JSX render')
    );

    expect(reactError185).toBe(false);
  });
});
