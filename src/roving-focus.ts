export type RovingOrientation = "horizontal" | "vertical" | "both";

export interface RovingFocusOptions {
  orientation?: RovingOrientation;
  loop?: boolean;
  selector?: string;
}

export class RovingFocusController {
  private container: HTMLElement | null = null;
  private readonly options: Required<RovingFocusOptions>;
  private destroyed = false;

  constructor(options: RovingFocusOptions = {}) { this.options = { orientation: options.orientation ?? "both", loop: options.loop ?? true, selector: options.selector ?? "[data-rui-roving-item]" }; }
  setContainer(container: HTMLElement | null): void { if (this.container) this.detach(); this.container = container; if (container) { this.attach(); this.refresh(); } }
  refresh(): void { const items = this.items(); if (!items.length) return; const current = items.find((item) => item.tabIndex === 0 && !this.disabled(item)) ?? items.find((item) => !this.disabled(item)); items.forEach((item) => { item.tabIndex = item === current ? 0 : -1; }); }
  focusNext(): void { this.move(1); }
  focusPrevious(): void { this.move(-1); }
  focusFirst(): void { this.focusIndex(0); }
  focusLast(): void { this.focusIndex(-1); }
  destroy(): void { if (this.destroyed) return; this.detach(); this.container = null; this.destroyed = true; }
  private attach(): void { this.container?.addEventListener("keydown", this.onKeyDown); }
  private detach(): void { this.container?.removeEventListener("keydown", this.onKeyDown); }
  private readonly onKeyDown = (event: KeyboardEvent): void => { const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight"; const vertical = event.key === "ArrowUp" || event.key === "ArrowDown"; if ((horizontal && this.options.orientation === "vertical") || (vertical && this.options.orientation === "horizontal")) return; if (event.key === "Home") { event.preventDefault(); this.focusFirst(); } else if (event.key === "End") { event.preventDefault(); this.focusLast(); } else if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); this.focusNext(); } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); this.focusPrevious(); } };
  private move(direction: number): void { const items = this.items().filter((item) => !this.disabled(item)); if (!items.length) return; const current = items.findIndex((item) => item === this.container?.ownerDocument.activeElement || item.tabIndex === 0); let next = current < 0 ? (direction > 0 ? 0 : items.length - 1) : current + direction; if (this.options.loop) next = (next + items.length) % items.length; else next = Math.max(0, Math.min(items.length - 1, next)); this.focusIndex(items.indexOf(items[next])); }
  private focusIndex(index: number): void { const items = this.items().filter((item) => !this.disabled(item)); if (!items.length) return; const item = items[index < 0 ? items.length - 1 : Math.min(index, items.length - 1)]; items.forEach((entry) => { entry.tabIndex = entry === item ? 0 : -1; }); item.focus(); }
  private items(): HTMLElement[] { return this.container ? Array.from(this.container.querySelectorAll<HTMLElement>(this.options.selector)) : []; }
  private disabled(item: HTMLElement): boolean { return item.hasAttribute("disabled") || item.getAttribute("aria-disabled") === "true" || item.dataset.disabled === "true"; }
}
