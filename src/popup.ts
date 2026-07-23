export type PopupReason = "keyboard" | "pointer" | "input" | "toggle" | "escape" | "outside-click" | "select" | "blur" | "programmatic";

export interface PopupState {
  open: boolean;
  reason: PopupReason | null;
}

export interface PopupChange {
  previousState: PopupState;
  state: PopupState;
  reason: PopupReason;
  event: Event | null;
}

export interface PopupOptions {
  returnFocus?: boolean;
  closeOnOutsideClick?: boolean;
  document?: Document;
}

type Listener = (state: PopupState, change: PopupChange) => void;

export class PopupController {
  private openState = false;
  private lastReason: PopupReason | null = null;
  private trigger: HTMLElement | null = null;
  private popup: HTMLElement | null = null;
  private readonly allowedLayers = new Set<HTMLElement>();
  private readonly listeners = new Set<Listener>();
  private readonly options: Required<Pick<PopupOptions, "returnFocus" | "closeOnOutsideClick">> & PopupOptions;
  private readonly document: Document | null;
  private destroyed = false;

  constructor(options: PopupOptions = {}) {
    this.options = { returnFocus: options.returnFocus ?? true, closeOnOutsideClick: options.closeOnOutsideClick ?? true, ...options };
    this.document = options.document ?? (typeof document === "undefined" ? null : document);
    this.document?.addEventListener("pointerdown", this.onPointerDown, true);
  }
  getState(): PopupState { return { open: this.openState, reason: this.lastReason }; }
  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setTrigger(element: HTMLElement | null): void { this.trigger = element; }
  setPopup(element: HTMLElement | null): void { this.popup = element; }
  addAllowedLayer(element: HTMLElement): () => void { this.allowedLayers.add(element); return () => this.allowedLayers.delete(element); }
  open(reason: PopupReason = "programmatic"): boolean { return this.setOpen(true, reason); }
  close(reason: PopupReason = "programmatic"): boolean { return this.setOpen(false, reason); }
  toggle(reason: PopupReason = "toggle"): boolean { return this.setOpen(!this.openState, reason); }
  setOpen(open: boolean, reason: PopupReason = "programmatic", event: Event | null = null): boolean {
    this.assertAlive(); if (this.openState === open) return false;
    const previousState = this.getState(); this.openState = open; this.lastReason = reason; this.emit(previousState, event);
    if (!open && this.options.returnFocus) this.trigger?.focus();
    return true;
  }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.document?.removeEventListener("pointerdown", this.onPointerDown, true); this.listeners.clear(); this.allowedLayers.clear(); this.trigger = null; this.popup = null; }
  private readonly onPointerDown = (event: Event): void => { if (!this.openState || !this.options.closeOnOutsideClick) return; const target = event.target; const NodeConstructor = this.document?.defaultView?.Node; if (!NodeConstructor || !(target instanceof NodeConstructor)) return; if (this.trigger?.contains(target) || this.popup?.contains(target)) return; for (const layer of this.allowedLayers) if (layer.contains(target)) return; this.close("outside-click"); };
  private emit(previousState: PopupState, event: Event | null): void { const state = this.getState(); const change = { previousState, state, reason: state.reason!, event }; for (const listener of this.listeners) listener(state, change); }
  private assertAlive(): void { if (this.destroyed) throw new Error("PopupController has been destroyed"); }
}
