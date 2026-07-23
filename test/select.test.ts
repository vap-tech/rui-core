import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { bindSelect } from "../src/select.js";

test("bindSelect reads native options and syncs selected value", () => {
  const dom = new JSDOM(`<select><option value="a">Alpha</option><option value="b">Beta</option><option value="c" disabled>Disabled</option></select>`);
  const select = dom.window.document.querySelector("select")! as HTMLSelectElement;
  select.value = "b";
  const binding = bindSelect(select);
  assert.deepEqual(binding.controller.getState().collection.selectedIds, ["b"]);
  assert.equal(select.options[1].getAttribute("aria-selected"), "true");
  assert.equal(binding.controller.select("c"), false);
  binding.destroy();
});

test("native change updates controller and refresh preserves current value", () => {
  const dom = new JSDOM(`<select><option value="a">Alpha</option><option value="b">Beta</option></select>`);
  const select = dom.window.document.querySelector("select")! as HTMLSelectElement;
  const binding = bindSelect(select);
  select.value = "b"; select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.deepEqual(binding.controller.getState().collection.selectedIds, ["b"]);
  select.add(new dom.window.Option("Gamma", "g")); binding.refresh();
  assert.equal(select.value, "b");
});

test("form reset restores initial value and programmatic selection emits events", async () => {
  const dom = new JSDOM(`<form><select><option value="a">Alpha</option><option value="b">Beta</option></select></form>`);
  const form = dom.window.document.querySelector("form")!;
  const select = form.querySelector("select")! as HTMLSelectElement;
  const binding = bindSelect(select);
  let inputEvents = 0; let changeEvents = 0;
  select.addEventListener("input", () => inputEvents++); select.addEventListener("change", () => changeEvents++);
  binding.controller.select("b"); assert.equal(select.value, "b"); assert.equal(inputEvents, 1); assert.equal(changeEvents, 1);
  form.dispatchEvent(new dom.window.Event("reset", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(select.value, "a");
  binding.destroy();
});

test("refreshes automatically when options are replaced", async () => {
  const dom = new JSDOM(`<select><option value="a">A</option></select>`);
  const select = dom.window.document.querySelector("select")! as HTMLSelectElement;
  const binding = bindSelect(select); select.append(new dom.window.Option("B", "b"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(binding.controller.collection.getItem("b")?.label, "B"); binding.destroy();
});

test("reset callback is harmless after destroy", async () => {
  const dom = new JSDOM(`<form><select><option value="a">A</option></select></form>`);
  const form = dom.window.document.querySelector("form")!;
  const binding = bindSelect(form.querySelector("select")! as HTMLSelectElement);
  form.dispatchEvent(new dom.window.Event("reset")); binding.destroy();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.ok(true);
});

test("works without MutationObserver and with empty option value", () => {
  const dom = new JSDOM(`<select><option value="x"></option></select>`);
  Object.defineProperty(dom.window, "MutationObserver", { value: undefined, configurable: true });
  const select = dom.window.document.querySelector("select")! as HTMLSelectElement;
  const binding = bindSelect(select);
  assert.equal(binding.controller.getState().collection.items[0]?.label, "");
  assert.equal(binding.controller.select("x"), false); binding.destroy();
});
