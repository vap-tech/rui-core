import { test, expect } from "@playwright/test";

test("touch interactions work on mobile viewport", async ({ page }, testInfo) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindListbox === "function");
  await page.evaluate(() => { (window as any).listbox = (window as any).bindListbox(document.querySelector("#listbox")); (window as any).popover = (window as any).bindPopover(document.querySelector("#popover")); });
  const tapOrClick = async (locator: import("@playwright/test").Locator) => testInfo.project.name === "mobile-chromium" ? locator.tap() : locator.click();
  await tapOrClick(page.locator("#listbox [data-rui-option]").first()); await expect(page.locator("#l-one")).toHaveAttribute("aria-selected", "true");
  await tapOrClick(page.getByText("Open popover")); await expect(page.locator("#popover")).toBeVisible(); await tapOrClick(page.locator("#popover"));
});
