import { CollectionController, CollectionItem } from "./collection.js";

export type CheckboxValue = "unchecked" | "checked" | "mixed";
export interface CheckboxState { value: CheckboxValue; disabled: boolean; }

export class CheckboxController {
  private value: CheckboxValue;
  private disabled: boolean;
  private destroyed = false;
  private readonly listeners = new Set<(state: CheckboxState) => void>();
  constructor(options: { checked?: boolean; mixed?: boolean; disabled?: boolean } = {}) {
    this.value = options.mixed ? "mixed" : options.checked ? "checked" : "unchecked";
    this.disabled = options.disabled ?? false;
  }
  getState(): CheckboxState { return { value: this.value, disabled: this.disabled }; }
  subscribe(listener: (state: CheckboxState) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setValue(value: CheckboxValue): boolean { this.assertAlive(); if (this.disabled || this.value === value) return false; this.value = value; this.emit(); return true; }
  setChecked(checked: boolean): boolean { return this.setValue(checked ? "checked" : "unchecked"); }
  toggle(): boolean { return this.setChecked(this.value !== "checked"); }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === " ") return this.toggle(); return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("CheckboxController has been destroyed"); }
}

export interface CheckboxGroupState<T = unknown> { activeId: string | null; selectedIds: readonly string[]; mixed: boolean; items: readonly CollectionItem<T>[]; }
export class CheckboxGroupController<T = unknown> {
  readonly collection = new CollectionController<T>({ selectionMode: "multiple", loopNavigation: true });
  private selectedIds = new Set<string>();
  private readonly listeners = new Set<(state: CheckboxGroupState<T>) => void>();
  private destroyed = false;
  getState(): CheckboxGroupState<T> { const state = this.collection.getState(); const selectable = state.items.filter((item) => !item.disabled); const selected = selectable.filter((item) => this.selectedIds.has(item.id)); return { activeId: state.activeId, selectedIds: [...this.selectedIds], mixed: selected.length > 0 && selected.length < selectable.length, items: state.items }; }
  subscribe(listener: (state: CheckboxGroupState<T>) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly CollectionItem<T>[]): void { this.assertAlive(); this.collection.setItems(items); const valid = new Set(items.filter((item) => !item.disabled).map((item) => item.id)); this.selectedIds = new Set([...this.selectedIds].filter((id) => valid.has(id))); this.emit(); }
  toggle(id: string): boolean { this.assertAlive(); if (!this.collection.isSelectable(id)) return false; if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id); this.collection.setActive(id, "programmatic"); this.emit(); return true; }
  selectAll(): boolean { this.assertAlive(); const ids = this.collection.getState().items.filter((item) => !item.disabled).map((item) => item.id); if (ids.every((id) => this.selectedIds.has(id))) return false; this.selectedIds = new Set(ids); this.emit(); return true; }
  clearAll(): boolean { this.assertAlive(); if (!this.selectedIds.size) return false; this.selectedIds.clear(); this.emit(); return true; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === "ArrowDown" || event.key === "ArrowRight") { this.collection.next(event); return true; } if (event.key === "ArrowUp" || event.key === "ArrowLeft") { this.collection.previous(event); return true; } if (event.key === " ") { const id = this.collection.getState().activeId; return id ? this.toggle(id) : false; } return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.collection.destroy(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("CheckboxGroupController has been destroyed"); }
}
