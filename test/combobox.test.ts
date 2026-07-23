import assert from "node:assert/strict";
import test from "node:test";
import { ComboboxController } from "../src/combobox.js";
import { getComboboxAria, getListboxAria, getOptionAria } from "../src/aria.js";

const items = [
  { id: "apple", value: "apple", label: "Apple" },
  { id: "banana", value: "banana", label: "Banana" },
  { id: "apricot", value: "apricot", label: "Apricot" },
];
const key = (key: string, isComposing = false) => ({ key, isComposing } as KeyboardEvent);

test("filters without selecting and navigates with arrows", () => {
  const combo = new ComboboxController<string>();
  combo.setItems(items); combo.setInputValue("ap");
  assert.deepEqual(combo.getState().visibleItems.map((item) => item.id), ["apple", "apricot"]);
  assert.equal(combo.getState().collection.selectedIds.length, 0);
  combo.handleKeyDown(key("ArrowDown"));
  assert.equal(combo.getState().collection.activeId, "apple");
});

test("Enter selects active item and closes popup", () => {
  const combo = new ComboboxController<string>();
  combo.setItems(items); combo.setOpen(true); combo.handleKeyDown(key("ArrowDown"));
  combo.handleKeyDown(key("Enter"));
  assert.deepEqual(combo.getState().collection.selectedIds, ["apple"]);
  assert.equal(combo.getState().inputValue, "Apple");
  assert.equal(combo.getState().open, false);
});

test("Escape closes first and optionally clears second", () => {
  const combo = new ComboboxController({ clearOnEscape: true });
  combo.setItems(items); combo.setInputValue("banana"); combo.setOpen(true);
  combo.handleKeyDown(key("Escape"));
  assert.equal(combo.getState().open, false);
  combo.handleKeyDown(key("Escape"));
  assert.equal(combo.getState().inputValue, "");
});

test("freeSolo does not select text automatically", () => {
  const combo = new ComboboxController({ freeSolo: true });
  combo.setItems(items); combo.setInputValue("custom");
  assert.equal(combo.getState().inputValue, "custom");
  assert.deepEqual(combo.getState().collection.selectedIds, []);
});

test("composition events are ignored", () => {
  const combo = new ComboboxController(); combo.setItems(items);
  const event = key("ArrowDown", true);
  assert.equal(combo.handleKeyDown(event), false);
  assert.equal(combo.getState().collection.activeId, null);
});

test("supports custom filtering, Home/End and ArrowUp", () => {
  const combo = new ComboboxController({ filterOptions: (values, text) => values.filter((item) => item.label.toLowerCase().startsWith(text.toLowerCase())) });
  combo.setItems(items); combo.setInputValue("A"); combo.setOpen(true);
  combo.handleKeyDown(key("End")); assert.equal(combo.getState().collection.activeId, "apricot");
  combo.handleKeyDown(key("Home")); assert.equal(combo.getState().collection.activeId, "apple");
  combo.handleKeyDown(key("ArrowUp")); assert.equal(combo.getState().collection.activeId, "apple");
  combo.toggle(); combo.toggle(); combo.destroy();
});

test("does not open on input or close after selection when configured", () => {
  const combo = new ComboboxController({ openOnInput: false, closeOnSelect: false });
  combo.setItems(items); combo.setInputValue("Apple"); assert.equal(combo.getState().open, false);
  combo.setOpen(true); combo.handleKeyDown(key("ArrowDown")); combo.select("apple");
  assert.equal(combo.getState().open, true);
  assert.equal(combo.handleKeyDown(key("Escape")), true);
  assert.equal(combo.handleKeyDown(key("Escape")), false);
});

test("typeahead finds labels and repeats a character cyclically", () => {
  const combo = new ComboboxController({ mode: "select-only", typeahead: true, typeaheadTimeout: 20 });
  combo.setItems([{ id: "one", value: "one", label: "One" }, { id: "orange", value: "orange", label: "Orange" }, { id: "two", value: "two", label: "Two" }]);
  assert.equal(combo.handleKeyDown(key("o")), true); assert.equal(combo.getState().collection.activeId, "one");
  assert.equal(combo.handleKeyDown(key("o")), true); assert.equal(combo.getState().collection.activeId, "orange");
  combo.destroy();
});

