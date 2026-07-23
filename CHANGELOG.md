# Changelog

## Unreleased

- Добавлен `CollectionController` с навигацией, selection и событиями.
- Добавлен Listbox DOM adapter с ARIA-синхронизацией.
- Добавлен `ComboboxController` с фильтрацией и keyboard navigation.
- Добавлен `PopupController` с lifecycle, outside-click и возвратом фокуса.
- Добавлен `bindCombobox` для интеграции input, popup, options и ARIA.
- Добавлен `bindSelect` для select-only режима и нативной form-синхронизации.
- Добавлены `RepUI.mount()` и `RepUI.unmount()` для повторной инициализации DOM-фрагментов.
- Добавлена синхронизация Select с `form.reset()` и стандартными `input`/`change` событиями.
- Добавлен typeahead для select-only Combobox с буфером и таймаутом.
- Добавлен автоматический refresh через `MutationObserver` для DOM adapters.
- Добавлена навигация `PageUp`/`PageDown` с настраиваемым размером страницы.
- Уточнена ARIA-синхронизация Combobox для listbox и multiple selection.
- Добавлено подтверждение произвольного значения в режиме `freeSolo`.
- Добавлен `FocusController` для focus containment и возврата фокуса.
- Добавлена опция `selectOnTab` для Combobox.
- Добавлена настройка `openOnFocus` для Combobox DOM adapter.
- Добавлена синхронизация Combobox с form input через `[data-rui-value]`.
- Добавлены unit- и DOM-тесты.
- Добавлена проверка покрытия через `npm run coverage`.
