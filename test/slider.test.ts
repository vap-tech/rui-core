import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { RangeSliderController, SliderController } from "../src/slider.js";
import { bindRangeSlider, bindSlider } from "../src/slider-dom.js";

test("slider supports step, page, bounds and keyboard", () => {
  const slider = new SliderController({ value: 5, min: 0, max: 10, step: 2, pageSize: 4 });
  assert.equal(slider.getState().value, 6); assert.equal(slider.handleKeyDown({ key: "ArrowLeft" } as KeyboardEvent), true); assert.equal(slider.getState().value, 4);
  slider.handleKeyDown({ key: "PageUp" } as KeyboardEvent); assert.equal(slider.getState().value, 8); slider.handleKeyDown({ key: "End" } as KeyboardEvent); assert.equal(slider.getState().value, 10); slider.handleKeyDown({ key: "Home" } as KeyboardEvent); assert.equal(slider.getState().value, 0); assert.equal(slider.handleKeyDown({ key: "Escape" } as KeyboardEvent), false); slider.destroy(); assert.throws(() => slider.setValue(2), /destroyed/);
});

test("range slider keeps thumbs ordered and supports keyboard", () => {
  const slider = new RangeSliderController({ values: [20, 80], min: 0, max: 100, step: 10 });
  slider.setValue(0, 90); assert.deepEqual(slider.getState().values, [80, 80]); slider.setValue(1, 30); assert.deepEqual(slider.getState().values, [80, 80]); slider.handleKeyDown(0, { key: "Home" } as KeyboardEvent); assert.deepEqual(slider.getState().values, [0, 80]); slider.destroy();
});

test("slider DOM adapters sync ARIA and pointer state", () => {
  const dom = new JSDOM(`<div id="slider" data-rui-slider data-min="0" data-max="100" data-value="20"></div><div id="range" data-rui-range-slider data-value-start="20" data-value-end="80"><button data-rui-slider-thumb></button><button data-rui-slider-thumb></button></div>`);
  const root = dom.window.document.querySelector("#slider") as HTMLElement; const binding = bindSlider(root); assert.equal(root.getAttribute("aria-valuenow"), "20"); binding.controller.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); assert.equal(root.getAttribute("aria-valuenow"), "21"); binding.destroy(); binding.destroy();
  const range = bindRangeSlider(dom.window.document.querySelector("#range") as HTMLElement); assert.equal(range.controller.getState().values[0], 20); assert.equal(dom.window.document.querySelector("#range [data-rui-slider-thumb]")?.getAttribute("role"), "slider"); range.destroy();
});

test("sliders cover disabled, vertical pointer and both range thumbs", () => {
  const disabled = new SliderController({ disabled: true }); assert.equal(disabled.setValue(5), false); assert.equal(disabled.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent), false); disabled.destroy();
  const range = new RangeSliderController({ values: [20, 80], min: 0, max: 100, step: 10, pageSize: 20 }); assert.equal(range.setValue(0, 20), false); range.handleKeyDown(1, { key: "End" } as KeyboardEvent); range.handleKeyDown(1, { key: "PageDown" } as KeyboardEvent); range.handleKeyDown(0, { key: "ArrowRight" } as KeyboardEvent); range.handleKeyDown(0, { key: "PageUp" } as KeyboardEvent); assert.equal(range.handleKeyDown(1, { key: "Escape" } as KeyboardEvent), false); range.destroy(); range.destroy(); assert.throws(() => range.setValue(0, 1), /destroyed/);
  const dom = new JSDOM(`<div id="v" data-rui-slider data-orientation="vertical"></div><div id="r" data-rui-range-slider data-disabled="true"><button data-rui-slider-thumb></button><button data-rui-slider-thumb></button></div>`); const vertical = bindSlider(dom.window.document.querySelector("#v") as HTMLElement); const pointer = new dom.window.Event("pointerdown", { bubbles: true }); Object.defineProperties(pointer, { clientX: { value: 0 }, clientY: { value: 0 } }); dom.window.document.querySelector("#v")!.dispatchEvent(pointer); vertical.destroy(); const rangeBinding = bindRangeSlider(dom.window.document.querySelector("#r") as HTMLElement); const outside = dom.window.document.createElement("div"); dom.window.document.querySelector("#r")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); dom.window.document.querySelector("#r")!.querySelector("[data-rui-slider-thumb]")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); dom.window.document.querySelector("#r")!.append(outside); rangeBinding.destroy();
});

test("slider DOM covers pointer and range target guards", () => {
  const dom = new JSDOM(`<div id="s" data-rui-slider data-min="0" data-max="10"></div><div id="r" data-rui-range-slider><button data-rui-slider-thumb></button></div>`); const sliderRoot = dom.window.document.querySelector("#s") as HTMLElement; Object.defineProperty(sliderRoot, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 100, height: 100 }) }); const slider = bindSlider(sliderRoot); const pointer = new dom.window.Event("pointerdown", { bubbles: true }); Object.defineProperties(pointer, { clientX: { value: 50 }, clientY: { value: 50 } }); sliderRoot.dispatchEvent(pointer); slider.destroy(); const rangeRoot = dom.window.document.querySelector("#r") as HTMLElement; const range = bindRangeSlider(rangeRoot); rangeRoot.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); rangeRoot.querySelector("button")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); range.destroy();
});

test("slider DOM ignores pointer after destroy and disabled pointer", () => {
  const dom = new JSDOM(`<div id="s" data-rui-slider data-disabled="true"></div>`); const root = dom.window.document.querySelector("#s") as HTMLElement; const binding = bindSlider(root); const event = new dom.window.Event("pointerdown"); root.dispatchEvent(event); binding.destroy(); root.dispatchEvent(event);
});
