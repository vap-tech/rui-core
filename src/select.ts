import { ComboboxController } from "./combobox.js";
import { CollectionItem } from "./collection.js";

export interface SelectBinding<T = string> {
  controller: ComboboxController<T>;
  refresh(): void;
  destroy(): void;
}

export function bindSelect<T = string>(select: HTMLSelectElement): SelectBinding<T> {
  const controller = new ComboboxController<T>({ mode: "select-only", openOnInput: false, closeOnSelect: true });
  let destroyed = false;
  const initialValue = select.value;
  const readItems = (): CollectionItem<T>[] => Array.from(select.options).map((option) => ({ id: option.value, value: option.value as T, label: option.textContent?.trim() ?? "", disabled: option.disabled, hidden: option.hidden, element: option }));
  const sync = (): void => {
    const selected = controller.getState().collection.selectedIds[0];
    if (selected !== undefined && select.value !== selected) select.value = selected;
    for (const option of Array.from(select.options)) option.setAttribute("aria-selected", String(option.value === selected));
  };
  const refresh = (): void => { if (!destroyed) { controller.setItems(readItems()); const selected = select.value; if (selected) controller.select(selected); sync(); } };
  const onChange = (): void => { if (select.value) controller.select(select.value); sync(); };
  const onReset = (): void => { queueMicrotask(() => { if (!destroyed) { controller.setItems(readItems()); if (initialValue) controller.select(initialValue); sync(); } }); };
  const emitValueEvents = (): void => { if (!destroyed) { const EventConstructor = select.ownerDocument.defaultView!.Event; select.dispatchEvent(new EventConstructor("input", { bubbles: true })); select.dispatchEvent(new EventConstructor("change", { bubbles: true })); } };
  const unsubscribe = controller.subscribe(sync);
  const Observer = select.ownerDocument.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(() => refresh()) : null;
  observer?.observe(select, { childList: true, subtree: true });
  select.addEventListener("change", onChange); select.form?.addEventListener("reset", onReset); refresh();
  const originalSelect = controller.select.bind(controller);
  controller.select = ((id: string, event: Event | null = null) => { const changed = originalSelect(id, event); if (changed) { sync(); emitValueEvents(); } return changed; }) as typeof controller.select;
  return { controller, refresh, destroy(): void { if (destroyed) return; destroyed = true; unsubscribe(); observer?.disconnect(); select.removeEventListener("change", onChange); select.form?.removeEventListener("reset", onReset); controller.destroy(); } };
}
