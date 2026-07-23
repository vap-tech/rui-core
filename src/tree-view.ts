import { CollectionController, CollectionItem } from "./collection.js";
export interface TreeItem<T = unknown> extends CollectionItem<T> { parentId?: string | null; }
export interface TreeState<T = unknown> { activeId: string | null; selectedIds: readonly string[]; expandedIds: readonly string[]; items: readonly TreeItem<T>[]; }
export class TreeViewController<T = unknown> {
  readonly collection = new CollectionController<T>({ selectionMode: "multiple", loopNavigation: false }); private expanded = new Set<string>(); private readonly listeners = new Set<(state: TreeState<T>) => void>(); private destroyed = false;
  getState(): TreeState<T> { const state = this.collection.getState(); return { activeId: state.activeId, selectedIds: state.selectedIds, expandedIds: [...this.expanded], items: state.items as readonly TreeItem<T>[] }; }
  subscribe(listener: (state: TreeState<T>) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly TreeItem<T>[]): void { this.assertAlive(); this.collection.setItems(items); const ids = new Set(items.map((item) => item.id)); this.expanded = new Set([...this.expanded].filter((id) => ids.has(id))); this.emit(); }
  expand(id: string): boolean { this.assertAlive(); if (this.expanded.has(id) || !this.hasChildren(id)) return false; this.expanded.add(id); this.emit(); return true; }
  collapse(id: string): boolean { this.assertAlive(); if (!this.expanded.has(id)) return false; this.expanded.delete(id); this.emit(); return true; }
  toggle(id: string): boolean { return this.expanded.has(id) ? this.collapse(id) : this.expand(id); }
  select(id: string): boolean { this.assertAlive(); const result = this.collection.select(id); if (result) this.emit(); return result; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); const id = this.collection.getState().activeId; if (event.key === "ArrowRight" && id) return this.expanded.has(id) ? !!this.collection.first(event) : this.expand(id); if (event.key === "ArrowLeft" && id) return this.expanded.has(id) ? this.collapse(id) : this.parentActive(id, event); if (event.key === "ArrowDown") { this.moveVisible(1, event); return true; } if (event.key === "ArrowUp") { this.moveVisible(-1, event); return true; } if (event.key === "Home") { this.moveVisibleTo(0, event); return true; } if (event.key === "End") { this.moveVisibleTo(-1, event); return true; } if (event.key === " ") return id ? this.select(id) : false; return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.collection.destroy(); }
  private visible(): TreeItem<T>[] { const all = this.collection.getState().items as readonly TreeItem<T>[]; const result: TreeItem<T>[] = []; const walk = (parent: string | null) => { for (const item of all.filter((entry) => (entry.parentId ?? null) === parent)) { result.push(item); if (this.expanded.has(item.id)) walk(item.id); } }; walk(null); return result; }
  private moveVisible(delta: number, event: KeyboardEvent): void { const items = this.visible().filter((item) => this.collection.isSelectable(item.id)); const index = items.findIndex((item) => item.id === this.collection.getState().activeId); if (items.length) this.collection.setActive(items[Math.max(0, Math.min(items.length - 1, (index < 0 ? (delta > 0 ? 0 : items.length - 1) : index + delta)))].id, "keyboard", event); }
  private moveVisibleTo(index: number, event: KeyboardEvent): void { const items = this.visible().filter((item) => this.collection.isSelectable(item.id)); if (items.length) this.collection.setActive(items[index < 0 ? items.length - 1 : index].id, "keyboard", event); }
  private hasChildren(id: string): boolean { return (this.collection.getState().items as readonly TreeItem<T>[]).some((item) => item.parentId === id); }
  private parentActive(id: string, event: KeyboardEvent): boolean { const parent = (this.collection.getItem(id) as TreeItem<T> | undefined)?.parentId; return parent ? !!this.collection.setActive(parent, "keyboard", event) : false; }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("TreeViewController has been destroyed"); }
}
