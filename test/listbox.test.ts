import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindListbox } from "../src/listbox.js";

function setup() {
  const dom = new JSDOM(`<div id="list"><div data-rui-option id="one">One</div><div data-rui-option id="two" data-disabled="true">Two</div><div data-rui-option id="three">Three</div></div>`);
  const root = dom.window.document.querySelector("#list") as HTMLElement;
  return { dom, root, binding: bindListbox(root) };
}

test("bindListbox applies roles and selection state", () => {
  const { root, binding } = setup();
  const one = root.querySelector("#one")!;
  assert.equal(root.getAttribute("role"), "listbox");
  assert.equal(one.getAttribute("role"), "option");
  binding.controller.select("one");
  assert.equal(one.getAttribute("aria-selected"), "true");
  assert.equal(one.hasAttribute("data-selected"), true);
  binding.destroy();
});

test("pointer and keyboard use the same active state", () => {
  const { dom, root, binding } = setup();
  const three = root.querySelector("#three")!;
  three.dispatchEvent(new dom.window.Event("pointermove", { bubbles: true }));
  assert.equal(binding.controller.getState().activeId, "three");
  root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  assert.equal(binding.controller.getState().activeId, "one");
  binding.destroy();
});

test("disabled options cannot become active or selected", () => {
  const { dom, root, binding } = setup();
  const two = root.querySelector("#two")!;
  two.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.equal(binding.controller.getState().activeId, null);
  assert.deepEqual(binding.controller.getState().selectedIds, []);
  assert.equal(two.getAttribute("aria-disabled"), "true");
  binding.destroy();
});

test("handles Home, End, Enter and refresh/destroy idempotently", () => {
  const { dom, root, binding } = setup();
  root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "End", bubbles: true }));
  assert.equal(binding.controller.getState().activeId, "three");
  root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Home", bubbles: true }));
  assert.equal(binding.controller.getState().activeId, "one");
  root.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.deepEqual(binding.controller.getState().selectedIds, ["one"]);
  const nested = root.querySelector("#one")!; nested.dispatchEvent(new dom.window.Event("pointermove", { bubbles: true }));
  binding.refresh(); binding.destroy(); binding.destroy(); binding.refresh();
});

test("supports multiple selection and ignores unrelated click targets", () => {
  const dom = new JSDOM(`<div id="list"><span id="outside">outside</span><div data-rui-option data-selectable="false">Group</div><div data-rui-option id="one">One</div></div>`);
  const root = dom.window.document.querySelector("#list") as HTMLElement;
  const binding = bindListbox(root, { selectionMode: "multiple" });
  root.querySelector("#outside")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  root.querySelector("#one")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.equal(root.getAttribute("aria-multiselectable"), "true");
  assert.deepEqual(binding.controller.getState().selectedIds, ["one"]); binding.destroy();
});

test("uses item mapping callbacks and handles options without DOM elements", () => {
  const dom = new JSDOM(`<div id="list"><div data-rui-option data-value="raw">Visible</div></div>`);
  const root = dom.window.document.querySelector("#list") as HTMLElement;
  const binding = bindListbox(root, { getItemId: () => "mapped", getItemValue: () => "value", getItemLabel: () => "Label" });
  assert.equal(binding.controller.getItem("mapped")?.label, "Label");
  binding.controller.setItems([{ id: "virtual", value: "v", label: "Virtual", element: null }]);
  assert.equal(binding.controller.select("virtual"), true); binding.destroy();
});

test("refreshes automatically after option insertion", async () => {
  const { dom, root, binding } = setup();
  const option = dom.window.document.createElement("div"); option.dataset.ruiOption = ""; option.id = "four"; option.textContent = "Four"; root.append(option);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(binding.controller.getItem("four")?.label, "Four"); binding.destroy();
});
