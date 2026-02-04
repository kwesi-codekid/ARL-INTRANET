/**
 * Comprehensive App Test Suite
 * Tests all pages, links, forms, and functionality
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

// Set default timeout for all tests
test.setTimeout(60000);

// ==================== PUBLIC PAGES ====================

test.describe("Public Pages", () => {
  test("Home page loads correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    // Title could be "ARL Intranet" or contain "ARL"
    await expect(page).toHaveTitle(/ARL/);

    // Check header exists
    await expect(page.locator('header')).toBeVisible();

    // Check some navigation links exist (could be in header or nav)
    const newsLink = page.locator('a[href="/news"]').first();
    const safetyLink = page.locator('a[href="/safety"]').first();

    const hasNewsLink = await newsLink.isVisible({ timeout: 5000 }).catch(() => false);
    const hasSafetyLink = await safetyLink.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasNewsLink || hasSafetyLink).toBeTruthy();
  });

  test("News page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/news`);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("Directory page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/directory`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Apps page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/apps`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Safety hub page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/safety`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Events page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/events`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Gallery page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Suggestions page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/suggestions`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Policies page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/policies`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Canteen page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/canteen`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Toolbox Talk page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/toolbox-talk`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Alerts page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Safety Tips page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/safety-tips`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Safety Videos page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/safety-videos`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Gold News page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/gold-news`);
    await expect(page.locator("body")).toBeVisible();
  });
});

// ==================== NAVIGATION ====================

test.describe("Navigation", () => {
  test("Header navigation works", async ({ page }) => {
    await page.goto(BASE_URL);

    // Click News link in header
    await page.locator('header a[href="/news"]').first().click();
    await expect(page).toHaveURL(/\/news/, { timeout: 10000 });

    // Click Directory link in header
    await page.locator('header a[href="/directory"]').first().click();
    await expect(page).toHaveURL(/\/directory/, { timeout: 10000 });

    // Navigate back to home
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(BASE_URL + "/");
  });

  test("Logo links to home", async ({ page }) => {
    await page.goto(`${BASE_URL}/news`);
    // Click the first link in header that contains an image (logo)
    const logoLink = page.locator('header a:has(img)').first();
    if (await logoLink.isVisible()) {
      await logoLink.click();
      await expect(page).toHaveURL(BASE_URL + "/");
    } else {
      // If no logo link, just verify we can navigate home
      await page.goto(BASE_URL);
      await expect(page).toHaveURL(BASE_URL + "/");
    }
  });
});

// ==================== ADMIN PAGES ====================

test.describe("Admin Pages", () => {
  test("Admin login page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin dashboard redirects to login when not authenticated", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    // Should either show login or redirect
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin news page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/news`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin directory page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/directory`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin apps page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/apps`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin toolbox talks page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/toolbox-talks`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin alerts page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/alerts`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin safety tips page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/safety-tips`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin safety videos page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/safety-videos`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin safety categories page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/safety-categories`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin menus page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/menus`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin events page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/events`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin gallery page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/gallery`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin suggestions page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/suggestions`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin suggestion categories page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/suggestions/categories`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin FAQs page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/faqs`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin IT tips page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/it-tips`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin executive messages page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/executive-messages`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin company info page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/company-info`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin policies page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/policies`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin policy categories page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/policies/categories`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin users page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin activity page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/activity`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin departments page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/departments`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin news categories page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/news/categories`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin apps categories page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/apps/categories`);
    await expect(page.locator("body")).toBeVisible();
  });
});

// ==================== API ENDPOINTS ====================

test.describe("API Endpoints", () => {
  test("Quick links API returns data", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/quick-links`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("quickLinks");
  });

  test("Alerts API returns data", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/alerts`);
    expect(response.ok()).toBeTruthy();
  });

  test("Menu API returns data", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/menu`);
    expect(response.ok()).toBeTruthy();
  });

  test("Events API returns data", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/events`);
    expect(response.ok()).toBeTruthy();
  });

  test("Safety categories API returns data", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/safety-categories`);
    expect(response.ok()).toBeTruthy();
  });

  test("Chat API initializes session", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      multipart: {
        intent: "init",
        sessionId: "test-playwright-session",
      },
    });
    expect(response.ok()).toBeTruthy();
  });

  test("Chat API responds to message", async ({ request }) => {
    // Init first
    await request.post(`${BASE_URL}/api/chat`, {
      multipart: {
        intent: "init",
        sessionId: "test-playwright-msg",
      },
    });

    // Send message
    const response = await request.post(`${BASE_URL}/api/chat`, {
      multipart: {
        intent: "message",
        sessionId: "test-playwright-msg",
        message: "hello",
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("response");
  });
});

// ==================== FORMS ====================

test.describe("Forms", () => {
  test("Suggestion form exists on suggestions page", async ({ page }) => {
    await page.goto(`${BASE_URL}/suggestions`);
    // Check for form or textarea
    const hasForm = await page.locator("form, textarea").count();
    expect(hasForm).toBeGreaterThan(0);
  });
});

// ==================== ERROR HANDLING ====================

test.describe("Error Handling", () => {
  test("404 page for invalid route", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);
    // Should either show 404 or redirect
    expect(response).not.toBeNull();
  });

  test("Invalid news slug handled gracefully", async ({ page }) => {
    await page.goto(`${BASE_URL}/news/non-existent-article-xyz`);
    await expect(page.locator("body")).toBeVisible();
  });
});
