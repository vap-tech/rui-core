import { TabsController, TabsActivation } from "./tabs.js";

export interface TabsBinding { controller: TabsController; refresh(): void; destroy(): void; }

export function bindTabs(root: HTMLElement, activation: TabsActivation = "automatic"): TabsBinding {
  const controller = new TabsController(activation); let destroyed = false;
  root.setAttribute("role", "tablist");
  const readItems = () => Array.from(root.querySelectorAll<HTMLElement>("[data-rui-tab]")).map((element, index) => ({ id: element.id || `${root.id || "rui-tabs"}-tab-${index}`, value: element.dataset.value, label: element.textContent?.trim() ?? "", disabled: element.dataset.disabled === "true" || element.getAttribute("aria-disabled") === "true", element }));
  const sync = (): void => { const state = controller.getState(); for (const item of state.items) if (item.element) { const tab = item.element; tab.id = item.id; tab.setAttribute("role", "tab"); tab.setAttribute("aria-selected", String(item.id === state.selectedId)); tab.toggleAttribute("data-active", item.id === state.activeId); const panelId = tab.dataset.ruiPanel; if (panelId) root.ownerDocument.getElementById(panelId)?.toggleAttribute("hidden", item.id !== state.selectedId); } };
  const refresh = (): void => { if (!destroyed) { controller.setItems(readItems()); sync(); } };
  const observer = root.ownerDocument.defaultView?.MutationObserver ? new (root.ownerDocument.defaultView.MutationObserver)(refresh) : null; observer?.observe(root, { childList: true, subtree: true });
  const onKeyDown = (event: KeyboardEvent): void => { if (controller.handleKeyDown(event)) { event.preventDefault(); sync(); } };
  const onClick = (event: MouseEvent): void => { const tab = (event.target as HTMLElement).closest<HTMLElement>("[data-rui-tab]"); if (tab?.parentElement === root) { controller.activate(tab.id); sync(); } };
  root.addEventListener("keydown", onKeyDown); root.addEventListener("click", onClick); refresh();
  return { controller, refresh, destroy(): void { if (destroyed) return; destroyed = true; observer?.disconnect(); root.removeEventListener("keydown", onKeyDown); root.removeEventListener("click", onClick); controller.destroy(); } };
}
