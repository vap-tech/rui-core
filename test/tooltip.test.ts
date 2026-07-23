import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { HovercardController, TooltipController } from "../src/tooltip.js";
import { bindTooltip } from "../src/tooltip-dom.js";

test("tooltip opens and closes without stealing focus", async () => {
  const dom = new JSDOM(`<button id="trigger"></button><div id="tip"></div>`); const trigger = dom.window.document.querySelector("#trigger") as HTMLElement; const tip = dom.window.document.querySelector("#tip") as HTMLElement;
  const tooltip = new TooltipController({ openDelay: 1, closeDelay: 1 }); tooltip.setElements(trigger, tip); assert.equal(tip.hidden, true); tooltip.scheduleOpen(); await new Promise((resolve) => setTimeout(resolve, 5)); assert.equal(tooltip.getState().open, true); assert.equal(dom.window.document.activeElement, dom.window.document.body); assert.equal(trigger.getAttribute("aria-describedby"), "tip"); tooltip.scheduleClose(); await new Promise((resolve) => setTimeout(resolve, 5)); assert.equal(tooltip.getState().open, false); tooltip.destroy();
});

test("tooltip handles Escape, disabled and idempotent destroy", () => {
  const tooltip = new TooltipController({ disabled: true }); assert.equal(tooltip.open(), false); assert.equal(tooltip.handleKeyDown({ key: "Escape" } as KeyboardEvent), false); tooltip.destroy(); tooltip.destroy(); assert.throws(() => tooltip.open(), /destroyed/);
  const hovercard = new HovercardController(); hovercard.open(); assert.equal(hovercard.close("escape"), true); hovercard.destroy();
});

test("tooltip DOM binding wires focus, touch and ARIA", () => {
  const dom = new JSDOM(`<button aria-describedby="tip"></button><div id="tip" data-rui-tooltip data-open-delay="0"></div>`); const root = dom.window.document.querySelector("#tip") as HTMLElement; const binding = bindTooltip(root); const trigger = dom.window.document.querySelector("button") as HTMLElement;
  trigger.dispatchEvent(new dom.window.FocusEvent("focus")); assert.equal(root.hidden, true); binding.controller.open("focus"); assert.equal(root.hidden, false); trigger.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(root.hidden, true); const touch = new dom.window.Event("pointerdown", { bubbles: true }); Object.defineProperty(touch, "pointerType", { value: "touch" }); trigger.dispatchEvent(touch); assert.equal(root.hidden, false); binding.destroy(); binding.destroy();
});

test("tooltip covers missing elements, timers and hovercard binding", async () => {
  const dom = new JSDOM(`<div id="tip" data-rui-tooltip data-open-delay="0" data-close-delay="0"></div><div data-rui-hovercard></div>`); const tip = dom.window.document.querySelector("#tip") as HTMLElement; const binding = bindTooltip(tip); binding.controller.scheduleOpen(); binding.controller.scheduleOpen(); await new Promise((resolve) => setTimeout(resolve, 2)); binding.controller.scheduleClose(); binding.controller.scheduleClose(); await new Promise((resolve) => setTimeout(resolve, 2)); binding.destroy();
  const hover = dom.window.document.querySelector("[data-rui-hovercard]") as HTMLElement; const hoverBinding = (await import("../src/tooltip-dom.js")).bindHovercard(hover); hoverBinding.destroy();
  const controller = new TooltipController(); controller.setElements(null, null); controller.open(); assert.equal(controller.close(), true); controller.destroy();
});

test("tooltip binding covers explicit trigger and pointer lifecycle", () => {
  const dom = new JSDOM(`<button data-rui-tooltip-trigger="help"></button><div id="tip" data-rui-tooltip data-rui-tooltip-trigger="help"></div>`); const trigger = dom.window.document.querySelector("button") as HTMLElement; const tip = dom.window.document.querySelector("#tip") as HTMLElement; const binding = bindTooltip(tip);
  trigger.dispatchEvent(new dom.window.Event("pointerenter")); binding.controller.open(); trigger.dispatchEvent(new dom.window.Event("pointerleave")); trigger.dispatchEvent(new dom.window.Event("blur")); const touch = new dom.window.Event("pointerdown"); Object.defineProperty(touch, "pointerType", { value: "mouse" }); trigger.dispatchEvent(touch); binding.destroy();
});

test("tooltip controller covers no-op schedules and generated content id", () => {
  const dom = new JSDOM(`<button></button><div></div>`); const trigger = dom.window.document.querySelector("button") as HTMLElement; const content = dom.window.document.querySelector("div") as HTMLElement; const controller = new TooltipController({ openDelay: 0 }); controller.setElements(trigger, content); assert.ok(content.id); controller.scheduleClose(); controller.open(); controller.scheduleOpen(); controller.scheduleClose(); controller.close(); assert.equal(controller.close(), false); controller.destroy();
});
