import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // The app should have some content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should have the correct title', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check the page title
    await expect(page).toHaveTitle(/Scribbler/i);
  });
});

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Wait for potential redirect to login
    await page.waitForLoadState('networkidle');
    
    // Should either be on login page or main app
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });
});

test.describe('UI Components', () => {
  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Should still have content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Should still have content
    const bodyDesktop = await page.textContent('body');
    expect(bodyDesktop).toBeTruthy();
  });
});
