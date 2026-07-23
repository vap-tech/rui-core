import { PopupController, PopupReason } from "./popup.js";

export interface PopoverState { open: boolean; }

export class PopoverController {
  readonly popup: PopupController;
  private trigger: HTMLElement | null = null;
  private popover: HTMLElement | null = null;
  private readonly listeners = new Set<(state: PopoverState, reason: PopupReason) => void>();
  private destroyed = false;
  constructor(options: { returnFocus?: boolean; closeOnOutsideClick?: boolean; document?: Document } = {}) { this.popup = new PopupController(options); this.popup.subscribe((state, change) => { this.emit(state.reason ?? "programmatic"); }); }
  getState(): PopoverState { return { open: this.popup.getState().open }; }
  subscribe(listener: (state: PopoverState, reason: PopupReason) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setElements(trigger: HTMLElement | null, popover: HTMLElement | null): void { this.assertAlive(); this.trigger = trigger; this.popover = popover; this.popup.setTrigger(trigger); this.popup.setPopup(popover); }
  open(reason: PopupReason = "programmatic"): boolean { this.assertAlive(); return this.popup.open(reason); }
  close(reason: PopupReason = "programmatic"): boolean { this.assertAlive(); return this.popup.close(reason); }
  toggle(): boolean { this.assertAlive(); return this.popup.toggle(); }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === "Escape" && this.getState().open) return this.close("escape"); return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); this.popup.destroy(); this.trigger = null; this.popover = null; }
  private emit(reason: PopupReason): void { const state = this.getState(); for (const listener of this.listeners) listener(state, reason); }
  private assertAlive(): void { if (this.destroyed) throw new Error("PopoverController has been destroyed"); }
}
