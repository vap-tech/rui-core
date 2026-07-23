import assert from "node:assert/strict";
import test from "node:test";
import { TabsController } from "../src/tabs.js";

const items = [{ id: "one", value: 1, label: "One" }, { id: "two", value: 2, label: "Two" }, { id: "three", value: 3, label: "Three" }];

test("automatic tabs activate during keyboard navigation", () => {
  const tabs = new TabsController(); tabs.setItems(items); tabs.activate("one"); tabs.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); assert.equal(tabs.getState().selectedId, "two"); tabs.handleKeyDown({ key: "End" } as KeyboardEvent); assert.equal(tabs.getState().selectedId, "three");
});

test("manual tabs wait for Enter/Space activation", () => {
  const tabs = new TabsController("manual"); tabs.setItems(items); tabs.activate("one"); tabs.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); assert.equal(tabs.getState().activeId, "two"); assert.equal(tabs.getState().selectedId, "one"); tabs.handleKeyDown({ key: "Enter" } as KeyboardEvent); assert.equal(tabs.getState().selectedId, "two"); tabs.destroy(); assert.throws(() => tabs.activate("one"), /destroyed/);
});

test("tabs reject invalid activation and cover navigation guards", () => {
  const tabs = new TabsController("manual"); tabs.setItems([{ id: "one", value: 1, label: "One", disabled: true }]);
  assert.equal(tabs.activate("missing"), false); assert.equal(tabs.activate("one"), false);
  for (const key of ["ArrowLeft", "ArrowUp", "Home", "End", "x"]) assert.equal(tabs.handleKeyDown({ key } as KeyboardEvent), false);
  tabs.handleKeyDown({ key: "Enter" } as KeyboardEvent); tabs.destroy(); tabs.destroy();
});
