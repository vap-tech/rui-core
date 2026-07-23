import assert from "node:assert/strict";
import test from "node:test";
import { CommandPaletteController } from "../src/command-palette.js";

test("command palette delegates filtering, selection and lifecycle", () => {
  const palette = new CommandPaletteController({ freeSolo: true }); palette.setItems([{ id: "one", value: "one", label: "One" }, { id: "two", value: "two", label: "Two" }]);
  assert.equal(palette.open(), true); assert.equal(palette.open(), false); palette.combobox.setInputValue("tw"); palette.handleKeyDown({ key: "ArrowDown", isComposing: false } as KeyboardEvent); palette.handleKeyDown({ key: "Enter", isComposing: false } as KeyboardEvent); assert.deepEqual(palette.getState().combobox.collection.selectedIds, ["two"]); assert.equal(palette.close(), false); palette.destroy(); palette.destroy(); assert.throws(() => palette.open(), /destroyed/);
});
