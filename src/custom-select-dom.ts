import { ComboboxController } from "./combobox.js";
import { CollectionItem } from "./collection.js";
import { PopupController } from "./popup.js";

export interface CustomSelectBinding<T = string> { controller: ComboboxController<T>; popup: PopupController; refresh(): void; destroy(): void; }

export function bindSelect<T = string>(root: HTMLElement): CustomSelectBinding<T> {
  const trigger = root.querySelector<HTMLElement>("[data-rui-select-trigger]");
  const panel = root.querySelector<HTMLElement>("[data-rui-select-content]");
  const value = root.querySelector<HTMLInputElement>("input[type=hidden], [data-rui-select-value-input]");
  if (!trigger || !panel) throw new Error("Custom Select requires trigger and content");
  const controller = new ComboboxController<T>({ mode: "select-only", openOnInput: false, closeOnSelect: true, typeahead: true });
  const popup = new PopupController({ document: root.ownerDocument });
  popup.setTrigger(trigger); popup.setPopup(panel);
  const read = (): CollectionItem<T>[] => Array.from(panel.querySelectorAll<HTMLElement>("[data-rui-option]")).map((element, index) => ({ id: element.id || `${root.id || "rui-select"}-option-${index}`, value: element.dataset.value as T, label: element.textContent?.trim() ?? "", disabled: element.dataset.disabled === "true" || element.getAttribute("aria-disabled") === "true", hidden: element.hidden, element }));
  const sync = (): void => { const state = controller.getState(); const selected = state.collection.selectedIds[0]; const item = selected ? state.collection.items.find((entry) => entry.id === selected) : undefined; root.dataset.open = String(state.open); root.dataset.inputMode = state.collection.interactionMode; panel.dataset.inputMode = state.collection.interactionMode; trigger.setAttribute("aria-expanded", String(state.open)); if (value) value.value = String(item?.value ?? ""); for (const entry of state.collection.items) if (entry.element) { entry.element.id = entry.id; entry.element.setAttribute("role", "option"); entry.element.setAttribute("aria-selected", String(entry.id === selected)); entry.element.toggleAttribute("data-active", entry.id === state.collection.activeId); if (entry.disabled) entry.element.setAttribute("aria-disabled", "true"); } panel.hidden = !state.open; };
  const refresh = (): void => { controller.setItems(read()); sync(); };
  const onTrigger = (): void => { popup.toggle("toggle"); };
  const onKey = (event: KeyboardEvent): void => {
    const state = controller.getState();
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const active = state.collection.activeId;
      if (!state.open) {
        popup.open("keyboard");
      } else if (active) {
        controller.select(active, event);
        popup.close("select");
      }
      sync();
      return;
    }
    if (controller.handleKeyDown(event)) {
      event.preventDefault();
      if (controller.getState().open && !popup.getState().open) popup.open("keyboard");
      sync();
    }
  };
  const onPointerMove = (event: PointerEvent): void => {
    const option = (event.target as HTMLElement).closest<HTMLElement>("[data-rui-option]");
    if (option && panel.contains(option) && !option.hasAttribute("aria-disabled")) {
      controller.collection.setActive(option.id, "pointer", event);
      sync();
    }
  };
  const onClick = (event: MouseEvent): void => { const option = (event.target as HTMLElement).closest<HTMLElement>("[data-rui-option]"); if (option && panel.contains(option)) { controller.select(option.id, event); popup.close("select"); sync(); } };
  const offController = controller.subscribe(sync); const offPopup = popup.subscribe((state) => { controller.setOpen(state.open, state.reason === "escape" ? "escape" : state.open ? "open" : "close"); sync(); });
  trigger.addEventListener("click", onTrigger); trigger.addEventListener("keydown", onKey); panel.addEventListener("pointermove", onPointerMove); panel.addEventListener("click", onClick); refresh();
  return { controller, popup, refresh, destroy(): void { offController(); offPopup(); trigger.removeEventListener("click", onTrigger); trigger.removeEventListener("keydown", onKey); panel.removeEventListener("pointermove", onPointerMove); panel.removeEventListener("click", onClick); popup.destroy(); controller.destroy(); } };
}
