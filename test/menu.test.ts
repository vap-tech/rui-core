import assert from "node:assert/strict";
import test from "node:test";
import { MenuController } from "../src/menu.js";

test("menu opens, navigates, selects and closes", () => {
  const menu = new MenuController<string>(); menu.setItems([{ id: "one", value: "one", label: "One" }, { id: "two", value: "two", label: "Two" }]); menu.open();
  assert.equal(menu.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent), true); assert.equal(menu.getState().activeId, "one");
  assert.equal(menu.handleKeyDown({ key: "Enter" } as KeyboardEvent), true); assert.equal(menu.selectActive(), "one");
  menu.close("escape"); assert.equal(menu.getState().open, false); menu.destroy();
});

test("menu skips disabled items and handles closed/destroyed states", () => {
  const menu = new MenuController(); menu.setItems([{ id: "disabled", value: 1, label: "Disabled", disabled: true }, { id: "ok", value: 2, label: "OK" }]);
  assert.equal(menu.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent), false); menu.open(); menu.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent); assert.equal(menu.getState().activeId, "ok"); menu.handleKeyDown({ key: "Escape" } as KeyboardEvent); menu.toggle(); menu.toggle(); menu.destroy(); assert.throws(() => menu.open(), /destroyed/);
});
