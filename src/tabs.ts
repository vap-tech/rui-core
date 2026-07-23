import { CollectionController, CollectionItem } from "./collection.js";

export type TabsActivation = "automatic" | "manual";
export interface TabsState<T = unknown> { activeId: string | null; selectedId: string | null; items: readonly CollectionItem<T>[]; }

export class TabsController<T = unknown> {
  readonly collection = new CollectionController<T>({ loopNavigation: true });
  private selectedId: string | null = null;
  private readonly activation: TabsActivation;
  private readonly listeners = new Set<(state: TabsState<T>) => void>();
  private destroyed = false;
  constructor(activation: TabsActivation = "automatic") { this.activation = activation; }
  getState(): TabsState<T> { const state = this.collection.getState(); return { activeId: state.activeId, selectedId: this.selectedId, items: state.items }; }
  subscribe(listener: (state: TabsState<T>) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly CollectionItem<T>[]): void { this.assertAlive(); this.collection.setItems(items); if (!this.selectedId || !this.collection.isSelectable(this.selectedId)) this.selectedId = this.collection.getState().items.find((item) => this.collection.isSelectable(item.id))?.id ?? null; this.emit(); }
  activate(id: string): boolean { this.assertAlive(); if (!this.collection.isSelectable(id)) return false; this.collection.setActive(id, "programmatic"); this.selectedId = id; this.emit(); return true; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === "ArrowRight" || event.key === "ArrowDown") { this.collection.next(event); return this.maybeActivate(); } if (event.key === "ArrowLeft" || event.key === "ArrowUp") { this.collection.previous(event); return this.maybeActivate(); } if (event.key === "Home") { this.collection.first(event); return this.maybeActivate(); } if (event.key === "End") { this.collection.last(event); return this.maybeActivate(); } if (event.key === "Enter" || event.key === " ") return this.maybeActivate(true); return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.collection.destroy(); }
  private maybeActivate(force = false): boolean { const active = this.collection.getState().activeId; if (!active) return false; if (this.activation === "automatic" || force) this.selectedId = active; this.emit(); return true; }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("TabsController has been destroyed"); }
}
