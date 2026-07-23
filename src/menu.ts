import { CollectionController, CollectionItem } from "./collection.js";

export type MenuReason = "keyboard" | "pointer" | "escape" | "select" | "programmatic";
export interface MenuState<T = unknown> { open: boolean; activeId: string | null; items: readonly CollectionItem<T>[]; }

export class MenuController<T = unknown> {
  readonly collection = new CollectionController<T>({ loopNavigation: true });
  private openState = false;
  private readonly listeners = new Set<(state: MenuState<T>, reason: MenuReason) => void>();
  private destroyed = false;
  getState(): MenuState<T> { const state = this.collection.getState(); return { open: this.openState, activeId: state.activeId, items: state.items }; }
  subscribe(listener: (state: MenuState<T>, reason: MenuReason) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly CollectionItem<T>[]): void { this.assertAlive(); this.collection.setItems(items); this.emit("programmatic"); }
  open(reason: MenuReason = "programmatic"): void { this.assertAlive(); if (this.openState) return; this.openState = true; this.emit(reason); }
  close(reason: MenuReason = "programmatic"): void { this.assertAlive(); if (!this.openState) return; this.openState = false; this.collection.setActive(null); this.emit(reason); }
  toggle(): void { if (this.openState) this.close(); else this.open(); }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === "Escape") { this.close("escape"); return true; } if (!this.openState) return false; if (event.key === "ArrowDown") { this.collection.next(event); return true; } if (event.key === "ArrowUp") { this.collection.previous(event); return true; } if (event.key === "Home") { this.collection.first(event); return true; } if (event.key === "End") { this.collection.last(event); return true; } if ((event.key === "Enter" || event.key === " ") && this.collection.getState().activeId) { this.emit("select"); return true; } return false; }
  selectActive(event: Event | null = null): string | null { this.assertAlive(); const id = this.collection.getState().activeId; if (!id || !this.collection.isSelectable(id)) return null; this.emit("select"); return id; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.collection.destroy(); }
  private emit(reason: MenuReason): void { const state = this.getState(); for (const listener of this.listeners) listener(state, reason); }
  private assertAlive(): void { if (this.destroyed) throw new Error("MenuController has been destroyed"); }
}
