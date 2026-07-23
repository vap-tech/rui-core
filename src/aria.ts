import { CollectionItem } from "./collection.js";

export interface AriaState {
  expanded: boolean;
  activeId: string | null;
  popupId: string;
  autocomplete?: "none" | "list" | "both" | "inline";
}

export function getComboboxAria(state: AriaState): Record<string, string> {
  const attributes: Record<string, string> = { role: "combobox", "aria-expanded": String(state.expanded), "aria-controls": state.popupId, "aria-haspopup": "listbox", "aria-autocomplete": state.autocomplete ?? "list" };
  if (state.activeId) attributes["aria-activedescendant"] = state.activeId;
  return attributes;
}

export function getListboxAria(multiple = false): Record<string, string> { return { role: "listbox", ...(multiple ? { "aria-multiselectable": "true" } : {}) }; }

export function getOptionAria<T>(item: CollectionItem<T>, selected: boolean): Record<string, string> {
  const attributes: Record<string, string> = { id: item.id, role: "option", "aria-selected": String(selected) };
  if (item.disabled) attributes["aria-disabled"] = "true";
  return attributes;
}
