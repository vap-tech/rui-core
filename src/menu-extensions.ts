import { MenuController } from "./menu.js";

export interface MenubarState { activeIndex: number; openIndex: number | null; }
export class MenubarController {
  readonly menus: readonly MenuController[]; private activeIndex = 0; private openIndex: number | null = null; private destroyed = false; private readonly listeners = new Set<(state: MenubarState) => void>();
  constructor(menus: readonly MenuController[] = []) { this.menus = menus; }
  getState(): MenubarState { return { activeIndex: this.activeIndex, openIndex: this.openIndex }; }
  subscribe(listener: (state: MenubarState) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setActive(index: number): boolean { this.assertAlive(); if (!this.menus[index]) return false; this.activeIndex = index; this.emit(); return true; }
  open(index = this.activeIndex): boolean { this.assertAlive(); if (!this.menus[index]) return false; this.menus[this.openIndex ?? index]?.close("programmatic"); this.activeIndex = index; this.openIndex = index; this.menus[index].open("programmatic"); this.emit(); return true; }
  close(): boolean { this.assertAlive(); if (this.openIndex === null) return false; this.menus[this.openIndex].close("escape"); this.openIndex = null; this.emit(); return true; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === "ArrowRight") return this.setActive((this.activeIndex + 1) % this.menus.length) && (this.openIndex === null || !!this.open(this.activeIndex)); if (event.key === "ArrowLeft") return this.setActive((this.activeIndex - 1 + this.menus.length) % this.menus.length) && (this.openIndex === null || !!this.open(this.activeIndex)); if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") return this.open(); if (event.key === "Escape") return this.close(); return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; for (const menu of this.menus) menu.destroy(); this.listeners.clear(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("MenubarController has been destroyed"); }
}

export interface ContextMenuState { open: boolean; x: number | null; y: number | null; }
export class ContextMenuController {
  readonly menu: MenuController; private x: number | null = null; private y: number | null = null; private destroyed = false; private readonly listeners = new Set<(state: ContextMenuState) => void>();
  constructor(menu = new MenuController()) { this.menu = menu; }
  getState(): ContextMenuState { return { open: this.menu.getState().open, x: this.x, y: this.y }; }
  subscribe(listener: (state: ContextMenuState) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  open(x: number, y: number): boolean { this.assertAlive(); this.x = x; this.y = y; this.menu.open("pointer"); this.emit(); return true; }
  close(): boolean { this.assertAlive(); const changed = this.menu.getState().open; this.menu.close("escape"); this.emit(); return changed; }
  handleContextMenu(event: MouseEvent): boolean { event.preventDefault(); return this.open(event.clientX, event.clientY); }
  handleKeyDown(event: KeyboardEvent): boolean { if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) return this.open(0, 0); if (event.key === "Escape") return this.close(); return this.menu.handleKeyDown(event); }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.menu.destroy(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("ContextMenuController has been destroyed"); }
}
