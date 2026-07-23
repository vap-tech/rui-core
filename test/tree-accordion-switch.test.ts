import assert from "node:assert/strict";
import test from "node:test";
import { TreeViewController } from "../src/tree-view.js";
import { AccordionController } from "../src/accordion.js";
import { SwitchController } from "../src/switch.js";
import { RadioGroupController } from "../src/radio-group.js";
import { ToggleGroupController } from "../src/toggle-group.js";

test("tree view navigates visible hierarchy and expands nodes", () => { const tree = new TreeViewController(); tree.setItems([{ id: "root", value: "root", label: "Root" }, { id: "child", value: "child", label: "Child", parentId: "root" }, { id: "other", value: "other", label: "Other" }]); tree.collection.setActive("root"); assert.equal(tree.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent), true); assert.deepEqual(tree.getState().expandedIds, ["root"]); tree.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent); assert.equal(tree.getState().activeId, "child"); tree.handleKeyDown({ key: "ArrowLeft" } as KeyboardEvent); assert.equal(tree.getState().activeId, "root"); tree.destroy(); });
test("accordion supports single/multiple and disabled items", () => { const accordion = new AccordionController(); accordion.setItems([{ id: "one" }, { id: "two" }, { id: "disabled", disabled: true }]); assert.equal(accordion.toggle("one"), true); accordion.toggle("two"); assert.deepEqual(accordion.getState().openIds, ["two"]); assert.equal(accordion.toggle("disabled"), false); accordion.destroy(); });
test("switch toggles by keyboard and respects disabled", () => { const toggle = new SwitchController(); assert.equal(toggle.handleKeyDown({ key: " " } as KeyboardEvent), true); assert.equal(toggle.getState().checked, true); const disabled = new SwitchController({ disabled: true }); assert.equal(disabled.toggle(), false); toggle.destroy(); disabled.destroy(); });

test("new controllers cover guards and alternate paths", () => {
  const radio = new RadioGroupController(); radio.setItems([{ id: "one", value: 1, label: "One" }]); assert.equal(radio.handleKeyDown({ key: "Escape" } as KeyboardEvent), false); assert.equal(radio.select("one"), true); assert.equal(radio.select("one"), false); assert.equal(radio.handleKeyDown({ key: " " } as KeyboardEvent), false); radio.setItems([]); assert.equal(radio.select("missing"), false); radio.destroy(); radio.destroy(); assert.throws(() => radio.select("x"), /destroyed/);
  const toggle = new ToggleGroupController("single"); toggle.setItems([{ id: "one", value: 1, label: "One" }]); assert.equal(toggle.handleKeyDown({ key: "Escape" } as KeyboardEvent), false); assert.equal(toggle.toggle("missing"), false); toggle.collection.setActive("one"); assert.equal(toggle.handleKeyDown({ key: " " } as KeyboardEvent), true); toggle.destroy(); toggle.destroy(); assert.throws(() => toggle.toggle("x"), /destroyed/);
  const tree = new TreeViewController(); tree.setItems([{ id: "one", value: 1, label: "One" }]); tree.collection.setActive("one"); assert.equal(tree.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent), false); assert.equal(tree.handleKeyDown({ key: "ArrowLeft" } as KeyboardEvent), false); tree.handleKeyDown({ key: "Home" } as KeyboardEvent); tree.handleKeyDown({ key: "End" } as KeyboardEvent); assert.equal(tree.handleKeyDown({ key: "Escape" } as KeyboardEvent), false); tree.destroy(); tree.destroy(); assert.throws(() => tree.select("x"), /destroyed/);
  const accordion = new AccordionController({ multiple: true }); accordion.setItems([{ id: "one" }]); assert.equal(accordion.toggle("missing"), false); accordion.toggle("one"); accordion.toggle("one"); accordion.destroy(); accordion.destroy();
  const toggleSwitch = new SwitchController({ checked: true }); assert.equal(toggleSwitch.setChecked(true), false); assert.equal(toggleSwitch.handleKeyDown({ key: "Escape" } as KeyboardEvent), false); toggleSwitch.destroy(); toggleSwitch.destroy();
});

test("tree view covers public expansion and subscription lifecycle", () => {
  const tree = new TreeViewController(); let changes = 0; const off = tree.subscribe(() => changes++);
  tree.setItems([{ id: "root", value: "root", label: "Root" }, { id: "child", value: "child", label: "Child", parentId: "root" }]);
  assert.equal(tree.expand("root"), true); assert.equal(tree.expand("root"), false); assert.equal(tree.toggle("root"), true); assert.equal(tree.toggle("root"), true); assert.equal(tree.collapse("root"), true); assert.equal(tree.collapse("root"), false); off(); assert.ok(changes > 0); tree.destroy();
});
