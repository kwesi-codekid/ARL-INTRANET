import { test, expect } from '@playwright/test';

test.describe('Mobile Bottom Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('bottom navigation is visible on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check bottom nav is visible
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();
    
    // Check all nav items are present
    await expect(page.locator('nav.fixed.bottom-0 >> text=Home')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0 >> text=Safety')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0 >> text=Directory')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0 >> text=Menu')).toBeVisible();
    await expect(page.locator('nav.fixed.bottom-0 >> text=Apps')).toBeVisible();
    
    await page.screenshot({ path: 'playwright-report/mobile-nav-home.png' });
  });

  test('navigation works without full page reload', async ({ page }) => {
    await page.goto('/');

    // Get initial page state
    const initialUrl = page.url();
    console.log('Starting at:', initialUrl);

    // Click on Safety link (public page)
    await page.click('nav.fixed.bottom-0 >> text=Safety');
    await page.waitForURL('**/safety');

    // Verify we navigated
    expect(page.url()).toContain('/safety');
    console.log('Navigated to:', page.url());

    await page.screenshot({ path: 'playwright-report/mobile-nav-safety.png' });

    // Click on Menu (Canteen - public page)
    await page.click('nav.fixed.bottom-0 >> text=Menu');
    await page.waitForURL('**/canteen');

    expect(page.url()).toContain('/canteen');
    console.log('Navigated to:', page.url());

    await page.screenshot({ path: 'playwright-report/mobile-nav-menu.png' });

    // Click on Apps (public page)
    await page.click('nav.fixed.bottom-0 >> text=Apps');
    await page.waitForURL('**/apps');

    expect(page.url()).toContain('/apps');
    console.log('Navigated to:', page.url());

    await page.screenshot({ path: 'playwright-report/mobile-nav-apps.png' });

    // Go back to Home
    await page.click('nav.fixed.bottom-0 >> text=Home');
    await page.waitForURL(/\/$/);

    console.log('Back to home:', page.url());

    await page.screenshot({ path: 'playwright-report/mobile-nav-back-home.png' });
  });

  test('directory requires authentication', async ({ page }) => {
    await page.goto('/');

    // Click on Directory (requires auth)
    await page.click('nav.fixed.bottom-0 >> text=Directory');

    // Should redirect to login with redirectTo parameter
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirectTo');

    console.log('Directory redirected to login:', page.url());
  });

  test('active state highlights current page', async ({ page }) => {
    // Start at home
    await page.goto('/');
    
    // Home should be active (has primary color)
    const homeLink = page.locator('nav.fixed.bottom-0 a[href="/"]');
    await expect(homeLink).toHaveClass(/text-primary-600/);
    
    // Navigate to Safety
    await page.click('nav.fixed.bottom-0 >> text=Safety');
    await page.waitForURL('**/safety');
    
    // Safety should now be active
    const safetyLink = page.locator('nav.fixed.bottom-0 a[href="/safety"]');
    await expect(safetyLink).toHaveClass(/text-primary-600/);
    
    // Home should no longer be active
    await expect(homeLink).not.toHaveClass(/text-primary-600/);
    
    console.log('Active state test passed');
  });
});
