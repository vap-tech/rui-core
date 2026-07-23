import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { PopupController } from "../src/popup.js";

test("opens, closes, reports reasons and returns focus", () => {
  const dom = new JSDOM(`<button id="trigger"></button><div id="popup"></div>`);
  const document = dom.window.document;
  const trigger = document.querySelector("#trigger") as HTMLElement;
  const popup = document.querySelector("#popup") as HTMLElement;
  const controller = new PopupController({ document });
  controller.setTrigger(trigger); controller.setPopup(popup);
  const reasons: string[] = []; controller.subscribe((state) => reasons.push(state.reason!));
  assert.equal(controller.open("pointer"), true); assert.equal(controller.open(), false);
  assert.equal(controller.close("escape"), true); assert.equal(document.activeElement, trigger);
  assert.deepEqual(reasons, ["pointer", "escape"]);
  controller.destroy(); assert.throws(() => controller.open(), /destroyed/);
});

test("closes on outside pointerdown but ignores trigger, popup and allowed layers", () => {
  const dom = new JSDOM(`<button id="trigger"><span></span></button><div id="popup"><span></span></div><div id="layer"><span></span></div><div id="outside"></div>`);
  const document = dom.window.document;
  const controller = new PopupController({ document });
  const trigger = document.querySelector("#trigger") as HTMLElement;
  const popup = document.querySelector("#popup") as HTMLElement;
  const layer = document.querySelector("#layer") as HTMLElement;
  const outside = document.querySelector("#outside") as HTMLElement;
  controller.setTrigger(trigger); controller.setPopup(popup); controller.addAllowedLayer(layer); controller.open();
  layer.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true })); assert.equal(controller.getState().open, true);
  trigger.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true })); assert.equal(controller.getState().open, true);
  outside.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true })); assert.equal(controller.getState().reason, "outside-click");
});

test("supports toggle and disabled outside-click", () => {
  const dom = new JSDOM(`<div id="outside"></div>`);
  const controller = new PopupController({ document: dom.window.document, closeOnOutsideClick: false, returnFocus: false });
  const outside = dom.window.document.querySelector("#outside")!;
  controller.toggle(); outside.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
  assert.equal(controller.getState().open, true); controller.toggle(); assert.equal(controller.getState().open, false);
});
