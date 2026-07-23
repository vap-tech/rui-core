import { test, expect } from "@playwright/test";

test("tabs switch panels with keyboard", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindTabs === "function");
  await page.evaluate(() => (window as any).tabs = (window as any).bindTabs(document.querySelector("#tabs")));
  await page.locator("[data-rui-tab]").first().click(); await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-rui-tab]").nth(1)).toHaveAttribute("aria-selected", "true"); await expect(page.locator("#panel-one")).toBeHidden();
});

test("dialog and command palette reopen after Escape", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindDialog === "function");
  await page.evaluate(() => { (window as any).dialog = (window as any).bindDialog(document.querySelector("#dialog")); (window as any).palette = (window as any).bindCommandPalette(document.querySelector("#palette")); });
  await page.getByText("Open dialog").click(); await expect(page.locator("#dialog")).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.locator("#dialog")).toBeHidden();
  const input = page.locator("#palette [data-rui-input]"); await input.focus(); await page.keyboard.press("ArrowDown"); await expect(page.locator("#palette [data-rui-popup]")).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.locator("#palette [data-rui-popup]")).toBeHidden();
});
