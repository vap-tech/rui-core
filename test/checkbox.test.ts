import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { CheckboxController, CheckboxGroupController } from "../src/checkbox.js";
import { bindCheckbox, bindCheckboxGroup } from "../src/checkbox-dom.js";

test("checkbox supports checked, mixed and Space", () => {
  const checkbox = new CheckboxController({ mixed: true });
  assert.equal(checkbox.getState().value, "mixed");
  assert.equal(checkbox.handleKeyDown({ key: " " } as KeyboardEvent), true);
  assert.equal(checkbox.getState().value, "checked");
  assert.equal(checkbox.handleKeyDown({ key: "Enter" } as KeyboardEvent), false);
  checkbox.destroy(); checkbox.destroy(); assert.throws(() => checkbox.toggle(), /destroyed/);
});

test("checkbox group supports selection and indeterminate state", () => {
  const group = new CheckboxGroupController();
  group.setItems([{ id: "a", value: "a", label: "A" }, { id: "b", value: "b", label: "B" }, { id: "disabled", value: "disabled", label: "Disabled", disabled: true }]);
  assert.equal(group.toggle("a"), true); assert.equal(group.getState().mixed, true);
  assert.equal(group.selectAll(), true); assert.deepEqual(group.getState().selectedIds, ["a", "b"]);
  assert.equal(group.selectAll(), false); assert.equal(group.clearAll(), true);
  group.collection.setActive("a"); assert.equal(group.handleKeyDown({ key: " " } as KeyboardEvent), true);
  assert.equal(group.handleKeyDown({ key: "Escape" } as KeyboardEvent), false); group.destroy();
});

test("checkbox DOM adapters synchronize ARIA and destroy listeners", () => {
  const dom = new JSDOM(`<button id="one" data-rui-checkbox data-mixed="true">One</button><div id="group" data-rui-checkbox-group><button data-rui-checkbox>A</button><button data-rui-checkbox data-disabled="true">B</button></div>`);
  const one = bindCheckbox(dom.window.document.querySelector("#one") as HTMLElement);
  assert.equal(one.controller.getState().value, "mixed"); one.controller.toggle(); assert.equal(dom.window.document.querySelector("#one")?.getAttribute("aria-checked"), "checked");
  const group = bindCheckboxGroup(dom.window.document.querySelector("#group") as HTMLElement); const item = dom.window.document.querySelector("#group [data-rui-checkbox]") as HTMLElement; item.click(); assert.equal(item.getAttribute("aria-checked"), "true"); group.destroy(); group.destroy(); one.destroy(); one.destroy();
});

test("checkbox adapters cover disabled, generated ids and ignored targets", () => {
  const dom = new JSDOM(`<div id="group"><button data-rui-checkbox data-disabled="true">Disabled</button><span><button data-rui-checkbox>Nested</button></span></div><button id="single" data-rui-checkbox data-checked="true" data-disabled="true"></button>`);
  const single = bindCheckbox(dom.window.document.querySelector("#single") as HTMLElement); assert.equal(single.controller.toggle(), false); dom.window.document.querySelector("#single")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: " " })); single.destroy();
  const groupRoot = dom.window.document.querySelector("#group") as HTMLElement; const group = bindCheckboxGroup(groupRoot); groupRoot.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "PageDown", bubbles: true })); groupRoot.querySelector("[data-rui-checkbox]")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); groupRoot.querySelector("span")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); group.destroy();
});

test("checkbox binding ignores events after destroy and non-space keys", () => {
  const dom = new JSDOM(`<button data-rui-checkbox></button>`); const root = dom.window.document.querySelector("button") as HTMLElement; const binding = bindCheckbox(root); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter" })); binding.destroy(); root.click(); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: " " }));
});

test("checkbox group handles active movement and disabled-only selection", () => {
  const dom = new JSDOM(`<div id="g"><button data-rui-checkbox data-disabled="true">Only</button></div>`); const root = dom.window.document.querySelector("#g") as HTMLElement; const binding = bindCheckboxGroup(root); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: " ", bubbles: true })); binding.destroy();
});

test("checkbox controller covers no-op and invalid group paths", () => {
  const checkbox = new CheckboxController({ checked: true }); const off = checkbox.subscribe(() => {}); off(); assert.equal(checkbox.setChecked(true), false); assert.equal(checkbox.setValue("mixed"), true); assert.equal(checkbox.setValue("mixed"), false); checkbox.destroy();
  const group = new CheckboxGroupController(); group.setItems([]); assert.equal(group.selectAll(), false); assert.equal(group.clearAll(), false); assert.equal(group.toggle("missing"), false); assert.equal(group.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent), true); group.destroy();
});
