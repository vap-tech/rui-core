import { test, expect } from "@playwright/test";

test("touch interactions work on mobile viewport", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindListbox === "function");
  await page.evaluate(() => { (window as any).listbox = (window as any).bindListbox(document.querySelector("#listbox")); (window as any).popover = (window as any).bindPopover(document.querySelector("#popover")); });
  await page.locator("#listbox [data-rui-option]").first().tap(); await expect(page.locator("#l-one")).toHaveAttribute("aria-selected", "true");
  await page.getByText("Open popover").tap(); await expect(page.locator("#popover")).toBeVisible(); await page.locator("#popover").tap({ position: { x: 10, y: 10 } });
});
