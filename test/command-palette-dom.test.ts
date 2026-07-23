import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindCommandPalette } from "../src/command-palette-dom.js";

test("bindCommandPalette wires keyboard, selection and dynamic commands", async () => {
  const dom = new JSDOM(`<div id="palette"><input data-rui-input><div data-rui-popup><button data-rui-command data-value="one">One</button><button data-rui-command data-value="two">Two</button></div></div>`); const root = dom.window.document.querySelector("#palette") as HTMLElement; const binding = bindCommandPalette(root); const input = root.querySelector("input") as HTMLInputElement;
  binding.controller.open(); input.value = "Two"; input.dispatchEvent(new dom.window.Event("input", { bubbles: true })); input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); assert.deepEqual(binding.controller.getState().combobox.collection.selectedIds, ["rui-palette-command-1"]);
  const item = dom.window.document.createElement("button"); item.dataset.ruiCommand = ""; item.textContent = "Three"; root.querySelector("[data-rui-popup]")!.append(item); await new Promise((resolve) => setTimeout(resolve, 0)); assert.equal(binding.controller.getState().combobox.collection.items.length, 3); binding.destroy();
});

test("command palette covers inactive, disabled, nested clicks and idempotent refresh", () => {
  const dom = new JSDOM(`<div id="palette"><input data-rui-input><div data-rui-popup><button data-rui-command data-disabled="true">Disabled</button><span><button data-rui-command>Nested</button></span></div></div>`); const root = dom.window.document.querySelector("#palette") as HTMLElement; const binding = bindCommandPalette(root); const input = root.querySelector("input") as HTMLInputElement; input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); root.querySelector("span")!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); binding.refresh(); binding.destroy(); binding.refresh(); binding.destroy();
});

test("command palette covers active descendant removal and direct command click", () => {
  const dom = new JSDOM(`<div id="palette"><input data-rui-input><div data-rui-popup><button data-rui-command data-value="one">One</button></div></div>`); const root = dom.window.document.querySelector("#palette") as HTMLElement; const binding = bindCommandPalette(root); const popup = root.querySelector("[data-rui-popup]") as HTMLElement; const input = root.querySelector("input") as HTMLInputElement; binding.controller.open(); input.dispatchEvent(new dom.window.Event("input", { bubbles: true })); const command = popup.querySelector("[data-rui-command]") as HTMLElement; command.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); popup.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); binding.destroy();
});
