export interface TooltipState { open: boolean; disabled: boolean; }
export type TooltipReason = "programmatic" | "hover" | "focus" | "touch" | "escape" | "blur" | "leave" | "timeout";
export interface TooltipOptions { openDelay?: number; closeDelay?: number; disabled?: boolean; document?: Document; }

export class TooltipController {
  private openState = false; private disabled: boolean; private readonly openDelay: number; private readonly closeDelay: number; private readonly document?: Document; private trigger: HTMLElement | null = null; private content: HTMLElement | null = null; private openTimer: ReturnType<typeof setTimeout> | null = null; private closeTimer: ReturnType<typeof setTimeout> | null = null; private destroyed = false; private readonly listeners = new Set<(state: TooltipState, reason: TooltipReason) => void>();
  constructor(options: TooltipOptions = {}) { this.openDelay = options.openDelay ?? 300; this.closeDelay = options.closeDelay ?? 0; this.disabled = options.disabled ?? false; this.document = options.document; }
  getState(): TooltipState { return { open: this.openState, disabled: this.disabled }; }
  subscribe(listener: (state: TooltipState, reason: TooltipReason) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setElements(trigger: HTMLElement | null, content: HTMLElement | null): void { this.assertAlive(); this.trigger = trigger; this.content = content; if (trigger && content) { if (!content.id) content.id = `rui-tooltip-${Math.random().toString(36).slice(2, 8)}`; trigger.setAttribute("aria-describedby", content.id); } this.sync(); }
  open(reason: TooltipReason = "programmatic"): boolean { this.assertAlive(); if (this.disabled || this.openState) return false; this.clearTimers(); this.openState = true; this.sync(); this.emit(reason); return true; }
  close(reason: TooltipReason = "programmatic"): boolean { this.assertAlive(); if (!this.openState) return false; this.clearTimers(); this.openState = false; this.sync(); this.emit(reason); return true; }
  scheduleOpen(reason: TooltipReason = "hover"): void { this.assertAlive(); if (this.disabled || this.openState) return; this.clearTimers(); this.openTimer = setTimeout(() => { this.openTimer = null; this.open(reason); }, this.openDelay); }
  scheduleClose(reason: TooltipReason = "leave"): void { this.assertAlive(); if (!this.openState) return; this.clearTimers(); this.closeTimer = setTimeout(() => { this.closeTimer = null; this.close(reason); }, this.closeDelay); }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (event.key === "Escape") return this.close("escape"); return false; }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.clearTimers(); const trigger = this.trigger; const content = this.content; if (trigger && trigger.getAttribute("aria-describedby") === content?.id) trigger.removeAttribute("aria-describedby"); this.listeners.clear(); this.trigger = null; this.content = null; }
  private sync(): void { if (this.content) this.content.hidden = !this.openState; if (this.trigger) this.trigger.setAttribute("aria-expanded", String(this.openState)); }
  private emit(reason: TooltipReason): void { const state = this.getState(); for (const listener of this.listeners) listener(state, reason); }
  private clearTimers(): void { if (this.openTimer) clearTimeout(this.openTimer); if (this.closeTimer) clearTimeout(this.closeTimer); this.openTimer = null; this.closeTimer = null; }
  private assertAlive(): void { if (this.destroyed) throw new Error("TooltipController has been destroyed"); }
}

export class HovercardController extends TooltipController {}
