import { CollectionController, CollectionItem, CollectionState, InteractionMode, SelectionMode } from "./collection.js";

export type ComboboxMode = "select-only" | "editable";
export type ComboboxReason = "input" | "open" | "close" | "keyboard" | "select" | "escape" | "blur" | "programmatic";

export interface ComboboxOptions<T = unknown> {
  mode?: ComboboxMode;
  freeSolo?: boolean;
  openOnInput?: boolean;
  openOnFocus?: boolean;
  autoHighlight?: boolean;
  autoSelect?: boolean;
  clearOnEscape?: boolean;
  closeOnSelect?: boolean;
  selectionMode?: SelectionMode;
  loopNavigation?: boolean;
  filterOptions?: (items: readonly CollectionItem<T>[], inputValue: string) => readonly CollectionItem<T>[];
  typeahead?: boolean;
  typeaheadTimeout?: number;
  pageSize?: number;
  selectOnTab?: boolean;
}

export interface ComboboxState<T = unknown> {
  inputValue: string;
  freeSoloValue: string | null;
  open: boolean;
  visibleItems: readonly CollectionItem<T>[];
  collection: CollectionState<T>;
}

export interface ComboboxChange<T = unknown> {
  previousState: ComboboxState<T>;
  state: ComboboxState<T>;
  reason: ComboboxReason;
  event: Event | null;
}

type Listener<T> = (state: ComboboxState<T>, reason: ComboboxReason, change: ComboboxChange<T>) => void;

export class ComboboxController<T = unknown> {
  readonly collection: CollectionController<T>;
  private inputValue = "";
  private freeSoloValue: string | null = null;
  private open = false;
  private visibleItems: CollectionItem<T>[] = [];
  private readonly listeners = new Set<Listener<T>>();
  private lastState: ComboboxState<T> | null = null;
  private typeaheadBuffer = "";
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private composing = false;
  private readonly options: Required<Pick<ComboboxOptions<T>, "mode" | "freeSolo" | "openOnInput" | "clearOnEscape" | "closeOnSelect">> & ComboboxOptions<T>;

