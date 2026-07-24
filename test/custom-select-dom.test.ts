import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindSelect } from "../src/custom-select-dom.js";

function setup() {
  const dom = new JSDOM(`<div id="select"><button data-rui-select-trigger type="button">Choose</button><input type="hidden" name="city"><div data-rui-select-content hidden><button data-rui-option data-value="one">One</button><button data-rui-option data-value="two">Two</button><button data-rui-option data-value="disabled" data-disabled="true">Disabled</button></div></div>`);
  const root = dom.window.document.querySelector("#select") as HTMLElement;
  return {
    dom,
    root,
    trigger: root.querySelector("[data-rui-select-trigger]") as HTMLElement,
    panel: root.querySelector("[data-rui-select-content]") as HTMLElement,
    value: root.querySelector("input") as HTMLInputElement,
    binding: bindSelect(root),
  };
}

test("custom Select opens, selects once with Enter and syncs hidden value", () => {
  const { dom, trigger, panel, value, binding } = setup();
  trigger.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.equal(panel.hidden, false);
  trigger.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  trigger.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.deepEqual(binding.controller.getState().collection.selectedIds, ["select-option-0"]);
  assert.equal(value.value, "one");
  assert.equal(panel.hidden, true);
  binding.destroy();
});

test("custom Select gives pointer ownership to hovered option and ignores disabled options", () => {
  const { dom, root, binding } = setup();
  binding.popup.open("pointer");
  const two = root.querySelector('[data-rui-option][data-value="two"]')!;
  two.dispatchEvent(new dom.window.Event("pointermove", { bubbles: true }));
  assert.equal(binding.controller.getState().collection.activeId, two.id);
  root.querySelector('[data-rui-option][data-value="disabled"]')!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(binding.controller.getState().collection.selectedIds, []);
  binding.destroy();
});

test("collection adapters request nearest scrolling for the active option", () => {
  const { binding, root } = setup();
  const option = root.querySelector('[data-rui-option][data-value="two"]') as HTMLElement;
  let scrollOptions: ScrollIntoViewOptions | undefined;
  option.scrollIntoView = (options?: ScrollIntoViewOptions) => { scrollOptions = options; };
  binding.controller.collection.setActive(option.id, "keyboard");
  assert.deepEqual(scrollOptions, { block: "nearest" });
  binding.destroy();
});
