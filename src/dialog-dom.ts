import { DialogController } from "./dialog.js";

export interface DialogBinding { controller: DialogController; destroy(): void; }

export function bindDialog(root: HTMLElement, options: { modal?: boolean; trapFocus?: boolean } = {}): DialogBinding {
  const document = root.ownerDocument; const trigger = document.querySelector<HTMLElement>(`[data-rui-dialog-trigger="${root.id}"]`); const controller = new DialogController(options); let destroyed = false;
  root.setAttribute("role", "dialog"); controller.setElements(root, trigger);
  const sync = (): void => { root.hidden = !controller.getState().open; if (controller.getState().modal) root.setAttribute("aria-modal", "true"); };
  const onTrigger = (event: Event): void => { event.preventDefault(); root.hidden = false; controller.open("programmatic"); sync(); };
  const onClose = (): void => { controller.close("close"); sync(); };
  const onKeyDown = (event: KeyboardEvent): void => { if (controller.handleKeyDown(event)) { event.preventDefault(); sync(); } };
  trigger?.addEventListener("click", onTrigger); root.querySelectorAll<HTMLElement>("[data-rui-dialog-close]").forEach((element) => element.addEventListener("click", onClose)); root.addEventListener("keydown", onKeyDown); sync();
  return { controller, destroy(): void { if (destroyed) return; destroyed = true; trigger?.removeEventListener("click", onTrigger); root.querySelectorAll<HTMLElement>("[data-rui-dialog-close]").forEach((element) => element.removeEventListener("click", onClose)); root.removeEventListener("keydown", onKeyDown); controller.destroy(); } };
}
