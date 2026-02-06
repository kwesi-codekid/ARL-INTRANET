import { test } from "@playwright/test";

test.describe("Responsive Media Tests", () => {
  test("capture home page slideshow on desktop and mobile", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/home-desktop.png", fullPage: false });
    console.log("Desktop home screenshot saved");

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/home-mobile.png", fullPage: false });
    console.log("Mobile home screenshot saved");
  });

  test("capture toolbox talk detail on desktop and mobile", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/toolbox-talk");
    await page.waitForLoadState("networkidle");

    const talkLink = page.locator('a[href^="/toolbox-talk/"]').first();
    if (await talkLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await talkLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "test-results/toolbox-desktop.png", fullPage: true });
      console.log("Desktop toolbox talk screenshot saved");
    }

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/toolbox-talk");
    await page.waitForLoadState("networkidle");

    const mobileTalkLink = page.locator('a[href^="/toolbox-talk/"]').first();
    if (await mobileTalkLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mobileTalkLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "test-results/toolbox-mobile.png", fullPage: true });
      console.log("Mobile toolbox talk screenshot saved");
    }
  });
});
