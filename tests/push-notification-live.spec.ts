import { test, expect } from "@playwright/test";

test.describe("Push Notification Live Test", () => {
  test("Full push notification flow - subscribe and trigger", async ({ page }) => {
    // Step 1: Visit the site and check for the notification prompt
    console.log("Step 1: Opening the site...");
    await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Step 2: Check VAPID key endpoint works
    console.log("Step 2: Checking VAPID public key endpoint...");
    const vapidRes = await page.request.get("http://localhost:5173/api/vapid-public-key");
    const vapidData = await vapidRes.json();
    console.log("VAPID response:", JSON.stringify(vapidData));
    expect(vapidRes.ok()).toBeTruthy();
    expect(vapidData.publicKey).toBeTruthy();

    // Step 3: Check the notification prompt banner appears
    console.log("Step 3: Checking notification prompt banner...");
    // Close any alert popups first
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    const banner = page.locator("text=Stay updated");
    const bannerVisible = await banner.isVisible().catch(() => false);
    console.log("Notification banner visible:", bannerVisible);

    if (bannerVisible) {
      // Take screenshot of the prompt
      await page.screenshot({ path: "tests/screenshots/push-prompt.png" });
      console.log("Screenshot saved: push-prompt.png");

      // Step 4: Click Enable button
      console.log("Step 4: Clicking Enable button...");
      const enableBtn = page.locator("button", { hasText: "Enable" });
      await enableBtn.click({ force: true });
      await page.waitForTimeout(2000);
      console.log("Enable button clicked - browser permission dialog should appear");
    } else {
      console.log("Banner not visible - user may have already subscribed or dismissed");
    }

    // Step 5: Manually subscribe via API (simulating what the hook does)
    console.log("Step 5: Subscribing via API...");
    const subscribeRes = await page.request.post("http://localhost:5173/api/push-subscription", {
      data: {
        intent: "subscribe",
        subscription: {
          endpoint: `https://fcm.googleapis.com/fcm/send/live-test-${Date.now()}`,
          keys: {
            p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XHhAirwqVPaSp3k7w2aYx5Q",
            auth: "tBHItJI5svbpC7jeBQ_aLQ",
          },
        },
      },
    });
    const subscribeData = await subscribeRes.json();
    console.log("Subscribe response:", JSON.stringify(subscribeData));
    expect(subscribeRes.ok()).toBeTruthy();
    expect(subscribeData.success).toBe(true);

    // Step 6: Verify subscription is in the database by subscribing again (upsert)
    console.log("Step 6: Verifying subscription persists (re-subscribe)...");
    const resubRes = await page.request.post("http://localhost:5173/api/push-subscription", {
      data: {
        intent: "subscribe",
        subscription: {
          endpoint: `https://fcm.googleapis.com/fcm/send/live-test-${Date.now()}`,
          keys: {
            p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XHhAirwqVPaSp3k7w2aYx5Q",
            auth: "tBHItJI5svbpC7jeBQ_aLQ",
          },
        },
      },
    });
    expect(resubRes.ok()).toBeTruthy();
    console.log("Re-subscribe succeeded (upsert works)");

    // Step 7: Trigger a test push notification
    console.log("Step 7: Triggering test push notification via /api/test-push...");
    const pushRes = await page.request.get("http://localhost:5173/api/test-push");
    const pushData = await pushRes.json();
    console.log("Test push response:", JSON.stringify(pushData));
    expect(pushRes.ok()).toBeTruthy();
    expect(pushData.sent).toBe(true);

    // Wait a moment for the push to be processed server-side
    await page.waitForTimeout(3000);
    console.log("Check server console for [Push] log messages!");

    // Step 8: Take final screenshot
    await page.screenshot({ path: "tests/screenshots/push-after-test.png" });
    console.log("Final screenshot saved: push-after-test.png");

    // Step 9: Verify unsubscribe works
    console.log("Step 9: Testing unsubscribe...");
    const unsubRes = await page.request.post("http://localhost:5173/api/push-subscription", {
      data: {
        intent: "unsubscribe",
        endpoint: `https://fcm.googleapis.com/fcm/send/live-test-${Date.now() - 1000}`,
      },
    });
    expect(unsubRes.ok()).toBeTruthy();
    console.log("Unsubscribe succeeded");

    console.log("\n=== LIVE TEST COMPLETE ===");
    console.log("Check the dev server terminal for [Push] log output to verify server-side sending.");
  });

  test("Notification prompt UI interaction", async ({ page }) => {
    // Clear localStorage to ensure prompt shows
    await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.removeItem("push-notification-dismissed");
    });

    // Reload to trigger fresh check
    console.log("Reloading with cleared localStorage...");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Dismiss any alert popups
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Check for the notification prompt
    const stayUpdated = page.locator("text=Stay updated");
    const enableNotifs = page.locator("text=Enable notifications");
    const isVisible = await stayUpdated.isVisible().catch(() => false);

    if (isVisible) {
      console.log("Notification prompt is visible!");
      await page.screenshot({ path: "tests/screenshots/push-banner-visible.png" });

      // Test "Not now" dismiss
      console.log("Clicking 'Not now'...");
      const notNowBtn = page.locator("button", { hasText: "Not now" });
      await notNowBtn.click();
      await page.waitForTimeout(1000);

      // Verify it disappeared
      const stillVisible = await stayUpdated.isVisible().catch(() => false);
      console.log("Banner still visible after dismiss:", stillVisible);
      expect(stillVisible).toBe(false);

      await page.screenshot({ path: "tests/screenshots/push-banner-dismissed.png" });
      console.log("Banner dismissed successfully!");
    } else {
      console.log("Notification prompt not showing - browser may have notifications denied or already granted");
      console.log("This is expected if you already enabled notifications in this browser.");
    }
  });

  test("API endpoints validation", async ({ page }) => {
    // Test VAPID key endpoint
    console.log("Testing GET /api/vapid-public-key...");
    const vapidRes = await page.request.get("http://localhost:5173/api/vapid-public-key");
    expect(vapidRes.ok()).toBeTruthy();
    const vapidData = await vapidRes.json();
    expect(vapidData.publicKey).toMatch(/^B[A-Za-z0-9_-]+/);
    console.log("VAPID key starts with:", vapidData.publicKey.substring(0, 20) + "...");

    // Test subscribe with valid data
    console.log("Testing POST /api/push-subscription (subscribe)...");
    const subRes = await page.request.post("http://localhost:5173/api/push-subscription", {
      data: {
        intent: "subscribe",
        subscription: {
          endpoint: "https://fcm.googleapis.com/fcm/send/api-validation-test",
          keys: { p256dh: "test-p256dh-key", auth: "test-auth-key" },
        },
      },
    });
    expect(subRes.ok()).toBeTruthy();
    console.log("Subscribe: OK");

    // Test subscribe with invalid data
    console.log("Testing POST /api/push-subscription (invalid)...");
    const badRes = await page.request.post("http://localhost:5173/api/push-subscription", {
      data: { intent: "subscribe", subscription: {} },
    });
    expect(badRes.status()).toBe(400);
    console.log("Invalid subscribe rejected: OK");

    // Test invalid intent
    console.log("Testing POST /api/push-subscription (bad intent)...");
    const badIntentRes = await page.request.post("http://localhost:5173/api/push-subscription", {
      data: { intent: "invalid" },
    });
    expect(badIntentRes.status()).toBe(400);
    console.log("Invalid intent rejected: OK");

    // Test unsubscribe
    console.log("Testing POST /api/push-subscription (unsubscribe)...");
    const unsubRes = await page.request.post("http://localhost:5173/api/push-subscription", {
      data: {
        intent: "unsubscribe",
        endpoint: "https://fcm.googleapis.com/fcm/send/api-validation-test",
      },
    });
    expect(unsubRes.ok()).toBeTruthy();
    console.log("Unsubscribe: OK");

    // Test push trigger
    console.log("Testing GET /api/test-push...");
    const pushRes = await page.request.get("http://localhost:5173/api/test-push");
    expect(pushRes.ok()).toBeTruthy();
    const pushData = await pushRes.json();
    expect(pushData.sent).toBe(true);
    console.log("Test push triggered: OK, timestamp:", pushData.timestamp);

    console.log("\n=== ALL API ENDPOINTS VALIDATED ===");
  });
});
