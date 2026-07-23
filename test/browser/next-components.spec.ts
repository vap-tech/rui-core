import { test, expect } from "@playwright/test";

test("checkboxes synchronize keyboard state and ARIA", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindCheckbox === "function");
  await page.evaluate(() => { (window as any).checkbox = (window as any).bindCheckbox(document.querySelector("#checkbox")); (window as any).group = (window as any).bindCheckboxGroup(document.querySelector("#checkbox-group")); });
  await page.locator("#checkbox").press("Space"); await expect(page.locator("#checkbox")).toHaveAttribute("aria-checked", "checked");
  await page.locator("#checkbox-group [data-rui-checkbox]").first().click(); await expect(page.locator("#checkbox-group [data-rui-checkbox]").first()).toHaveAttribute("aria-checked", "true");
});

test("sliders synchronize keyboard values and ARIA", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindSlider === "function");
  await page.evaluate(() => { (window as any).slider = (window as any).bindSlider(document.querySelector("#slider")); (window as any).range = (window as any).bindRangeSlider(document.querySelector("#range-slider")); });
  await page.locator("#slider").press("ArrowRight"); await expect(page.locator("#slider")).toHaveAttribute("aria-valuenow", "21"); await page.locator("#slider").press("End"); await expect(page.locator("#slider")).toHaveAttribute("aria-valuenow", "100");
  await page.locator("#range-slider [data-rui-slider-thumb]").first().press("Home"); await expect(page.locator("#range-slider [data-rui-slider-thumb]").first()).toHaveAttribute("aria-valuenow", "0");
});

test("tooltip opens on focus and closes with Escape", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindTooltip === "function");
  await page.evaluate(() => (window as any).tooltip = (window as any).bindTooltip(document.querySelector("#tooltip")));
  await page.getByRole("button", { name: "Help" }).focus(); await page.evaluate(() => (window as any).tooltip.controller.open("focus")); await expect(page.locator("#tooltip")).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.locator("#tooltip")).toBeHidden();
});

test("menubar and context menu handle keyboard and pointer opening", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindMenubar === "function");
  await page.evaluate(() => { (window as any).menubar = (window as any).bindMenubar(document.querySelector("#menubar")); (window as any).context = (window as any).bindContextMenu(document.querySelector("#context-menu")); });
  await page.evaluate(() => (window as any).menubar.controller.open());
  await expect.poll(() => page.evaluate(() => (window as any).menubar.controller.getState().openIndex)).toBe(0);
  await page.evaluate(() => document.querySelector("#context-menu")!.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 10 })));
  await expect.poll(() => page.evaluate(() => (window as any).context.controller.getState().open)).toBe(true);
});
