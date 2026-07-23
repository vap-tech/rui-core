import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindCombobox } from "../src/combobox-dom.js";

function setup() {
  const dom = new JSDOM(`<div id="combo"><input data-rui-input><div data-rui-popup><div data-rui-option id="one">One</div><div data-rui-option id="two">Two</div></div></div>`);
  const root = dom.window.document.querySelector("#combo") as HTMLElement;
  return { dom, root, input: root.querySelector("input") as HTMLInputElement, popup: root.querySelector("[data-rui-popup]") as HTMLElement, binding: bindCombobox(root) };
}

test("bindCombobox wires ARIA and keyboard selection", () => {
  const { dom, input, popup, binding } = setup();
  assert.equal(input.getAttribute("role"), "combobox");
  assert.equal(input.getAttribute("aria-haspopup"), "listbox");
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  assert.equal(input.getAttribute("aria-expanded"), "true");
  assert.equal(input.getAttribute("aria-activedescendant"), "one");
  input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.equal(binding.controller.getState().collection.selectedIds[0], "one");
  assert.equal(popup.hidden, true);
});

test("clicking option selects and destroy removes integration", () => {
  const { dom, root, input, binding } = setup();
  binding.controller.setOpen(true); binding.controller.setInputValue("");
  const option = root.querySelector("#two")!;
  option.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(binding.controller.getState().collection.selectedIds, ["two"]);
  binding.destroy();
  assert.throws(() => binding.popup.open(), /destroyed/);
  assert.equal(input.getAttribute("aria-expanded"), "false");
});

test("rejects incomplete markup", () => {
  const dom = new JSDOM(`<div></div>`);
  assert.throws(() => bindCombobox(dom.window.document.body.firstElementChild as HTMLElement), /requires/);
});

test("supports select-only ARIA and refreshes generated option ids", () => {
  const dom = new JSDOM(`<div id="combo"><input data-rui-input><div data-rui-popup><div data-rui-option>Generated</div></div></div>`);
  const root = dom.window.document.querySelector("#combo") as HTMLElement;
  const binding = bindCombobox(root, { mode: "select-only" });
  const input = root.querySelector("input")!;
  assert.equal(input.getAttribute("aria-autocomplete"), "none");
  binding.refresh(); binding.popup.open("pointer");
  assert.equal(input.getAttribute("aria-expanded"), "true");
  binding.destroy();
});

test("handles existing popup id, disabled option, input and outside click", () => {
  const dom = new JSDOM(`<div id="combo"><input data-rui-input><div id="choices" data-rui-popup><div data-rui-option data-disabled="true">Disabled</div><div data-rui-option id="ok">Okay</div></div></div><div id="outside"></div>`);
  const root = dom.window.document.querySelector("#combo") as HTMLElement;
  const binding = bindCombobox(root); const input = root.querySelector("input")!;
  assert.equal(input.getAttribute("aria-controls"), "choices");
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  binding.popup.open("pointer");
  root.querySelector("[data-disabled]")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(binding.controller.getState().collection.selectedIds, []);
  dom.window.document.querySelector("#outside")!.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
  assert.equal(binding.controller.getState().open, false); binding.destroy();
});

test("covers generated ids and popup close reasons", () => {
  const dom = new JSDOM(`<div><input data-rui-input><div data-rui-popup><div data-rui-option id="x">X</div></div></div>`);
  const root = dom.window.document.body.firstElementChild as HTMLElement;
  const binding = bindCombobox(root);
  assert.match(binding.popup.getState().open ? "open" : "closed", /closed/);
  binding.popup.open("programmatic"); binding.popup.close("escape"); binding.popup.open("pointer"); binding.popup.close("select");
  binding.destroy(); binding.destroy(); binding.refresh();
});

test("sets listbox ARIA for multiple selection and clears disabled state", () => {
  const dom = new JSDOM(`<div data-rui-combobox><input data-rui-input><div data-rui-popup><div data-rui-option data-disabled="true">Disabled</div></div></div>`);
  const root = dom.window.document.querySelector("[data-rui-combobox]") as HTMLElement;
  const binding = bindCombobox(root, { selectionMode: "multiple" });
  const popup = root.querySelector("[data-rui-popup]")!;
  assert.equal(popup.getAttribute("role"), "listbox"); assert.equal(popup.getAttribute("aria-multiselectable"), "true");
  const option = popup.firstElementChild! as HTMLElement; option.dataset.disabled = "false"; option.removeAttribute("aria-disabled"); binding.refresh();
  assert.equal(option.hasAttribute("aria-disabled"), false); binding.destroy();
});

test("opens on input focus only when configured", () => {
  const first = setup(); first.input.dispatchEvent(new first.dom.window.Event("focus", { bubbles: true })); assert.equal(first.binding.controller.getState().open, false); first.binding.destroy();
  const dom = new JSDOM(`<div><input data-rui-input><div data-rui-popup><div data-rui-option>One</div></div></div>`);
  const root = dom.window.document.body.firstElementChild as HTMLElement;
  const binding = bindCombobox(root, { openOnFocus: true }); const input = root.querySelector("input")!;
  input.dispatchEvent(new dom.window.Event("focus", { bubbles: true })); assert.equal(binding.controller.getState().open, true); binding.destroy();
});

test("refreshes options when popup fragment changes", async () => {
  const { dom, popup, binding } = setup();
  const option = dom.window.document.createElement("div"); option.dataset.ruiOption = ""; option.id = "three"; option.textContent = "Three"; popup.append(option);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(binding.controller.getState().collection.items.length, 3); binding.destroy();
});
