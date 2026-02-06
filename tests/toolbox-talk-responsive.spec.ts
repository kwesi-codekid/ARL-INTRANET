import { test, expect } from '@playwright/test';

// Desktop viewport
test.describe('Toolbox Talk - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('public listing page loads correctly', async ({ page }) => {
    await page.goto('/toolbox-talk');
    
    // Check header - Weekly Toolbox Talk
    await expect(page.locator('h1')).toContainText('Weekly Toolbox Talk');
    
    // Check archive sidebar is visible on desktop
    await expect(page.locator('text=Archive')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'playwright-report/toolbox-talk-desktop.png', fullPage: true });
    console.log('Desktop screenshot saved');
  });

  test('admin create page loads correctly', async ({ page }) => {
    await page.goto('/admin/toolbox-talks/new');
    
    const url = page.url();
    if (url.includes('login')) {
      console.log('Redirected to login - admin auth required');
      await page.screenshot({ path: 'playwright-report/admin-login-page.png' });
      return;
    }
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('Create Toolbox Talk');
    await page.screenshot({ path: 'playwright-report/toolbox-talk-admin-desktop.png', fullPage: true });
  });
});

// Mobile viewport
test.describe('Toolbox Talk - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('public listing page is responsive', async ({ page }) => {
    await page.goto('/toolbox-talk');
    
    // Check header - Weekly Toolbox Talk
    await expect(page.locator('h1')).toContainText('Weekly Toolbox Talk');
    
    // Take screenshot
    await page.screenshot({ path: 'playwright-report/toolbox-talk-mobile.png', fullPage: true });
    console.log('Mobile screenshot saved');
  });

  test('admin create page is responsive', async ({ page }) => {
    await page.goto('/admin/toolbox-talks/new');
    
    const url = page.url();
    if (url.includes('login')) {
      console.log('Redirected to login - admin auth required');
      return;
    }
    
    await expect(page.locator('h1')).toContainText('Create Toolbox Talk');
    await page.screenshot({ path: 'playwright-report/toolbox-talk-admin-mobile.png', fullPage: true });
  });
});

// Tablet viewport  
test.describe('Toolbox Talk - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test('public listing page works on tablet', async ({ page }) => {
    await page.goto('/toolbox-talk');
    
    await expect(page.locator('h1')).toContainText('Weekly Toolbox Talk');
    
    await page.screenshot({ path: 'playwright-report/toolbox-talk-tablet.png', fullPage: true });
    console.log('Tablet screenshot saved');
  });
});
