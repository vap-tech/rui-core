import { test, expect } from "@playwright/test";

test("select, listbox and menu synchronize keyboard state", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindMenu === "function");
  await page.evaluate(() => { (window as any).select = (window as any).bindSelect(document.querySelector("#select")); (window as any).listbox = (window as any).bindListbox(document.querySelector("#listbox")); (window as any).menu = (window as any).bindMenu(document.querySelector("#menu")); });
  await page.locator("#listbox").press("ArrowDown"); await expect(page.locator("#l-one")).toHaveAttribute("data-active");
  await page.evaluate(() => (window as any).menu.controller.open()); await page.locator("#menu").press("ArrowDown"); await expect(page.locator("#m-one")).toHaveAttribute("data-active");
  await page.locator("#select").selectOption("b"); await expect(page.locator("#select")).toHaveValue("b");
});

test("popover, radio, toggle and switch expose ARIA state", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindSwitch === "function");
  await page.evaluate(() => { (window as any).popover = (window as any).bindPopover(document.querySelector("#popover")); (window as any).radio = (window as any).bindRadioGroup(document.querySelector("#radio")); (window as any).toggle = (window as any).bindToggleGroup(document.querySelector("#toggle")); (window as any).switch = (window as any).bindSwitch(document.querySelector("#switch")); });
  await page.getByText("Open popover").click(); await expect(page.locator("#popover")).toBeVisible(); await page.locator("#popover").press("Escape"); await expect(page.locator("#popover")).toBeHidden();
  await page.locator("#radio [data-rui-radio]").first().click(); await expect(page.locator("#radio [data-rui-radio]").first()).toHaveAttribute("aria-checked", "true");
  await page.locator("#toggle [data-rui-toggle]").first().click(); await expect(page.locator("#toggle [data-rui-toggle]").first()).toHaveAttribute("aria-pressed", "true");
  await page.locator("#switch").click(); await expect(page.locator("#switch")).toHaveAttribute("aria-checked", "true");
});

test("tree and accordion respond to keyboard/pointer interactions", async ({ page }) => {
  await page.goto("/test/browser/fixture.html"); await page.waitForFunction(() => typeof (window as any).bindAccordion === "function");
  await page.evaluate(() => { (window as any).tree = (window as any).bindTreeView(document.querySelector("#tree")); (window as any).accordion = (window as any).bindAccordion(document.querySelector("#accordion")); });
  await page.locator("#tree [data-rui-treeitem]").first().click(); await page.keyboard.press("ArrowRight"); await expect(page.locator("#tree [data-rui-treeitem]").first()).toHaveAttribute("aria-expanded", "true");
  await page.locator("#accordion [data-rui-accordion-trigger]").click(); await expect(page.locator("#accordion [data-rui-accordion-content]")).toBeVisible();
});
