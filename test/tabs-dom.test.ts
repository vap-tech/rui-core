import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindTabs } from "../src/tabs-dom.js";

test("bindTabs synchronizes tabs and panels", async () => {
  const dom = new JSDOM(`<div id="tabs"><button data-rui-tab data-rui-panel="p1">One</button><button data-rui-tab data-rui-panel="p2">Two</button></div><div id="p1"></div><div id="p2"></div>`); const root = dom.window.document.querySelector("#tabs") as HTMLElement; const binding = bindTabs(root);
  assert.equal(root.getAttribute("role"), "tablist"); assert.equal((dom.window.document.querySelector("#p1") as HTMLElement).hidden, false); (dom.window.document.querySelector("[data-rui-tab]") as HTMLElement).dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); assert.equal(dom.window.document.querySelectorAll('[role="tab"]')[1].getAttribute("aria-selected"), "true"); assert.equal((dom.window.document.querySelector("#p1") as HTMLElement).hidden, true);
  const extra = dom.window.document.createElement("button"); extra.dataset.ruiTab = ""; root.append(extra); await new Promise((resolve) => setTimeout(resolve, 0)); assert.equal(binding.controller.getState().items.length, 3); binding.destroy();
});

test("bindTabs supports manual activation, disabled tabs and missing panels", () => {
  const dom = new JSDOM(`<div><button data-rui-tab data-disabled="true">Disabled</button><button data-rui-tab>Active</button><span><button data-rui-tab data-rui-panel="missing">Nested</button></span></div>`); const root = dom.window.document.querySelector("div") as HTMLElement; const binding = bindTabs(root, "manual");
  root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "PageDown", bubbles: true })); root.querySelectorAll<HTMLElement>("[data-rui-tab]")[2].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); binding.destroy(); binding.destroy(); binding.refresh();
});
