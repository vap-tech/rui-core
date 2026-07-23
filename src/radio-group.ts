import { CollectionController, CollectionItem } from "./collection.js";

export interface RadioGroupState<T = unknown> { activeId: string | null; selectedId: string | null; items: readonly CollectionItem<T>[]; }
export class RadioGroupController<T = unknown> {
  readonly collection = new CollectionController<T>({ loopNavigation: true }); private selectedId: string | null = null; private readonly listeners = new Set<(state: RadioGroupState<T>) => void>(); private destroyed = false;
  getState(): RadioGroupState<T> { const state = this.collection.getState(); return { activeId: state.activeId, selectedId: this.selectedId, items: state.items }; }
  subscribe(listener: (state: RadioGroupState<T>) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly CollectionItem<T>[]): void { this.assertAlive(); this.collection.setItems(items); if (!this.selectedId || !this.collection.isSelectable(this.selectedId)) this.selectedId = null; this.emit(); }
  select(id: string): boolean { this.assertAlive(); if (!this.collection.isSelectable(id)) return false; if (this.selectedId === id) return false; this.selectedId = id; this.collection.setActive(id, "programmatic"); this.emit(); return true; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (["ArrowDown", "ArrowRight"].includes(event.key)) { this.collection.next(event); this.selectActive(); return true; } if (["ArrowUp", "ArrowLeft"].includes(event.key)) { this.collection.previous(event); this.selectActive(); return true; } if (event.key === " ") return this.selectActive(); return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.collection.destroy(); }
  private selectActive(): boolean { const id = this.collection.getState().activeId; return id ? this.select(id) : false; }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("RadioGroupController has been destroyed"); }
}
