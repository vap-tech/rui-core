import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindMenu } from "../src/menu-dom.js";

test("bindMenu syncs roles, active state and keyboard navigation", () => {
  const dom = new JSDOM(`<div id="menu"><button data-rui-menuitem id="one">One</button><button data-rui-menuitem id="two">Two</button></div>`); const root = dom.window.document.querySelector("#menu") as HTMLElement; const binding = bindMenu(root); binding.controller.open(); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); assert.equal(root.getAttribute("role"), "menu"); assert.equal(root.querySelector("#one")?.getAttribute("role"), "menuitem"); assert.equal(root.querySelector("#one")?.hasAttribute("data-active"), true); binding.destroy();
});

test("bindMenu selects pointer item and refreshes dynamic items", async () => {
  const dom = new JSDOM(`<div data-rui-menu><button data-rui-menuitem id="one">One</button></div>`); const root = dom.window.document.querySelector("[data-rui-menu]") as HTMLElement; const binding = bindMenu(root); binding.controller.open(); root.querySelector("#one")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); const item = dom.window.document.createElement("button"); item.dataset.ruiMenuitem = ""; item.id = "two"; item.textContent = "Two"; root.append(item); await new Promise((resolve) => setTimeout(resolve, 0)); assert.equal(binding.controller.getState().items.length, 2); binding.destroy();
});

test("bindMenu maps generated ids, disabled items and ignores nested clicks", () => {
  const dom = new JSDOM(`<div id="menu"><div data-rui-menuitem aria-disabled="true"><span>Disabled</span></div><div data-rui-menuitem data-disabled="true">Service</div><div data-rui-menuitem data-value="v">  Value  </div></div>`);
  const root = dom.window.document.querySelector("#menu") as HTMLElement;
  const binding = bindMenu(root);
  const items = root.querySelectorAll<HTMLElement>("[data-rui-menuitem]");
  assert.equal(items[0].id, "menu-item-0");
  assert.equal(items[0].getAttribute("aria-disabled"), "true");
  assert.equal(items[1].getAttribute("aria-disabled"), "true");
  assert.equal(binding.controller.getState().items[2].value, "v");
  items[0].querySelector("span")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(binding.controller.collection.getState().selectedIds, []);
  binding.refresh();
  binding.destroy();
  binding.refresh();
});

test("bindMenu covers closed key events and root id fallback", () => {
  const dom = new JSDOM(`<div><button data-rui-menuitem>One</button><span><button data-rui-menuitem>Nested</button></span></div>`); const root = dom.window.document.querySelector("div") as HTMLElement; const binding = bindMenu(root);
  root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "PageDown", bubbles: true })); root.querySelector("button")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); binding.destroy(); binding.destroy(); binding.refresh();
});
