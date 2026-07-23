import { test, expect } from "@playwright/test";

test("keyboard selection synchronizes ARIA and form value", async ({ page }) => {
  await page.goto("/test/browser/fixture.html");
  await page.waitForFunction(() => typeof (window as any).bindCombobox === "function");
  await page.evaluate(() => (window as any).binding = (window as any).bindCombobox(document.querySelector("#combo"), { openOnFocus: true }));
  const input = page.locator("[data-rui-input]");
  await input.focus(); await page.keyboard.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await expect(input).toHaveAttribute("aria-activedescendant", "one");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-rui-value]")).toHaveValue("one");
});

test("DOM replacement is observed by the adapter", async ({ page }) => {
  await page.goto("/test/browser/fixture.html");
  await page.waitForFunction(() => typeof (window as any).bindCombobox === "function");
  await page.evaluate(() => (window as any).binding = (window as any).bindCombobox(document.querySelector("#combo")));
  await page.locator("[data-rui-popup]").evaluate((popup) => { const option = document.createElement("div"); option.id = "three"; option.textContent = "Three"; option.dataset.ruiOption = ""; popup.append(option); });
  await expect.poll(async () => page.evaluate(() => (window as any).binding.controller.getState().collection.items.length)).toBe(3);
});
