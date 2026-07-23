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

test("mount detects listbox and ignores unknown roots", () => {
  const dom = new JSDOM(`<div data-rui-listbox><div data-rui-option>One</div></div><div id="unknown"></div>`);
  const listbox = dom.window.document.querySelector("[data-rui-listbox]") as HTMLElement;
  const unknown = dom.window.document.querySelector("#unknown") as HTMLElement;
  assert.ok(RepUI.mount(listbox)); assert.equal(RepUI.mount(unknown), null);
  RepUI.unmount(listbox);
});
