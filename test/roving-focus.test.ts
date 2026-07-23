import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { RovingFocusController } from "../src/roving-focus.js";

test("roving focus manages tabIndex and skips disabled items", () => {
  const dom = new JSDOM(`<div id="menu"><button data-rui-roving-item id="one"></button><button data-rui-roving-item id="two" disabled></button><button data-rui-roving-item id="three"></button></div>`);
  const menu = dom.window.document.querySelector("#menu") as HTMLElement; const controller = new RovingFocusController({ orientation: "vertical", loop: true }); controller.setContainer(menu);
  assert.equal((menu.querySelector("#one") as HTMLElement).tabIndex, 0); controller.focusNext(); assert.equal(dom.window.document.activeElement?.id, "three"); controller.focusPrevious(); assert.equal(dom.window.document.activeElement?.id, "one"); controller.focusLast(); assert.equal(dom.window.document.activeElement?.id, "three"); controller.destroy();
});

test("supports keyboard, orientation and non-loop boundaries", () => {
  const dom = new JSDOM(`<div id="menu"><button data-rui-roving-item id="one"></button><button data-rui-roving-item id="two"></button></div>`); const menu = dom.window.document.querySelector("#menu") as HTMLElement; const controller = new RovingFocusController({ orientation: "horizontal", loop: false }); controller.setContainer(menu);
  menu.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); assert.equal(dom.window.document.activeElement?.id, "two"); menu.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); assert.equal(dom.window.document.activeElement?.id, "two"); menu.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Home", bubbles: true })); assert.equal(dom.window.document.activeElement?.id, "one"); controller.setContainer(null); controller.destroy();
});

test("covers empty/disabled containers and incompatible directions", () => {
  const dom = new JSDOM(`<div id="empty"></div><div id="disabled"><button data-rui-roving-item disabled></button></div>`);
  const empty = dom.window.document.querySelector("#empty") as HTMLElement; const disabled = dom.window.document.querySelector("#disabled") as HTMLElement;
  const emptyController = new RovingFocusController(); emptyController.setContainer(empty); emptyController.focusNext(); emptyController.focusPrevious(); emptyController.focusFirst(); emptyController.focusLast(); emptyController.destroy();
  const controller = new RovingFocusController({ orientation: "vertical" }); controller.setContainer(disabled); disabled.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })); controller.refresh(); controller.destroy();
});

test("supports both orientation and dataset disabled items", () => {
  const dom = new JSDOM(`<div id="menu"><button data-rui-roving-item data-disabled="true"></button><button data-rui-roving-item id="ok"></button></div>`);
  const menu = dom.window.document.querySelector("#menu") as HTMLElement; const controller = new RovingFocusController({ orientation: "both" }); controller.setContainer(menu);
  menu.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })); assert.equal(dom.window.document.activeElement?.id, "ok"); controller.destroy();
});
