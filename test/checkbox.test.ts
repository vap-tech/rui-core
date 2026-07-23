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
