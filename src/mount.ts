import { bindCombobox, ComboboxBinding } from "./combobox-dom.js";
import { bindListbox, ListboxBinding } from "./listbox.js";
import { bindSelect, SelectBinding } from "./select.js";
import { bindMenu, MenuBinding } from "./menu-dom.js";
import { bindTabs, TabsBinding } from "./tabs-dom.js";
import { bindDialog, DialogBinding } from "./dialog-dom.js";
import { bindPopover, PopoverBinding } from "./popover-dom.js";
import { bindCommandPalette, CommandPaletteBinding } from "./command-palette-dom.js";
import { bindTreeView, TreeViewBinding } from "./tree-view-dom.js";
import { bindAccordion, AccordionBinding } from "./accordion-dom.js";
import { bindSwitch, SwitchBinding } from "./switch-dom.js";

export type RepUIBinding = ComboboxBinding | ListboxBinding | SelectBinding | MenuBinding | TabsBinding | DialogBinding | PopoverBinding | CommandPaletteBinding | TreeViewBinding | AccordionBinding | SwitchBinding;
const instances = new WeakMap<HTMLElement, RepUIBinding>();

export function mount(root: HTMLElement): RepUIBinding | null {
  unmount(root);
  let binding: RepUIBinding | null = null;
  if (root.tagName === "SELECT" || root.matches("select[data-rui-select]")) binding = bindSelect(root as HTMLSelectElement);
  else if (root.matches("[data-rui-combobox]")) binding = bindCombobox(root);
  else if (root.matches("[data-rui-listbox]")) binding = bindListbox(root);
  else if (root.matches("[data-rui-menu]")) binding = bindMenu(root);
  else if (root.matches("[data-rui-tabs]")) binding = bindTabs(root);
  else if (root.matches("[data-rui-dialog]")) binding = bindDialog(root);
  else if (root.matches("[data-rui-popover]")) binding = bindPopover(root);
  else if (root.matches("[data-rui-command-palette]")) binding = bindCommandPalette(root);
  else if (root.matches("[data-rui-tree]")) binding = bindTreeView(root);
  else if (root.matches("[data-rui-accordion]")) binding = bindAccordion(root);
  else if (root.matches("[data-rui-switch]")) binding = bindSwitch(root);
  if (binding) instances.set(root, binding);
  return binding;
}

export function unmount(root: HTMLElement): void {
  const binding = instances.get(root);
  if (!binding) return;
  binding.destroy(); instances.delete(root);
}

export const RepUI = { mount, unmount };
