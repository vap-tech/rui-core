import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindDialog } from "../src/dialog-dom.js";
import { bindPopover } from "../src/popover-dom.js";

test("bindDialog wires trigger, close and Escape", () => {
  const dom = new JSDOM(`<button data-rui-dialog-trigger="dialog">Open</button><div id="dialog"><button data-rui-dialog-close>Close</button><button>Action</button></div>`); const document = dom.window.document; const root = document.querySelector("#dialog") as HTMLElement; const binding = bindDialog(root);
  assert.equal(root.hidden, true); document.querySelector("[data-rui-dialog-trigger]")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); assert.equal(root.hidden, false); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(root.hidden, true); binding.destroy();
});

test("bindPopover toggles and closes on Escape", () => {
  const dom = new JSDOM(`<button data-rui-popover-trigger="popover">Open</button><div id="popover"></div>`); const document = dom.window.document; const root = document.querySelector("#popover") as HTMLElement; const binding = bindPopover(root); const trigger = document.querySelector("[data-rui-popover-trigger]")!;
  trigger.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); assert.equal(root.hidden, false); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(root.hidden, true); binding.destroy();
});

test("overlay adapters cover optional elements and idempotent paths", () => {
  const dialogDom = new JSDOM(`<div><div id="dialog"></div></div>`); const dialog = bindDialog(dialogDom.window.document.querySelector("#dialog") as HTMLElement, { modal: false, trapFocus: false });
  dialog.controller.open(); assert.equal(dialog.controller.handleKeyDown({ key: "Enter" } as KeyboardEvent), false); dialog.controller.close(); dialog.destroy(); dialog.destroy();
  const popoverDom = new JSDOM(`<div id="popover" role="region"></div>`); const popover = bindPopover(popoverDom.window.document.querySelector("#popover") as HTMLElement);
  assert.equal(popover.controller.handleKeyDown({ key: "Enter" } as KeyboardEvent), false); popover.destroy(); popover.destroy();
});
