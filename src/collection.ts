export type InteractionMode = "keyboard" | "pointer" | "programmatic";
export type SelectionMode = "single" | "multiple";

export interface CollectionItem<T = unknown> {
  id: string;
  value: T;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
  selectable?: boolean;
  element?: HTMLElement | null;
  metadata?: Record<string, unknown>;
}

export interface CollectionState<T = unknown> {
  items: readonly CollectionItem<T>[];
  activeId: string | null;
  selectedIds: readonly string[];
  interactionMode: InteractionMode;
}

export type CollectionReason =
  | "items"
  | "active"
  | "navigation"
  | "select"
  | "deselect"
  | "clear";

export interface CollectionChange<T = unknown> {
  previousState: CollectionState<T>;
  state: CollectionState<T>;
  reason: CollectionReason;
  event: Event | null;
}

export interface CollectionOptions {
  selectionMode?: SelectionMode;
  allowEmptySelection?: boolean;
  loopNavigation?: boolean;
  selectionOrder?: "selection" | "collection";
  disabledItemsFocusable?: boolean;
}

type Listener<T> = (change: CollectionChange<T>) => void;

export class CollectionController<T = unknown> {
  private items: CollectionItem<T>[] = [];
  private activeId: string | null = null;
  private selectedIds: string[] = [];
  private interactionMode: InteractionMode = "programmatic";
  private readonly listeners = new Set<Listener<T>>();
  private destroyed = false;
  private readonly options: Required<CollectionOptions>;

  constructor(options: CollectionOptions = {}) {
    this.options = {
      selectionMode: options.selectionMode ?? "single",
      allowEmptySelection: options.allowEmptySelection ?? true,
      loopNavigation: options.loopNavigation ?? false,
      selectionOrder: options.selectionOrder ?? "selection",
      disabledItemsFocusable: options.disabledItemsFocusable ?? false,
    };
  }

  getState(): CollectionState<T> {
    return {
      items: this.items,
      activeId: this.activeId,
      selectedIds: this.selectedIds,
      interactionMode: this.interactionMode,
    };
  }

  getItem(id: string): CollectionItem<T> | undefined { return this.items.find((item) => item.id === id); }
  getActiveItem(): CollectionItem<T> | undefined { return this.activeId ? this.getItem(this.activeId) : undefined; }
  isSelectable(id: string): boolean {
    const item = this.getItem(id);
    return !!item && !item.disabled && !item.hidden && item.selectable !== false;
  }
  private isNavigable(id: string): boolean { const item = this.getItem(id); return !!item && !item.hidden && item.selectable !== false && (!item.disabled || this.options.disabledItemsFocusable); }

  subscribe(listener: Listener<T>): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  setItems(items: readonly CollectionItem<T>[], event: Event | null = null): void {
    this.assertAlive();
    const ids = new Set<string>();
    for (const item of items) {
      if (!item.id || ids.has(item.id)) throw new Error(`Collection item ids must be unique: ${item.id}`);
      ids.add(item.id);
    }
    const previous = this.getState();
    this.items = items.map((item) => ({ ...item, disabled: !!item.disabled, hidden: !!item.hidden, selectable: item.selectable !== false }));
    if (!this.isSelectable(this.activeId ?? "")) this.activeId = this.findNearestSelectable(previous.items, previous.activeId);
    this.selectedIds = this.selectedIds.filter((id) => ids.has(id));
    this.emit(previous, "items", event);
  }

  addItem(item: CollectionItem<T>, event: Event | null = null): void { this.setItems([...this.items, item], event); }
  removeItem(id: string, event: Event | null = null): void { this.setItems(this.items.filter((item) => item.id !== id), event); }
  updateItem(id: string, update: Partial<CollectionItem<T>>, event: Event | null = null): void {
    const item = this.getItem(id); if (!item) return;
    this.setItems(this.items.map((current) => current.id === id ? { ...current, ...update, id } : current), event);
  }

  setActive(id: string | null, mode: InteractionMode = "programmatic", event: Event | null = null): boolean {
    this.assertAlive();
    if (id !== null && !this.isNavigable(id)) return false;
    if (id === this.activeId && mode === this.interactionMode) return false;
    const previous = this.getState(); this.activeId = id; this.interactionMode = mode; this.emit(previous, "active", event); return true;
  }

  next(event: Event | null = null): string | null { return this.move(1, event); }
  previous(event: Event | null = null): string | null { return this.move(-1, event); }
  first(event: Event | null = null): string | null { return this.moveTo(0, event); }
  last(event: Event | null = null): string | null { return this.moveTo(-1, event); }

  select(id: string, event: Event | null = null): boolean {
    this.assertAlive(); if (!this.isSelectable(id)) return false;
    if (this.options.selectionMode === "single") {
      if (this.selectedIds.length === 1 && this.selectedIds[0] === id) return false;
      const previous = this.getState(); this.selectedIds = [id]; this.emit(previous, "select", event); return true;
    }
    if (this.selectedIds.includes(id)) return this.deselect(id, event);
    const previous = this.getState(); this.selectedIds = [...this.selectedIds, id]; if (this.options.selectionOrder === "collection") this.selectedIds.sort((a, b) => this.items.findIndex((item) => item.id === a) - this.items.findIndex((item) => item.id === b)); this.emit(previous, "select", event); return true;
  }
  deselect(id: string, event: Event | null = null): boolean { this.assertAlive(); if (!this.selectedIds.includes(id)) return false; const previous = this.getState(); this.selectedIds = this.selectedIds.filter((selected) => selected !== id); this.emit(previous, "deselect", event); return true; }
  clearSelection(event: Event | null = null): boolean { this.assertAlive(); if (!this.selectedIds.length && this.options.allowEmptySelection) return false; const previous = this.getState(); this.selectedIds = []; this.emit(previous, "clear", event); return true; }

  destroy(): void { this.destroyed = true; this.listeners.clear(); this.items = []; this.activeId = null; this.selectedIds = []; }

  private move(delta: number, event: Event | null): string | null { this.assertAlive(); const available = this.items.filter((item) => this.isNavigable(item.id)); if (!available.length) return null; const index = available.findIndex((item) => item.id === this.activeId); let next = index < 0 ? (delta > 0 ? 0 : available.length - 1) : index + delta; if (this.options.loopNavigation) next = (next + available.length) % available.length; else next = Math.max(0, Math.min(available.length - 1, next)); this.setActive(available[next].id, "keyboard", event); return available[next].id; }
  private moveTo(index: number, event: Event | null): string | null { this.assertAlive(); const available = this.items.filter((item) => this.isNavigable(item.id)); if (!available.length) return null; const item = available[index < 0 ? available.length - 1 : index]; this.setActive(item.id, "keyboard", event); return item.id; }
  private findNearestSelectable(previous: readonly CollectionItem<T>[], previousId: string | null): string | null { const index = previous.findIndex((item) => item.id === previousId); for (let i = index + 1; i < previous.length; i++) if (this.isSelectable(previous[i].id)) return previous[i].id; for (let i = Math.min(index - 1, this.items.length - 1); i >= 0; i--) if (this.isSelectable(this.items[i].id)) return this.items[i].id; return null; }
  private emit(previousState: CollectionState<T>, reason: CollectionReason, event: Event | null): void { const change = { previousState, state: this.getState(), reason, event }; for (const listener of this.listeners) listener(change); }
  private assertAlive(): void { if (this.destroyed) throw new Error("CollectionController has been destroyed"); }
}
