import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { PopoverController } from "../src/popover.js";

test("popover delegates lifecycle to popup without positioning", () => {
  const dom = new JSDOM(`<button id="trigger"></button><div id="popover"></div>`); const document = dom.window.document; const controller = new PopoverController({ document }); controller.setElements(document.querySelector("#trigger"), document.querySelector("#popover"));
  assert.equal(controller.open("pointer"), true); assert.equal(controller.getState().open, true); assert.equal(controller.handleKeyDown({ key: "Escape" } as KeyboardEvent), true); assert.equal(controller.getState().open, false); controller.destroy();
});

test("popover supports toggle, outside click and destroy guard", () => {
  const dom = new JSDOM(`<button id="trigger"></button><div id="popover"></div><div id="outside"></div>`); const document = dom.window.document; const controller = new PopoverController({ document }); controller.setElements(document.querySelector("#trigger"), document.querySelector("#popover")); controller.toggle(); document.querySelector("#outside")!.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true })); assert.equal(controller.getState().open, false); controller.destroy(); assert.throws(() => controller.open(), /destroyed/);
});

test("popover reports lifecycle reasons and guards idempotent operations", () => {
  const controller = new PopoverController({ closeOnOutsideClick: false }); const reasons: string[] = []; const unsubscribe = controller.subscribe((_state, reason) => reasons.push(reason));
  controller.setElements(null, null); assert.equal(controller.handleKeyDown({ key: "Enter" } as KeyboardEvent), false); assert.equal(controller.open(), true); assert.equal(controller.open(), false); assert.equal(controller.handleKeyDown({ key: "Escape" } as KeyboardEvent), true); assert.equal(controller.close(), false); unsubscribe(); controller.destroy(); controller.destroy(); assert.deepEqual(reasons, ["programmatic", "escape"]);
});