  constructor(options: ComboboxOptions<T> = {}) {
    this.options = { mode: options.mode ?? "editable", freeSolo: options.freeSolo ?? false, openOnInput: options.openOnInput ?? true, clearOnEscape: options.clearOnEscape ?? false, closeOnSelect: options.closeOnSelect ?? true, ...options };
    this.collection = new CollectionController({ selectionMode: options.selectionMode, loopNavigation: options.loopNavigation });
    this.collection.subscribe(() => this.emit("programmatic"));
  }
  getState(): ComboboxState<T> { return { inputValue: this.inputValue, freeSoloValue: this.freeSoloValue, open: this.open, visibleItems: this.visibleItems, collection: this.collection.getState() }; }
  subscribe(listener: Listener<T>): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly CollectionItem<T>[]): void { this.collection.setItems(items); this.applyFilter("programmatic"); this.emit("programmatic"); }
  setInputValue(value: string, reason: ComboboxReason = "input"): void { const previous = this.getState(); this.inputValue = value; this.applyFilter(reason); if (this.options.openOnInput && value) this.setOpen(true, "input"); this.emit(reason, null, previous); }
  setOpen(open: boolean, reason: ComboboxReason = "programmatic"): void { if (this.open === open) return; const previous = this.getState(); this.open = open; if (open && this.options.autoHighlight && !this.collection.getState().activeId) { const first = this.visibleItems.find((item) => this.collection.isSelectable(item.id)); if (first) this.collection.setActive(first.id, "programmatic"); } this.emit(reason === "escape" ? "escape" : open ? "open" : "close", null, previous); }
  toggle(): void { this.setOpen(!this.open, "programmatic"); }
  select(id: string, event: Event | null = null): boolean { const selected = this.collection.select(id, event); if (selected) { const item = this.collection.getItem(id); if (item) this.inputValue = item.label; if (this.options.closeOnSelect) this.setOpen(false, "select"); this.emit("select"); } return selected; }
  handleKeyDown(event: KeyboardEvent): boolean {
    if (event.isComposing || this.composing) return false;
    if (event.key === "ArrowDown") { if (!this.open) this.setOpen(true, "keyboard"); this.moveVisible(1, event); return true; }
    if (event.key === "ArrowUp") { if (!this.open) this.setOpen(true, "keyboard"); this.moveVisible(-1, event); return true; }
    if (event.key === "Home" && this.open) { this.moveVisibleTo(0, event); return true; }
    if (event.key === "End" && this.open) { this.moveVisibleTo(-1, event); return true; }
    if (event.key === "PageDown" && this.open) { this.movePage(1, event); return true; }
    if (event.key === "PageUp" && this.open) { this.movePage(-1, event); return true; }
    if (event.key === "Tab" && this.open && this.options.selectOnTab && this.collection.getState().activeId) return this.select(this.collection.getState().activeId!, event);
    if (event.key === "Enter" && this.open) { const active = this.collection.getState().activeId; if (active) return this.select(active, event); if (this.options.freeSolo && this.inputValue) { this.freeSoloValue = this.inputValue; this.setOpen(false, "select"); this.emit("select"); return true; } }
    if (event.key === "Escape") { if (this.open) { this.setOpen(false, "escape"); return true; } if (this.options.clearOnEscape && this.inputValue) { this.setInputValue(""); return true; } }
    if (this.options.typeahead && this.options.mode === "select-only" && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) return this.handleTypeahead(event.key, event);
    return false;
  }
  destroy(): void { this.listeners.clear(); if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer); this.collection.destroy(); }
  handleCompositionStart(): void { this.composing = true; }
  handleCompositionEnd(value?: string): void { this.composing = false; if (value !== undefined) this.setInputValue(value, "input"); }
  handleBlur(event: Event | null = null): boolean { if (!this.open) return false; const active = this.collection.getState().activeId; if (this.options.autoSelect && active) return this.select(active, event); if (this.options.freeSolo && this.inputValue && !active) { this.freeSoloValue = this.inputValue; this.setOpen(false, "blur"); this.emit("select", event); return true; } this.setOpen(false, "blur"); return true; }
  private handleTypeahead(character: string, event: KeyboardEvent): boolean { const lower = character.toLocaleLowerCase(); const repeated = this.typeaheadBuffer === lower; this.typeaheadBuffer = repeated ? lower : `${this.typeaheadBuffer}${lower}`; const candidates = this.visibleItems.filter((item) => item.label.toLocaleLowerCase().startsWith(this.typeaheadBuffer)); const fallback = repeated ? this.visibleItems.filter((item) => item.label.toLocaleLowerCase().startsWith(lower)) : []; const list = candidates.length ? candidates : fallback; if (!list.length) { if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer); this.typeaheadTimer = setTimeout(() => { this.typeaheadBuffer = ""; this.typeaheadTimer = null; }, this.options.typeaheadTimeout ?? 500); return false; } const current = this.collection.getState().activeId; const index = list.findIndex((item) => item.id === current); const next = list[(index + 1) % list.length]; this.collection.setActive(next.id, "keyboard", event); if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer); this.typeaheadTimer = setTimeout(() => { this.typeaheadBuffer = ""; this.typeaheadTimer = null; }, this.options.typeaheadTimeout ?? 500); return true; }
  private movePage(direction: number, event: KeyboardEvent): void { const items = this.visibleItems.filter((item) => this.collection.isSelectable(item.id)); if (!items.length) return; const current = items.findIndex((item) => item.id === this.collection.getState().activeId); const index = current < 0 ? (direction > 0 ? 0 : items.length - 1) : Math.max(0, Math.min(items.length - 1, current + direction * (this.options.pageSize ?? 5))); this.collection.setActive(items[index].id, "keyboard", event); }
  private applyFilter(_reason: ComboboxReason): void {
    const items = this.collection.getState().items;
    const filtered = this.options.filterOptions?.(items, this.inputValue) ?? items.filter((item) => !this.inputValue || item.label.toLocaleLowerCase().includes(this.inputValue.toLocaleLowerCase()));
    this.visibleItems = filtered.filter((item) => !item.hidden);
    const active = this.collection.getState().activeId;
    if (active && !this.visibleItems.some((item) => item.id === active)) this.collection.setActive(null, "programmatic");
  }
  private moveVisible(delta: number, event: KeyboardEvent): void { const items = this.visibleItems.filter((item) => this.collection.isSelectable(item.id)); if (!items.length) return; const index = items.findIndex((item) => item.id === this.collection.getState().activeId); const next = index < 0 ? (delta > 0 ? 0 : items.length - 1) : Math.max(0, Math.min(items.length - 1, index + delta)); this.collection.setActive(items[next].id, "keyboard", event); }
  private moveVisibleTo(index: number, event: KeyboardEvent): void { const items = this.visibleItems.filter((item) => this.collection.isSelectable(item.id)); if (items.length) this.collection.setActive(items[index < 0 ? items.length - 1 : index].id, "keyboard", event); }
  private emit(reason: ComboboxReason, event: Event | null = null, previousState?: ComboboxState<T>): void { const state = this.getState(); const change = { previousState: previousState ?? this.lastState ?? state, state, reason, event }; this.lastState = state; for (const listener of this.listeners) listener(state, reason, change); }
}
