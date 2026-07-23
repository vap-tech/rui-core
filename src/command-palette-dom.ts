import { CollectionItem } from "./collection.js";
import { CommandPaletteController } from "./command-palette.js";

export interface CommandPaletteBinding<T = string> { controller: CommandPaletteController<T>; refresh(): void; destroy(): void; }

export function bindCommandPalette<T = string>(root: HTMLElement): CommandPaletteBinding<T> {
  const input = root.querySelector<HTMLInputElement>("[data-rui-input]"); const popup = root.querySelector<HTMLElement>("[data-rui-popup]");
  if (!input || !popup) throw new Error("Command palette requires [data-rui-input] and [data-rui-popup]");
  const controller = new CommandPaletteController<T>({ freeSolo: true, clearOnEscape: true }); let destroyed = false;
  root.setAttribute("role", "dialog"); input.setAttribute("role", "combobox"); input.setAttribute("aria-haspopup", "listbox"); popup.setAttribute("role", "listbox");
  const readItems = (): CollectionItem<T>[] => Array.from(popup.querySelectorAll<HTMLElement>("[data-rui-command]")).map((element, index) => ({ id: element.id || `${popup.id || "rui-palette"}-command-${index}`, value: element.dataset.value as T, label: element.textContent?.trim() ?? "", disabled: element.dataset.disabled === "true", element }));
  const sync = (): void => { const state = controller.getState(); popup.hidden = !state.open; input.setAttribute("aria-expanded", String(state.open)); const active = state.combobox.collection.activeId; if (active) input.setAttribute("aria-activedescendant", active); else input.removeAttribute("aria-activedescendant"); for (const item of state.combobox.collection.items) if (item.element) { item.element.id = item.id; item.element.setAttribute("role", "option"); item.element.setAttribute("aria-selected", String(state.combobox.collection.selectedIds.includes(item.id))); } };
  const refresh = (): void => { if (!destroyed) { controller.setItems(readItems()); sync(); } };
  const Observer = popup.ownerDocument.defaultView?.MutationObserver; const observer = Observer ? new Observer(refresh) : null; observer?.observe(popup, { childList: true, subtree: true });
  const onInput = (): void => { controller.combobox.setInputValue(input.value); sync(); }; const onKeyDown = (event: KeyboardEvent): void => { if (controller.handleKeyDown(event)) { event.preventDefault(); sync(); } }; const onClick = (event: MouseEvent): void => { const command = (event.target as HTMLElement).closest<HTMLElement>("[data-rui-command]"); if (command?.parentElement === popup) { controller.combobox.select(command.id, event); sync(); } };
  input.addEventListener("input", onInput); input.addEventListener("keydown", onKeyDown); popup.addEventListener("click", onClick); refresh();
  return { controller, refresh, destroy(): void { if (destroyed) return; destroyed = true; observer?.disconnect(); input.removeEventListener("input", onInput); input.removeEventListener("keydown", onKeyDown); popup.removeEventListener("click", onClick); controller.destroy(); } };
}
