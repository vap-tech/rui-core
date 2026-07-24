import { MenuController } from "./menu.js";
import { RovingFocusController } from "./roving-focus.js";

export interface MenuBinding { controller: MenuController; focus: RovingFocusController; refresh(): void; destroy(): void; }

export function bindMenu(root: HTMLElement): MenuBinding {
  const controller = new MenuController(); const focus = new RovingFocusController({ orientation: "vertical" }); let destroyed = false;
  root.setAttribute("role", "menu"); focus.setContainer(root);
  const readItems = () => Array.from(root.querySelectorAll<HTMLElement>("[data-rui-menuitem]")).map((element, index) => ({ id: element.id || `${root.id || "rui-menu"}-item-${index}`, value: element.dataset.value, label: element.textContent?.trim() ?? "", disabled: element.dataset.disabled === "true" || element.getAttribute("aria-disabled") === "true", element }));
  const sync = (): void => { const state = controller.getState(); root.dataset.inputMode = controller.collection.getState().interactionMode; root.hidden = !state.open; for (const item of state.items) if (item.element) { item.element.id = item.id; item.element.setAttribute("role", "menuitem"); item.element.toggleAttribute("data-active", item.id === state.activeId); if (item.disabled) item.element.setAttribute("aria-disabled", "true"); else item.element.removeAttribute("aria-disabled"); } };
  const refresh = (): void => { if (!destroyed) { controller.setItems(readItems()); focus.refresh(); sync(); } };
  const unsubscribe = controller.subscribe(sync); const observer = root.ownerDocument.defaultView?.MutationObserver ? new (root.ownerDocument.defaultView.MutationObserver)(refresh) : null; observer?.observe(root, { childList: true, subtree: true });
  const onKeyDown = (event: KeyboardEvent): void => { if (controller.handleKeyDown(event)) { event.preventDefault(); sync(); const active = controller.getState().activeId; controller.getState().items.find((item) => item.id === active)?.element?.focus(); } };
  const onClick = (event: MouseEvent): void => { const item = (event.target as HTMLElement).closest<HTMLElement>("[data-rui-menuitem]"); if (item?.parentElement === root && !item.hasAttribute("aria-disabled")) { controller.selectActive(event); sync(); } };
  root.addEventListener("keydown", onKeyDown); root.addEventListener("click", onClick); refresh();
  return { controller, focus, refresh, destroy(): void { if (destroyed) return; destroyed = true; unsubscribe(); observer?.disconnect(); root.removeEventListener("keydown", onKeyDown); root.removeEventListener("click", onClick); focus.destroy(); controller.destroy(); } };
}
