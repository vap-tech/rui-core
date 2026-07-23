import assert from "node:assert/strict";
import test from "node:test";
import { CollectionController } from "../src/collection.js";

const items = [
  { id: "a", value: "a", label: "Alpha" },
  { id: "b", value: "b", label: "Beta", disabled: true },
  { id: "c", value: "c", label: "Category", selectable: false },
  { id: "d", value: "d", label: "Delta" },
];

test("navigates through selectable items and skips disabled/service items", () => {
  const collection = new CollectionController({ loopNavigation: true });
  collection.setItems(items);
  assert.equal(collection.next(), "a");
  assert.equal(collection.next(), "d");
  assert.equal(collection.next(), "a");
  assert.equal(collection.previous(), "d");
});

test("keeps active and selected state independent", () => {
  const collection = new CollectionController();
  collection.setItems(items);
  collection.setActive("a", "keyboard");
  collection.select("a");
  collection.setActive("d", "keyboard");
  assert.equal(collection.getState().activeId, "d");
  assert.deepEqual(collection.getState().selectedIds, ["a"]);
  assert.equal(collection.select("b"), false);
});

test("supports multiple selection in selection order", () => {
  const collection = new CollectionController({ selectionMode: "multiple" });
  collection.setItems(items);
  collection.select("d"); collection.select("a");
  assert.deepEqual(collection.getState().selectedIds, ["d", "a"]);
  collection.select("d");
  assert.deepEqual(collection.getState().selectedIds, ["a"]);
});

test("repairs active item when it becomes unavailable", () => {
  const collection = new CollectionController();
  collection.setItems(items); collection.setActive("d");
  collection.updateItem("d", { hidden: true });
  assert.equal(collection.getState().activeId, "a");
});

test("emits changes and removes listeners on destroy", () => {
  const collection = new CollectionController();
  let changes = 0;
  collection.subscribe(() => changes++);
  collection.setItems(items); collection.setActive("a");
  assert.equal(changes, 2);
  collection.destroy();
  assert.throws(() => collection.next(), /destroyed/);
});

test("handles empty collections and rejects invalid operations", () => {
  const collection = new CollectionController({ allowEmptySelection: false });
  collection.setItems([]);
  assert.equal(collection.next(), null); assert.equal(collection.first(), null);
  assert.equal(collection.setActive("missing"), false);
  assert.equal(collection.select("missing"), false);
  assert.equal(collection.clearSelection(), true);
  assert.throws(() => collection.setItems([{ id: "x", value: 1, label: "x" }, { id: "x", value: 2, label: "duplicate" }]), /unique/);
});

test("updates and removes items safely", () => {
  const collection = new CollectionController();
  collection.setItems(items); collection.addItem({ id: "e", value: "e", label: "Echo" });
  assert.equal(collection.getItem("e")?.label, "Echo");
  collection.updateItem("missing", { label: "ignored" }); collection.removeItem("e");
  collection.select("a"); assert.equal(collection.select("a"), false);
  assert.equal(collection.deselect("missing"), false); collection.clearSelection(); assert.equal(collection.clearSelection(), false);
});

test("supports collection order for multiple selection", () => {
  const collection = new CollectionController({ selectionMode: "multiple", selectionOrder: "collection" });
  collection.setItems(items); collection.select("d"); collection.select("a");
  assert.deepEqual(collection.getState().selectedIds, ["a", "d"]);
});
