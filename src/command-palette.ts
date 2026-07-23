import { CollectionItem } from "./collection.js";
import { ComboboxController, ComboboxOptions, ComboboxState } from "./combobox.js";

export interface CommandPaletteState<T = unknown> { open: boolean; combobox: ComboboxState<T>; }

export class CommandPaletteController<T = string> {
  readonly combobox: ComboboxController<T>;
  private readonly listeners = new Set<(state: CommandPaletteState<T>) => void>();
  private destroyed = false;
  constructor(options: ComboboxOptions<T> = {}) { this.combobox = new ComboboxController({ mode: "editable", openOnInput: true, clearOnEscape: true, ...options }); this.combobox.subscribe(() => this.emit()); }
  getState(): CommandPaletteState<T> { return { open: this.combobox.getState().open, combobox: this.combobox.getState() }; }
  subscribe(listener: (state: CommandPaletteState<T>) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setItems(items: readonly CollectionItem<T>[]): void { this.assertAlive(); this.combobox.setItems(items); }
  open(): boolean { this.assertAlive(); const wasOpen = this.getState().open; this.combobox.setOpen(true, "open"); return !wasOpen; }
  close(): boolean { this.assertAlive(); const wasOpen = this.getState().open; this.combobox.setOpen(false, "close"); return wasOpen; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); return this.combobox.handleKeyDown(event); }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.combobox.destroy(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("CommandPaletteController has been destroyed"); }
}
