export interface SliderState { value: number; min: number; max: number; step: number; disabled: boolean; orientation: "horizontal" | "vertical"; }
export interface RangeSliderState extends Omit<SliderState, "value"> { values: readonly [number, number]; }
type Listener<S> = (state: S) => void;

function snap(value: number, min: number, max: number, step: number): number { const result = Math.round((value - min) / step) * step + min; return Math.min(max, Math.max(min, Number(result.toFixed(12)))); }
function keyDelta(key: string, step: number, pageSize: number): number | null { if (key === "ArrowRight" || key === "ArrowUp") return step; if (key === "ArrowLeft" || key === "ArrowDown") return -step; if (key === "PageUp") return pageSize; if (key === "PageDown") return -pageSize; return null; }

export class SliderController {
  private value: number; private readonly min: number; private readonly max: number; private readonly step: number; private readonly pageSize: number; private readonly orientation: "horizontal" | "vertical"; private disabled: boolean; private destroyed = false; private readonly listeners = new Set<Listener<SliderState>>();
  constructor(options: { value?: number; min?: number; max?: number; step?: number; pageSize?: number; disabled?: boolean; orientation?: "horizontal" | "vertical" } = {}) { this.min = options.min ?? 0; this.max = options.max ?? 100; this.step = options.step ?? 1; this.pageSize = options.pageSize ?? Math.max(this.step, (this.max - this.min) / 10); this.orientation = options.orientation ?? "horizontal"; this.disabled = options.disabled ?? false; this.value = snap(options.value ?? this.min, this.min, this.max, this.step); }
  getState(): SliderState { return { value: this.value, min: this.min, max: this.max, step: this.step, disabled: this.disabled, orientation: this.orientation }; }
  subscribe(listener: Listener<SliderState>): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setValue(value: number): boolean { this.assertAlive(); const next = snap(value, this.min, this.max, this.step); if (this.disabled || next === this.value) return false; this.value = next; this.emit(); return true; }
  handleKeyDown(event: KeyboardEvent): boolean { this.assertAlive(); if (this.disabled) return false; if (event.key === "Home") return this.setValue(this.min); if (event.key === "End") return this.setValue(this.max); const delta = keyDelta(event.key, this.step, this.pageSize); return delta === null ? false : this.setValue(this.value + delta); }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("SliderController has been destroyed"); }
}

export class RangeSliderController {
  private values: [number, number]; private readonly min: number; private readonly max: number; private readonly step: number; private readonly pageSize: number; private readonly orientation: "horizontal" | "vertical"; private disabled: boolean; private destroyed = false; private readonly listeners = new Set<Listener<RangeSliderState>>();
  constructor(options: { values?: readonly [number, number]; min?: number; max?: number; step?: number; pageSize?: number; disabled?: boolean; orientation?: "horizontal" | "vertical" } = {}) { this.min = options.min ?? 0; this.max = options.max ?? 100; this.step = options.step ?? 1; this.pageSize = options.pageSize ?? Math.max(this.step, (this.max - this.min) / 10); this.orientation = options.orientation ?? "horizontal"; this.disabled = options.disabled ?? false; const values = options.values ?? [this.min, this.max]; this.values = [snap(Math.min(values[0], values[1]), this.min, this.max, this.step), snap(Math.max(values[0], values[1]), this.min, this.max, this.step)]; }
  getState(): RangeSliderState { return { values: [...this.values] as [number, number], min: this.min, max: this.max, step: this.step, disabled: this.disabled, orientation: this.orientation }; }
  subscribe(listener: Listener<RangeSliderState>): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setValue(index: 0 | 1, value: number): boolean { this.assertAlive(); if (this.disabled) return false; const next = snap(value, this.min, this.max, this.step); if ((index === 0 && next === this.values[0]) || (index === 1 && next === this.values[1])) return false; if (index === 0) this.values[0] = Math.min(next, this.values[1]); else this.values[1] = Math.max(next, this.values[0]); this.emit(); return true; }
  handleKeyDown(index: 0 | 1, event: KeyboardEvent): boolean { this.assertAlive(); if (this.disabled) return false; const current = this.values[index]; if (event.key === "Home") return this.setValue(index, this.min); if (event.key === "End") return this.setValue(index, this.max); const delta = keyDelta(event.key, this.step, this.pageSize); return delta === null ? false : this.setValue(index, current + delta); }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.listeners.clear(); }
  private emit(): void { const state = this.getState(); for (const listener of this.listeners) listener(state); }
  private assertAlive(): void { if (this.destroyed) throw new Error("RangeSliderController has been destroyed"); }
}
