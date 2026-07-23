import { CollectionController, CollectionItem, CollectionOptions } from "./collection.js";

export interface ListboxOptions<T = unknown> extends CollectionOptions {
  getItemValue?: (element: HTMLElement) => T;
  getItemLabel?: (element: HTMLElement) => string;
  getItemId?: (element: HTMLElement, index: number) => string;
  controller?: CollectionController<T>;
}

export interface ListboxBinding<T = unknown> {
  controller: CollectionController<T>;
  refresh(): void;
  destroy(): void;
}

const optionSelector = "[data-rui-option]";

export function bindListbox<T = string>(root: HTMLElement, options: ListboxOptions<T> = {}): ListboxBinding<T> {
  const controller = options.controller ?? new CollectionController<T>(options);
  let destroyed = false;

  root.setAttribute("role", "listbox");
  if (options.selectionMode === "multiple") root.setAttribute("aria-multiselectable", "true");

  const readItems = (): CollectionItem<T>[] => Array.from(root.querySelectorAll<HTMLElement>(optionSelector)).map((element, index) => ({
    id: options.getItemId?.(element, index) ?? (element.id || `${root.id || "rui-listbox"}-option-${index}`),
    value: options.getItemValue?.(element) ?? (element.dataset.value as T),
    label: options.getItemLabel?.(element) ?? element.textContent?.trim() ?? "",
    disabled: element.hasAttribute("disabled") || element.dataset.disabled === "true" || element.getAttribute("aria-disabled") === "true",
    hidden: element.hidden || element.dataset.hidden === "true",
    selectable: element.dataset.selectable !== "false",
    element,
  }));

  const sync = (): void => {
    const state = controller.getState();
    for (const item of state.items) {
      const element = item.element;
      if (!element) continue;
      const active = item.id === state.activeId;
      const selected = state.selectedIds.includes(item.id);
      element.id = item.id;
      element.setAttribute("role", "option");
      element.setAttribute("aria-selected", String(selected));
      if (item.disabled) element.setAttribute("aria-disabled", "true"); else element.removeAttribute("aria-disabled");
      element.toggleAttribute("data-active", active);
      element.toggleAttribute("data-selected", selected);
    }
  };

  const unsubscribe = controller.subscribe(sync);
  const refresh = (): void => { if (!destroyed) { controller.setItems(readItems()); sync(); } };
  const Observer = root.ownerDocument.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(() => refresh()) : null;
  observer?.observe(root, { childList: true, subtree: true });
  const onPointerMove = (event: PointerEvent): void => { const option = (event.target as HTMLElement).closest<HTMLElement>(optionSelector); if (option?.parentElement === root) controller.setActive(option.id, "pointer", event); };
  const onClick = (event: MouseEvent): void => { const option = (event.target as HTMLElement).closest<HTMLElement>(optionSelector); if (option?.parentElement === root) controller.select(option.id, event); };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown") { event.preventDefault(); controller.next(event); }
    else if (event.key === "ArrowUp") { event.preventDefault(); controller.previous(event); }
    else if (event.key === "Home") { event.preventDefault(); controller.first(event); }
    else if (event.key === "End") { event.preventDefault(); controller.last(event); }
    else if (event.key === "Enter" && controller.getState().activeId) { event.preventDefault(); controller.select(controller.getState().activeId!, event); }
  };

  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeyDown);
  refresh();

  return {
    controller,
    refresh,
    destroy(): void {
      if (destroyed) return;
      destroyed = true; unsubscribe(); observer?.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
      if (!options.controller) controller.destroy();
    },
  };
}
