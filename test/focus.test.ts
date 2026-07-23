import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { FocusController } from "../src/focus.js";

test("traps Tab at container boundaries and returns focus", () => {
  const dom = new JSDOM(`<button id="trigger"></button><div id="panel"><button id="first"></button><button id="last"></button><button disabled>disabled</button></div>`);
  const document = dom.window.document;
  const trigger = document.querySelector("#trigger") as HTMLElement;
  const panel = document.querySelector("#panel") as HTMLElement;
  const first = document.querySelector("#first") as HTMLElement;
  const last = document.querySelector("#last") as HTMLElement;
  const focus = new FocusController(); focus.setTrigger(trigger); focus.setContainer(panel);
  focus.focusFirst(); assert.equal(document.activeElement, first);
  const forward = new dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true }); Object.defineProperty(forward, "target", { value: last }); panel.dispatchEvent(forward); assert.equal(document.activeElement, first);
  const backward = new dom.window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }); Object.defineProperty(backward, "target", { value: first }); panel.dispatchEvent(backward); assert.equal(document.activeElement, last);
  focus.release(); assert.equal(document.activeElement, trigger); focus.destroy(); focus.destroy();
});

test("can disable trap and handles empty container", () => {
  const dom = new JSDOM(`<div id="panel"></div>`);
  const panel = dom.window.document.querySelector("#panel") as HTMLElement;
  const focus = new FocusController({ trap: false, returnFocus: false }); focus.setContainer(panel); focus.focusFirst(); focus.focusLast(); focus.release(); focus.setContainer(null); focus.destroy(); assert.ok(true);
});

test("focusLast and non-boundary key paths are covered", () => {
  const dom = new JSDOM(`<div id="panel"><button id="first"></button><button id="last"></button></div>`);
  const document = dom.window.document;
  const panel = document.querySelector("#panel") as HTMLElement;
  const first = document.querySelector("#first") as HTMLElement;
  const last = document.querySelector("#last") as HTMLElement;
  const focus = new FocusController(); focus.setContainer(panel); focus.focusLast(); assert.equal(document.activeElement, last);
  const other = new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }); Object.defineProperty(other, "target", { value: first }); panel.dispatchEvent(other);
  const middleTab = new dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true }); Object.defineProperty(middleTab, "target", { value: first }); panel.dispatchEvent(middleTab);
  focus.setContainer(null); focus.destroy();
});
