import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { RepUI } from "../src/mount.js";

test("mount detects select and remount destroys previous instance", () => {
  const dom = new JSDOM(`<select data-rui-select><option value="a">A</option></select>`);
  const select = dom.window.document.querySelector("select") as HTMLElement;
  const first = RepUI.mount(select);
  const second = RepUI.mount(select);
  assert.ok(first); assert.ok(second); assert.notEqual(first, second);
  RepUI.unmount(select); RepUI.unmount(select);
});

test("mount detects headless overlay adapters", () => {
  const dom = new JSDOM(`<div data-rui-menu><button data-rui-menuitem>Menu</button></div><div data-rui-tabs><button data-rui-tab>Tab</button></div><div data-rui-dialog id="dialog"></div><div data-rui-popover id="popover"></div><div data-rui-command-palette><input data-rui-input><div data-rui-popup></div></div><div data-rui-tree><button data-rui-treeitem>Root</button></div><div data-rui-accordion><section id="section" data-rui-accordion-item><button data-rui-accordion-trigger>Section</button></section></div><button data-rui-switch>Switch</button>`);
  for (const selector of ["[data-rui-menu]", "[data-rui-tabs]", "[data-rui-dialog]", "[data-rui-popover]", "[data-rui-command-palette]", "[data-rui-tree]", "[data-rui-accordion]", "[data-rui-switch]"]) { const root = dom.window.document.querySelector(selector) as HTMLElement; assert.ok(RepUI.mount(root)); RepUI.unmount(root); }
});

test("mount detects listbox and ignores unknown roots", () => {
  const dom = new JSDOM(`<div data-rui-listbox><div data-rui-option>One</div></div><div id="unknown"></div>`);
  const listbox = dom.window.document.querySelector("[data-rui-listbox]") as HTMLElement;
  const unknown = dom.window.document.querySelector("#unknown") as HTMLElement;
  assert.ok(RepUI.mount(listbox)); assert.equal(RepUI.mount(unknown), null);
  RepUI.unmount(listbox);
});
