import { test, expect } from '@playwright/test';

test.describe('Desktop Header Navigation', () => {
  // Desktop viewport
  test.use({ viewport: { width: 1280, height: 800 } });

  test('bottom navigation is hidden on desktop', async ({ page }) => {
    await page.goto('/');

    // Bottom nav should NOT be visible on desktop (lg:hidden)
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).not.toBeVisible();
  });

  test('header nav items are visible on desktop', async ({ page }) => {
    await page.goto('/');

    // Desktop nav items should be visible in header
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    // Check header nav links exist (using the Navbar structure)
    await expect(page.locator('header >> text=Home')).toBeVisible();
    await expect(page.locator('header >> text=Safety')).toBeVisible();
    await expect(page.locator('header >> text=Directory')).toBeVisible();
    await expect(page.locator('header >> text=Apps')).toBeVisible();
  });

  test('desktop navigation works with client-side routing', async ({ page }) => {
    await page.goto('/');

    const initialUrl = page.url();
    console.log('Desktop starting at:', initialUrl);

    // Click on Safety in header nav
    await page.click('header >> text=Safety');
    await page.waitForURL('**/safety');

    expect(page.url()).toContain('/safety');
    console.log('Desktop navigated to:', page.url());

    // Click on Apps
    await page.click('header >> text=Apps');
    await page.waitForURL('**/apps');

    expect(page.url()).toContain('/apps');
    console.log('Desktop navigated to:', page.url());

    // Click Home to go back
    await page.click('header >> text=Home');
    await page.waitForURL(/\/$/);

    console.log('Desktop back to home:', page.url());
  });

  test('right sidebar is visible on desktop', async ({ page }) => {
    await page.goto('/');

    // Right sidebar should be visible on desktop (hidden lg:block)
    const sidebar = page.locator('aside.sticky');
    await expect(sidebar).toBeVisible();
  });
});
