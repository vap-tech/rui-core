# Accessibility smoke checklist

Это ручная проверка реального взаимодействия assistive technology. Она дополняет unit/DOM/browser tests.

## NVDA + Firefox/Chrome

- [ ] Combobox объявляет role, expanded, active option и selected value.
- [ ] Listbox сообщает active/selected/disabled options отдельно.
- [ ] Menu перемещается стрелками и закрывается Escape.
- [ ] Tabs сообщает выбранную вкладку и переключает panel.
- [ ] Dialog объявляется как modal, удерживает фокус и возвращает его trigger.
- [ ] Tree сообщает hierarchy, expanded/collapsed и selection.
- [ ] Radio Group объявляет checked radio и стрелочную навигацию.
- [ ] Toggle Group/Switch объявляют pressed/checked state.

## VoiceOver + Safari

- [ ] Повторить все пункты выше в Safari desktop или iOS.
- [ ] Проверить переход VoiceOver cursor между trigger, popup и content.
- [ ] Проверить, что скрытые панели/options не объявляются.

## Keyboard-only baseline

- [ ] Tab входит и выходит из composite ровно в ожидаемых местах.
- [ ] Arrow/Home/End не создают второй active.
- [ ] Escape закрывает верхний слой и возвращает фокус.
- [ ] Disabled и служебные элементы нельзя выбрать.
