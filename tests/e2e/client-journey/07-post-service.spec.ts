import { test, expect } from '@playwright/test';

test.describe('Client Journey - Post Service', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should display review prompt for completed services', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for completed bookings
    const completedBookings = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]');
    
    if (await completedBookings.count() > 0) {
      const firstCompleted = completedBookings.first();
      await firstCompleted.click();
      
      // Should show review section
      await expect(page.locator('text=Leave a Review')).toBeVisible();
      await expect(page.locator('[data-testid="review-form"]')).toBeVisible();
    }
  });

  test('should allow submitting a review', async ({ page }) => {
    // Mock review submission
    await page.route('**/api/book-service/*/review', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          review: {
            id: 'test-review',
            rating: 5,
            comment: 'Excellent service!',
            createdAt: new Date().toISOString()
          }
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Find a completed booking
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Fill review form
    await page.click('[data-testid="star-rating"] button:nth-child(5)'); // 5 stars
    await page.fill('textarea[name="comment"]', 'Excellent service! Very professional.');
    
    // Submit review
    await page.click('text=Submit Review');
    
    // Should show success message
    await expect(page.locator('text=Review submitted successfully')).toBeVisible();
  });

  test('should validate review form', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find a completed booking
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Try to submit without rating
    await page.fill('textarea[name="comment"]', 'Good service');
    await page.click('text=Submit Review');
    
    // Should show validation error
    await expect(page.locator('text=Please select a rating')).toBeVisible();
  });

  test('should display existing reviews', async ({ page }) => {
    // Mock existing review data
    await page.route('**/api/book-service/*/review', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: {
            id: 'existing-review',
            rating: 4,
            comment: 'Good service, would recommend',
            createdAt: '2024-01-01T00:00:00Z'
          }
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Find a completed booking
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Should show existing review
    await expect(page.locator('text=Your Review')).toBeVisible();
    await expect(page.locator('[data-testid="existing-review"]')).toBeVisible();
  });

  test('should prevent duplicate reviews', async ({ page }) => {
    // Mock duplicate review error
    await page.route('**/api/book-service/*/review', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Review already exists for this booking'
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Find a completed booking
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Try to submit review
    await page.click('[data-testid="star-rating"] button:nth-child(5)');
    await page.fill('textarea[name="comment"]', 'Another review');
    await page.click('text=Submit Review');
    
    // Should show error
    await expect(page.locator('text=Review already exists for this booking')).toBeVisible();
  });

  test('should show provider rating updates', async ({ page }) => {
    // Mock provider rating update
    await page.route('**/api/providers/*/rating', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          averageRating: 4.5,
          totalReviews: 10
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Submit a review
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    await page.click('[data-testid="star-rating"] button:nth-child(5)');
    await page.fill('textarea[name="comment"]', 'Great service!');
    await page.click('text=Submit Review');
    
    // Should show updated provider rating
    await expect(page.locator('text=Provider rating updated')).toBeVisible();
  });

  test('should display booking history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for booking history section
    await expect(page.locator('text=Booking History')).toBeVisible();
    
    // Check for different booking statuses
    const statuses = ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'];
    
    for (const status of statuses) {
      const bookingCard = page.locator(`[data-testid="booking-card"][data-status="${status}"]`);
      if (await bookingCard.count() > 0) {
        await expect(bookingCard).toBeVisible();
      }
    }
  });

  test('should allow rebooking from history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find a completed booking
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Should show rebook option
    await expect(page.locator('text=Book Again')).toBeVisible();
    
    // Click rebook
    await page.click('text=Book Again');
    
    // Should navigate to booking page
    await expect(page).toHaveURL(/.*book-service/);
  });

  test('should show service statistics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for statistics section
    await expect(page.locator('text=Your Statistics')).toBeVisible();
    
    // Check for various stats
    await expect(page.locator('text=Total Bookings')).toBeVisible();
    await expect(page.locator('text=Completed Services')).toBeVisible();
    await expect(page.locator('text=Total Spent')).toBeVisible();
    await expect(page.locator('text=Average Rating Given')).toBeVisible();
  });

  test('should handle review editing', async ({ page }) => {
    // Mock review editing
    await page.route('**/api/book-service/*/review', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            review: {
              id: 'test-review',
              rating: 4,
              comment: 'Updated review comment',
              updatedAt: new Date().toISOString()
            }
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            review: {
              id: 'test-review',
              rating: 5,
              comment: 'Original review',
              createdAt: '2024-01-01T00:00:00Z'
            }
          })
        });
      }
    });
    
    await page.goto('/dashboard');
    
    // Find a completed booking with existing review
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    // Click edit review
    await page.click('text=Edit Review');
    
    // Update review
    await page.click('[data-testid="star-rating"] button:nth-child(4)'); // 4 stars
    await page.fill('textarea[name="comment"]', 'Updated review comment');
    await page.click('text=Update Review');
    
    // Should show success message
    await expect(page.locator('text=Review updated successfully')).toBeVisible();
  });

  test('should show provider feedback after review', async ({ page }) => {
    // Mock provider feedback
    await page.route('**/api/book-service/*/provider-feedback', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          feedback: 'Thank you for the great review! We appreciate your business.',
          providerName: 'John Smith'
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Submit a review
    const completedBooking = page.locator('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
    await completedBooking.click();
    
    await page.click('[data-testid="star-rating"] button:nth-child(5)');
    await page.fill('textarea[name="comment"]', 'Excellent service!');
    await page.click('text=Submit Review');
    
    // Should show provider feedback
    await expect(page.locator('text=Provider Feedback')).toBeVisible();
    await expect(page.locator('text=Thank you for the great review')).toBeVisible();
  });
});








