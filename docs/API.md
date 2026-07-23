# RepUI Core API

RepUI Core — headless-механика: контроллеры хранят состояние, adapters связывают его с готовой DOM-разметкой.

## Общий lifecycle

Каждый adapter возвращает `controller` и `destroy()`:

```ts
const instance = bindListbox(root);
instance.controller.select("ready");
instance.destroy();
```

`destroy()` идемпотентен и удаляет listeners/observers.

## Основные контроллеры

- `CollectionController` — items, active, selection, disabled/hidden, single/multiple navigation.
- `ComboboxController` — input value, filtering, popup, freeSolo, typeahead, keyboard behavior.
- `PopupController` — open/close, outside click, reasons, focus return.
- `FocusController` — focus containment и возврат фокуса.
- `MenuController` — menu keyboard navigation и selection.
- `TabsController` — automatic/manual activation.
- `DialogController` — modal lifecycle, Escape, focus trap.
- `PopoverController` — popup lifecycle без позиционирования.
- `CommandPaletteController` — editable Combobox foundation для command palette.
- `RadioGroupController` — взаимоисключающий выбор.
- `ToggleGroupController` — single/multiple pressed state.
- `TreeViewController` — hierarchical navigation, expand/collapse, selection.
- `AccordionController` — single/multiple раскрытые секции.
- `SwitchController` — boolean checked state.

## DOM adapters

```ts
bindSelect(select)
bindListbox(root, options?)
bindCombobox(root, options?)
bindMenu(root)
bindTabs(root, "automatic" | "manual")
bindDialog(root, options?)
bindPopover(root)
bindCommandPalette(root)
bindRadioGroup(root)
bindToggleGroup(root, "single" | "multiple")
bindTreeView(root)
bindAccordion(root, { multiple?: boolean })
bindSwitch(root)
```

`RepUI.mount(root)` автоматически выбирает adapter по `data-rui-*`, а `RepUI.unmount(root)` уничтожает instance.

## Проверка

```bash
npm test
npm run coverage
npm run test:browser:docker
npm run test:browser:mobile
```
