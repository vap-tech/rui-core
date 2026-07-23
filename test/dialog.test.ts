import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { DialogController } from "../src/dialog.js";

test("dialog opens, focuses content, handles Escape and returns focus", () => {
  const dom = new JSDOM(`<button id="trigger"></button><div id="dialog"><button id="first"></button></div>`); const document = dom.window.document;
  const trigger = document.querySelector("#trigger") as HTMLElement; const dialog = document.querySelector("#dialog") as HTMLElement; const controller = new DialogController(); controller.setElements(dialog, trigger);
  assert.equal(controller.open("programmatic"), true); assert.equal(dialog.getAttribute("aria-modal"), "true"); assert.equal(document.activeElement?.id, "first"); assert.equal(controller.handleKeyDown({ key: "Escape" } as KeyboardEvent), true); assert.equal(document.activeElement, trigger); controller.destroy();
});

test("dialog handles non-modal/no-trap and idempotent lifecycle", () => {
  const controller = new DialogController({ modal: false, trapFocus: false }); assert.equal(controller.close(), false); controller.open(); assert.equal(controller.open(), false); assert.equal(controller.getState().modal, false); controller.close(); controller.destroy(); controller.destroy(); assert.throws(() => controller.open(), /destroyed/);
});

test("dialog handles non-Escape keys and subscriptions", () => {
  const dialog = new DialogController(); let changes = 0; const unsubscribe = dialog.subscribe(() => changes++); dialog.setElements(null); dialog.open("keyboard"); assert.equal(dialog.handleKeyDown({ key: "Enter" } as KeyboardEvent), false); assert.equal(changes, 1); unsubscribe(); dialog.close(); assert.equal(changes, 1); dialog.destroy();
});
