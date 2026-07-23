import { bindCombobox, ComboboxBinding } from "./combobox-dom.js";
import { bindListbox, ListboxBinding } from "./listbox.js";
import { bindSelect, SelectBinding } from "./select.js";

export type RepUIBinding = ComboboxBinding | ListboxBinding | SelectBinding;
const instances = new WeakMap<HTMLElement, RepUIBinding>();

export function mount(root: HTMLElement): RepUIBinding | null {
  unmount(root);
  let binding: RepUIBinding | null = null;
  if (root.tagName === "SELECT" || root.matches("select[data-rui-select]")) binding = bindSelect(root as HTMLSelectElement);
  else if (root.matches("[data-rui-combobox]")) binding = bindCombobox(root);
  else if (root.matches("[data-rui-listbox]")) binding = bindListbox(root);
  if (binding) instances.set(root, binding);
  return binding;
}

export function unmount(root: HTMLElement): void {
  const binding = instances.get(root);
  if (!binding) return;
  binding.destroy(); instances.delete(root);
}

export const RepUI = { mount, unmount };
