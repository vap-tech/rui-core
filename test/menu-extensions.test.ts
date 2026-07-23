import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { MenuController } from "../src/menu.js";
import { ContextMenuController, MenubarController } from "../src/menu-extensions.js";
import { bindContextMenu, bindMenubar } from "../src/menu-extensions-dom.js";

test("menubar navigates menus and opens active menu", () => {
  const first = new MenuController(); const second = new MenuController(); const bar = new MenubarController([first, second]);
  assert.equal(bar.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent), true); assert.equal(bar.getState().activeIndex, 1); assert.equal(bar.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent), true); assert.equal(second.getState().open, true); assert.equal(bar.handleKeyDown({ key: "Escape" } as KeyboardEvent), true); assert.equal(second.getState().open, false); bar.destroy();
});

test("context menu opens at pointer or keyboard position", () => {
  const context = new ContextMenuController(); const event = { clientX: 12, clientY: 24, preventDefault() {} } as MouseEvent; assert.equal(context.handleContextMenu(event), true); assert.deepEqual(context.getState(), { open: true, x: 12, y: 24 }); assert.equal(context.handleKeyDown({ key: "Escape" } as KeyboardEvent), true); context.handleKeyDown({ key: "F10", shiftKey: true } as KeyboardEvent); assert.deepEqual([context.getState().x, context.getState().y], [0, 0]); context.destroy();
});

test("menu extension DOM bindings wire events and cleanup", () => {
  const dom = new JSDOM(`<div id="bar" data-rui-menubar><div data-rui-menu><button data-rui-menuitem>One</button></div><div data-rui-menu><button data-rui-menuitem>Two</button></div></div><div id="ctx" data-rui-context-menu><div data-rui-menu><button data-rui-menuitem>Action</button></div></div>`);
  const barRoot = dom.window.document.querySelector("#bar") as HTMLElement; const bar = bindMenubar(barRoot); barRoot.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); assert.equal(bar.controller.getState().activeIndex, 1); bar.destroy();
  const contextRoot = dom.window.document.querySelector("#ctx") as HTMLElement; const context = bindContextMenu(contextRoot); contextRoot.dispatchEvent(new dom.window.MouseEvent("contextmenu", { bubbles: true, clientX: 5, clientY: 6 })); assert.equal(context.controller.getState().open, true); context.destroy(); context.destroy();
});

test("menu extensions cover invalid indices, repeated transitions and keyboard guards", () => {
  const empty = new MenubarController(); assert.equal(empty.setActive(0), false); assert.equal(empty.open(), false); assert.equal(empty.handleKeyDown({ key: "x" } as KeyboardEvent), false); empty.destroy();
  const one = new MenuController(); const two = new MenuController(); const bar = new MenubarController([one, two]); assert.equal(bar.open(1), true); assert.equal(bar.open(1), true); bar.handleKeyDown({ key: "ArrowLeft" } as KeyboardEvent); bar.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); assert.equal(bar.close(), true); assert.equal(bar.close(), false); bar.destroy();
  const context = new ContextMenuController(); assert.equal(context.close(), false); assert.equal(context.handleKeyDown({ key: "x" } as KeyboardEvent), false); context.destroy();
});

test("menu bindings support direct context menu root and empty menubar", () => {
  const dom = new JSDOM(`<div id="empty" data-rui-menubar></div><div id="direct" data-rui-context-menu data-rui-menu><button data-rui-menuitem>Action</button></div>`); const empty = bindMenubar(dom.window.document.querySelector("#empty") as HTMLElement); empty.controller.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); empty.destroy(); const direct = bindContextMenu(dom.window.document.querySelector("#direct") as HTMLElement); dom.window.document.querySelector("#direct")!.dispatchEvent(new dom.window.MouseEvent("contextmenu", { bubbles: true, clientX: 1, clientY: 2 })); direct.destroy();
});

test("menubar handles invalid open and context menu delegation", () => {
  const menu = new MenuController(); const bar = new MenubarController([menu]); assert.equal(bar.setActive(2), false); assert.equal(bar.open(2), false); assert.equal(bar.handleKeyDown({ key: "ArrowLeft" } as KeyboardEvent), true); bar.destroy(); const context = new ContextMenuController(new MenuController()); assert.equal(context.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent), false); context.destroy();
});

test("menubar transitions from closed with arrow keys", () => {
  const first = new MenuController(); const second = new MenuController(); const bar = new MenubarController([first, second]); bar.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); assert.equal(bar.getState().openIndex, null); bar.handleKeyDown({ key: "ArrowDown" } as KeyboardEvent); bar.handleKeyDown({ key: "ArrowLeft" } as KeyboardEvent); bar.destroy();
});

test("menubar covers open menu switching and unhandled keys", () => {
  const first = new MenuController(); const second = new MenuController(); const bar = new MenubarController([first, second]); bar.open(0); bar.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); assert.equal(second.getState().open, true); assert.equal(bar.handleKeyDown({ key: "Home" } as KeyboardEvent), false); bar.close(); bar.destroy();
});

test("menubar covers listener lifecycle and wrapped menu transitions", () => {
  const first = new MenuController(); const second = new MenuController(); const bar = new MenubarController([first, second]); const off = bar.subscribe(() => {}); off(); bar.open(0); bar.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent); bar.handleKeyDown({ key: "ArrowLeft" } as KeyboardEvent); bar.open(1); bar.close(); bar.destroy(); bar.destroy();
});
