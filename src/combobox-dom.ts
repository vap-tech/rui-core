import { ComboboxController, ComboboxOptions } from "./combobox.js";
import { CollectionItem } from "./collection.js";
import { PopupController } from "./popup.js";

export interface ComboboxBinding<T = string> {
  controller: ComboboxController<T>;
  popup: PopupController;
  refresh(): void;
  destroy(): void;
}

export function bindCombobox<T = string>(root: HTMLElement, options: ComboboxOptions<T> = {}): ComboboxBinding<T> {
  const input = root.querySelector<HTMLElement>("[data-rui-input]");
  const popupElement = root.querySelector<HTMLElement>("[data-rui-popup]");
  if (!input || !popupElement) throw new Error("Combobox requires [data-rui-input] and [data-rui-popup]");
  const valueElement = root.querySelector<HTMLInputElement>("[data-rui-value]");
  const form = root.closest("form");
  const initialInputValue = (input as HTMLInputElement).value;
  const initialValue = valueElement?.value ?? "";
  const controller = new ComboboxController<T>(options);
  const popup = new PopupController();
  popup.setTrigger(input); popup.setPopup(popupElement);
  let destroyed = false;
  root.setAttribute("role", "presentation");
  popupElement.setAttribute("role", "listbox");
  if (options.selectionMode === "multiple") popupElement.setAttribute("aria-multiselectable", "true");
  input.setAttribute("role", "combobox"); input.setAttribute("aria-haspopup", "listbox"); input.setAttribute("aria-controls", popupElement.id || `${root.id || "rui-combobox"}-listbox`); popupElement.id = input.getAttribute("aria-controls")!;

  const readItems = (): CollectionItem<T>[] => Array.from(popupElement.querySelectorAll<HTMLElement>("[data-rui-option]")).map((element, index) => ({ id: element.id || `${popupElement.id}-option-${index}`, value: element.dataset.value as T, label: element.textContent?.trim() ?? "", disabled: element.dataset.disabled === "true" || element.getAttribute("aria-disabled") === "true", hidden: element.hidden, element }));
  const sync = (): void => {
    const state = controller.getState();
    root.dataset.inputMode = state.collection.interactionMode;
    popupElement.dataset.inputMode = state.collection.interactionMode;
    const selectedId = state.collection.selectedIds[0];
    const selectedItem = selectedId ? state.collection.items.find((item) => item.id === selectedId) : undefined;
    if (valueElement) valueElement.value = String(state.freeSoloValue ?? selectedItem?.value ?? "");
    if ((input as HTMLInputElement).value !== state.inputValue) (input as HTMLInputElement).value = state.inputValue;
    input.setAttribute("aria-expanded", String(state.open));
    input.setAttribute("aria-autocomplete", options.mode === "select-only" ? "none" : "list");
    const active = state.collection.activeId;
    if (active) input.setAttribute("aria-activedescendant", active); else input.removeAttribute("aria-activedescendant");
    popupElement.hidden = !state.open;
    for (const item of state.collection.items) if (item.element) { item.element.id = item.id; item.element.setAttribute("role", "option"); item.element.setAttribute("aria-selected", String(state.collection.selectedIds.includes(item.id))); item.element.toggleAttribute("data-active", item.id === active); if (item.disabled) item.element.setAttribute("aria-disabled", "true"); else item.element.removeAttribute("aria-disabled"); }
  };
  const refresh = (): void => { if (!destroyed) { controller.setItems(readItems()); sync(); } };
  const unsubscribe = controller.subscribe(sync);
  const unsubscribePopup = popup.subscribe((state) => { controller.setOpen(state.open, state.reason === "outside-click" ? "close" : state.reason === "escape" ? "escape" : "programmatic"); sync(); });
  const Observer = popupElement.ownerDocument.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(() => refresh()) : null;
  observer?.observe(popupElement, { childList: true, subtree: true });
  const onInput = (): void => controller.setInputValue((input as HTMLInputElement).value);
  const onCompositionStart = (): void => controller.handleCompositionStart();
  const onCompositionEnd = (): void => controller.handleCompositionEnd((input as HTMLInputElement).value);
  const onFocus = (): void => { if (options.openOnFocus) { controller.setOpen(true, "open"); sync(); } };
  const onBlur = (event: FocusEvent): void => { if (!root.contains(event.relatedTarget as Node | null)) { controller.handleBlur(event); sync(); } };
  const onKeyDown = (event: KeyboardEvent): void => { if (controller.handleKeyDown(event)) { event.preventDefault(); sync(); } };
  const onPointerMove = (event: PointerEvent): void => { const option = (event.target as HTMLElement).closest<HTMLElement>("[data-rui-option]"); if (option && popupElement.contains(option) && !option.hasAttribute("aria-disabled")) { controller.collection.setActive(option.id, "pointer", event); sync(); } };
  const onClick = (event: MouseEvent): void => { const option = (event.target as HTMLElement).closest<HTMLElement>("[data-rui-option]"); if (option && popupElement.contains(option)) { controller.select(option.id, event); if (options.closeOnSelect !== false) popup.close("select"); sync(); } };
  const onValueChange = (): void => { if (valueElement) { valueElement.dispatchEvent(new valueElement.ownerDocument.defaultView!.Event("input", { bubbles: true })); valueElement.dispatchEvent(new valueElement.ownerDocument.defaultView!.Event("change", { bubbles: true })); } };
  const onReset = (): void => { queueMicrotask(() => { if (destroyed) return; (input as HTMLInputElement).value = initialInputValue; if (valueElement) valueElement.value = initialValue; controller.setInputValue(initialInputValue, "programmatic"); controller.collection.clearSelection(); if (initialValue) controller.select(initialValue); sync(); }); };
  input.addEventListener("input", onInput); input.addEventListener("compositionstart", onCompositionStart); input.addEventListener("compositionend", onCompositionEnd); input.addEventListener("focus", onFocus); input.addEventListener("blur", onBlur); input.addEventListener("keydown", onKeyDown); popupElement.addEventListener("pointermove", onPointerMove); popupElement.addEventListener("click", onClick); form?.addEventListener("reset", onReset); const unsubscribeValue = controller.subscribe(() => onValueChange());
  refresh();
  return { controller, popup, refresh, destroy(): void { if (destroyed) return; destroyed = true; unsubscribe(); unsubscribeValue(); unsubscribePopup(); observer?.disconnect(); input.removeEventListener("input", onInput); input.removeEventListener("compositionstart", onCompositionStart); input.removeEventListener("compositionend", onCompositionEnd); input.removeEventListener("focus", onFocus); input.removeEventListener("blur", onBlur); input.removeEventListener("keydown", onKeyDown); popupElement.removeEventListener("pointermove", onPointerMove); popupElement.removeEventListener("click", onClick); form?.removeEventListener("reset", onReset); popup.destroy(); controller.destroy(); } };
}