test("typeahead ignores unmatched characters and resets its buffer", async () => {
  const combo = new ComboboxController({ mode: "select-only", typeahead: true, typeaheadTimeout: 5 });
  combo.setItems([{ id: "one", value: "one", label: "One" }]);
  assert.equal(combo.handleKeyDown(key("x")), false);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(combo.handleKeyDown(key("o")), true);
  combo.destroy();
});

test("supports configurable PageUp and PageDown navigation", () => {
  const combo = new ComboboxController({ pageSize: 2 });
  combo.setItems(Array.from({ length: 6 }, (_, index) => ({ id: String(index), value: index, label: `Item ${index}` })));
  combo.setOpen(true); combo.handleKeyDown(key("ArrowDown"));
  combo.handleKeyDown(key("PageDown")); assert.equal(combo.getState().collection.activeId, "2");
  combo.handleKeyDown(key("PageDown")); assert.equal(combo.getState().collection.activeId, "4");
  combo.handleKeyDown(key("PageUp")); assert.equal(combo.getState().collection.activeId, "2");
});

test("confirms freeSolo text without selecting an option", () => {
  const combo = new ComboboxController({ freeSolo: true });
  combo.setItems(items); combo.setInputValue("custom"); combo.setOpen(true);
  assert.equal(combo.handleKeyDown(key("Enter")), true);
  assert.equal(combo.getState().freeSoloValue, "custom");
  assert.deepEqual(combo.getState().collection.selectedIds, []);
  assert.equal(combo.getState().open, false);
});

test("does not confirm empty or non-freeSolo text", () => {
  const combo = new ComboboxController(); combo.setItems(items); combo.setInputValue("custom"); combo.setOpen(true);
  assert.equal(combo.handleKeyDown(key("Enter")), false); assert.equal(combo.getState().freeSoloValue, null);
});

test("Tab does not select by default but can select when configured", () => {
  const defaultCombo = new ComboboxController(); defaultCombo.setItems(items); defaultCombo.setOpen(true); defaultCombo.handleKeyDown(key("ArrowDown"));
  assert.equal(defaultCombo.handleKeyDown(key("Tab")), false); assert.deepEqual(defaultCombo.getState().collection.selectedIds, []);
  const configured = new ComboboxController({ selectOnTab: true }); configured.setItems(items); configured.setOpen(true); configured.handleKeyDown(key("ArrowDown"));
  assert.equal(configured.handleKeyDown(key("Tab")), true); assert.deepEqual(configured.getState().collection.selectedIds, ["apple"]);
});

test("emits a unified change payload", () => {
  const combo = new ComboboxController({ openOnInput: false }); let payload: any;
  combo.subscribe((_state, reason, change) => { if (reason === "input") payload = change; });
  combo.setInputValue("abc");
  assert.equal(payload.reason, "input"); assert.equal(payload.event, null); assert.equal(payload.previousState.inputValue, ""); assert.equal(payload.state.inputValue, "abc");
});

test("ARIA adapter returns framework-independent attributes", () => {
  assert.deepEqual(getComboboxAria({ expanded: true, activeId: "one", popupId: "list" })["aria-activedescendant"], "one");
  assert.equal("aria-activedescendant" in getComboboxAria({ expanded: false, activeId: null, popupId: "list" }), false);
  assert.deepEqual(getComboboxAria({ expanded: false, activeId: null, popupId: "list", autocomplete: "none" })["aria-autocomplete"], "none");
  assert.deepEqual(getListboxAria(true), { role: "listbox", "aria-multiselectable": "true" });
  assert.deepEqual(getListboxAria(false), { role: "listbox" });
  assert.equal(getOptionAria({ id: "x", value: "x", label: "X", disabled: true }, false)["aria-disabled"], "true");
  assert.equal("aria-disabled" in getOptionAria({ id: "y", value: "y", label: "Y" }, true), false);
});

test("composition lifecycle defers input handling until composition ends", () => {
  const combo = new ComboboxController(); combo.setItems(items); combo.handleCompositionStart();
  combo.setInputValue("тест"); assert.equal(combo.getState().inputValue, "тест");
  assert.equal(combo.handleKeyDown(key("ArrowDown")), false); combo.handleCompositionEnd("готово"); assert.equal(combo.getState().inputValue, "готово");
});

test("autoHighlight activates first visible option without selecting it", () => {
  const combo = new ComboboxController({ autoHighlight: true }); combo.setItems(items); combo.setOpen(true);
  assert.equal(combo.getState().collection.activeId, "apple"); assert.deepEqual(combo.getState().collection.selectedIds, []);
});
