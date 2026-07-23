import { PopoverController } from "./popover.js";

export interface PopoverBinding { controller: PopoverController; destroy(): void; }

export function bindPopover(root: HTMLElement): PopoverBinding {
  const document = root.ownerDocument; const trigger = document.querySelector<HTMLElement>(`[data-rui-popover-trigger="${root.id}"]`); const controller = new PopoverController({ document }); let destroyed = false;
  root.setAttribute("role", root.getAttribute("role") ?? "dialog"); controller.setElements(trigger, root);
  const sync = (): void => { root.hidden = !controller.getState().open; root.setAttribute("aria-hidden", String(!controller.getState().open)); };
  const onTrigger = (): void => { controller.toggle(); sync(); }; const onKeyDown = (event: KeyboardEvent): void => { if (controller.handleKeyDown(event)) { event.preventDefault(); sync(); } };
  trigger?.addEventListener("click", onTrigger); root.addEventListener("keydown", onKeyDown); sync();
  return { controller, destroy(): void { if (destroyed) return; destroyed = true; trigger?.removeEventListener("click", onTrigger); root.removeEventListener("keydown", onKeyDown); controller.destroy(); } };
}
