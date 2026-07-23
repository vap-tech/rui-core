# RepUI Core

RepUI Core — headless-механика для интерактивных компонентов RepUI.

Библиотека хранит состояние и обрабатывает взаимодействие, но не рисует интерфейс и не навязывает CSS. Она не зависит от React, Vue, Django или конкретного UI-фреймворка.

## Что внутри

- `CollectionController` — коллекция options, active state, selection, disabled/hidden и навигация.
- `ComboboxController` — input, filtering, keyboard navigation, typeahead, `freeSolo` и popup state.
- `PopupController` — open/close, outside-click, причины закрытия и возврат фокуса.
- `FocusController` — удержание Tab-фокуса внутри контейнера.
- DOM adapters — `bindListbox`, `bindCombobox`, `bindSelect`, `bindMenu`, `bindTabs`, `bindDialog`, `bindPopover`.
- `RepUI.mount()` / `RepUI.unmount()` — безопасная инициализация DOM-фрагментов, включая HTMX/Django-сценарии; распознаются Select, Listbox, Combobox, Menu, Tabs, Dialog и Popover.

Состояния `active` и `selected` разделены. Core не считает CSS (`:hover`, `.active`, `.selected`) источником истины — DOM только отображает состояние через ARIA и `data-*` атрибуты.

## Быстрое подключение

После сборки пакет можно подключить локально или из Git-репозитория:

```bash
npm install git+ssh://git@github.com/vap-tech/rui-core.git
```

Для обычного Listbox разметка может выглядеть так:

```html
<div data-rui-listbox id="status-list">
  <button data-rui-option data-value="ready">Ready</button>
  <button data-rui-option data-value="paused" data-disabled="true">Paused</button>
</div>
```

```ts
import { RepUI, bindListbox } from "@repui/core";

const listbox = document.querySelector("[data-rui-listbox]");
if (listbox instanceof HTMLElement) {
  const instance = bindListbox(listbox);
  // instance.controller — состояние и команды контроллера
  // instance.destroy() — полное отключение
}

// Либо автоматическая инициализация:
RepUI.mount(listbox as HTMLElement);
```

Для нативного Select:

```ts
import { bindSelect } from "@repui/core";

const select = document.querySelector("select[data-rui-select]");
if (select instanceof HTMLSelectElement) {
  const instance = bindSelect(select);
  instance.controller.select("ready");
}
```

Для Combobox нужны элементы с атрибутами `data-rui-input`, `data-rui-popup` и `data-rui-option`; adapter сам синхронизирует ARIA и keyboard events:

```ts
import { bindCombobox } from "@repui/core";

const root = document.querySelector("[data-rui-combobox]");
if (root instanceof HTMLElement) {
  const instance = bindCombobox(root, {
    mode: "editable",
    freeSolo: true,
    openOnFocus: true,
  });
}
```

Основные настройки Combobox:

- `mode: "editable" | "select-only"`
- `freeSolo`
- `openOnInput` и `openOnFocus`
- `selectOnTab`
- `clearOnEscape` и `closeOnSelect`
- `filterOptions`
- `typeahead` / `typeaheadTimeout`
- `pageSize` для PageUp/PageDown
- `disabledItemsFocusable` для навигации по disabled options без возможности выбора

Для синхронизации с HTML-формой можно добавить внутрь Combobox элемент `[data-rui-value]`. Adapter будет записывать туда выбранное option или подтверждённое `freeSolo` значение и генерировать стандартные `input`/`change` события.

Для overlay-компонентов используется существующая разметка без позиционирования и CSS:

```html
<button data-rui-dialog-trigger="settings">Settings</button>
<div id="settings"><button data-rui-dialog-close>Close</button></div>
```

`CommandPaletteController` объединяет editable Combobox с поведением command palette:

```ts
import { CommandPaletteController } from "@repui/core";
const palette = new CommandPaletteController({ freeSolo: true, clearOnEscape: true });
palette.setItems([{ id: "settings", value: "settings", label: "Settings" }]);
palette.open();
```

Для готовой DOM-разметки доступен `bindCommandPalette(root)` с `[data-rui-input]`, `[data-rui-popup]` и `[data-rui-command]`.

```ts
import { bindDialog, bindPopover } from "@repui/core";
const dialog = bindDialog(document.querySelector("#settings")!);
// Для popover используется аналогичная связка:
// <button data-rui-popover-trigger="help">Help</button>
// <div id="help">...</div>
```

Listbox поддерживает keyboard navigation, `pointerdown`/pointer interaction, typeahead через общий controller, disabled/hidden options и автоматическое обновление после изменения DOM.

При замене HTML-фрагмента старый instance нужно уничтожить. Для этого можно использовать `RepUI.unmount(root)` перед повторным `RepUI.mount(root)`; adapters также автоматически обновляют options через `MutationObserver`.

## Разработка

Проект написан на TypeScript. Unit- и DOM-тесты запускаются через Node test runner, JSDOM используется для проверки adapters.

HTML-отчёт покрытия после запуска находится в `coverage/index.html`.

## Команды

```bash
npm install
npm test
npm run typecheck
npm run build
npm run coverage
npm run test:browser
npm run test:browser:docker
```

Для первого запуска browser-тестов установите браузеры Playwright:

```bash
npx playwright install chromium firefox webkit
```

На Arch Linux и других системах без совместимых WebKit-зависимостей используйте `npm run test:browser:docker`; команда запускает полный Chromium/Firefox/WebKit suite в официальном Playwright Ubuntu-образе.
