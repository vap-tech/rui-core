import { CollectionController, CollectionItem, SelectionMode } from "./collection.js";

export interface ToggleGroupState<T = unknown> { activeId: string | null; selectedIds: readonly string[]; items: readonly CollectionItem<T>[]; }
export class ToggleGroupController<T = unknown> {
  readonly collection: CollectionController<T>; private readonly listeners = new Set<(state: ToggleGroupState<T>) => void>(); private destroyed = false;
  constructor(mode: SelectionMode = "multiple") { this.collection = new CollectionController<T>({ selectionMode: mode, loopNavigation: true }); }
  getState(): ToggleGroupState<T> { const state = this.collection.getState(); return { activeId: state.activeId, selectedIds: state.selectedIds, items: state.items }; }
  subscribe(listener: (state: ToggleGroupState<T>) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly CollectionItem<T>[]): void { this.assertAlive(); this.collection.setItems(items); this.emit(); }
  toggle(id: string): boolean { this.assertAlive(); const result = this.collection.select(id); if (result) this.emit(); return result; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === "ArrowRight" || event.key === "ArrowDown") { this.collection.next(event); return true; } if (event.key === "ArrowLeft" || event.key === "ArrowUp") { this.collection.previous(event); return true; } if (event.key === " ") { const id = this.collection.getState().activeId; return id ? this.toggle(id) : false; } return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.collection.destroy(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("ToggleGroupController has been destroyed"); }
}
