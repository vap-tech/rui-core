import { FocusController } from "./focus.js";

export type DialogReason = "programmatic" | "keyboard" | "escape" | "close";
export interface DialogState { open: boolean; modal: boolean; }

export class DialogController {
  private openState = false;
  private readonly modal: boolean;
  private readonly focus: FocusController;
  private dialog: HTMLElement | null = null;
  private trigger: HTMLElement | null = null;
  private readonly listeners = new Set<(state: DialogState, reason: DialogReason) => void>();
  private destroyed = false;
  constructor(options: { modal?: boolean; trapFocus?: boolean } = {}) { this.modal = options.modal ?? true; this.focus = new FocusController({ trap: options.trapFocus ?? true }); }
  getState(): DialogState { return { open: this.openState, modal: this.modal }; }
  subscribe(listener: (state: DialogState, reason: DialogReason) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setElements(dialog: HTMLElement | null, trigger: HTMLElement | null = null): void { this.assertAlive(); this.dialog = dialog; this.trigger = trigger; this.focus.setContainer(dialog); this.focus.setTrigger(trigger); }
  open(reason: DialogReason = "programmatic"): boolean { this.assertAlive(); if (this.openState) return false; this.openState = true; this.dialog?.setAttribute("aria-modal", String(this.modal)); this.emit(reason); this.focus.focusFirst(); return true; }
  close(reason: DialogReason = "close"): boolean { this.assertAlive(); if (!this.openState) return false; this.openState = false; this.emit(reason); this.focus.release(); return true; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (!this.openState) return false; if (event.key === "Escape") { this.close("escape"); return true; } return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.focus.destroy(); this.dialog = null; this.trigger = null; }
  private emit(reason: DialogReason): void { const state = this.getState(); for (const listener of this.listeners) listener(state, reason); }
  private assertAlive(): void { if (this.destroyed) throw new Error("DialogController has been destroyed"); }
}
