export interface FocusOptions {
  returnFocus?: boolean;
  trap?: boolean;
}

const focusable = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export class FocusController {
  private container: HTMLElement | null = null;
  private trigger: HTMLElement | null = null;
  private readonly options: Required<FocusOptions>;
  private destroyed = false;

  constructor(options: FocusOptions = {}) { this.options = { returnFocus: options.returnFocus ?? true, trap: options.trap ?? true }; }
  setContainer(container: HTMLElement | null): void { if (this.container) this.detach(); this.container = container; if (container) this.attach(); }
  setTrigger(trigger: HTMLElement | null): void { this.trigger = trigger; }
  focusFirst(): void { this.getFocusable()[0]?.focus(); }
  focusLast(): void { const elements = this.getFocusable(); elements[elements.length - 1]?.focus(); }
  release(): void { if (this.options.returnFocus) this.trigger?.focus(); }
  destroy(): void { if (this.destroyed) return; this.detach(); this.container = null; this.trigger = null; this.destroyed = true; }
  private attach(): void { if (this.options.trap) this.container?.addEventListener("keydown", this.onKeyDown); }
  private detach(): void { this.container?.removeEventListener("keydown", this.onKeyDown); }
  private readonly onKeyDown = (event: KeyboardEvent): void => { if (event.key !== "Tab") return; const elements = this.getFocusable(); if (!elements.length) return; const first = elements[0]; const last = elements[elements.length - 1]; if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus(); } };
  private getFocusable(): HTMLElement[] { return this.container ? Array.from(this.container.querySelectorAll<HTMLElement>(focusable)).filter((element) => !element.hasAttribute("disabled") && !element.hidden) : []; }
}
