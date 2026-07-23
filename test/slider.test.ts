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
