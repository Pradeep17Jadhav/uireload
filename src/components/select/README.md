# Select

A dropdown list: a button that opens a listbox in a popover.

## Reference libraries

| Concern               | Source                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition    | `@mui/material/Select/Select.d.ts` — `SelectProps` (`value`, `multiple`, `onChange`, `renderValue`, `MenuProps`, `input`, `IconComponent`)                                                                                                                                                                                              |
| Selection model       | Same file — `MenuProps`, `renderValue`, and `SelectChangeEvent`'s `target.value`/``name`                                                                                                                                                                                                                                                |
| Input integration     | Same file — `InputProps` / `FormControl`, i.e. a native `<input type="hidden" name>` inside the MUI select                                                                                                                                                                                                                              |
| Behaviour, keyboard   | `@ui5/webcomponents/dist/Select.d.ts` — the `keydown` documentation block: `[F4] / [Alt] + [Up] / [Alt] + [Down] / [Space] or [Enter] - Opens/closes the drop-down`, `[ESC] - Closes the drop-down without changing the selection`, `[Home] / [End] - Moves selection to the first/last option`, `[Alt] + [Home]/[End]`, type-to-select |
| Option model          | Same file — `Select.d.ts`'s `SelectOptions`/`SelectOption` interfaces and `OptionCustom`; `value` is `@formProperty`                                                                                                                                                                                                                    |
| Grouping              | Same file — `<ui5-option-group>` with a `headerText` slot and `_groupCountText`                                                                                                                                                                                                                                                         |
| Unmatched value       | Same file — "If the given value does not match any existing option, no option will be selected and the Select component will be displayed as empty."                                                                                                                                                                                    |
| Typeahead timing      | Same file — `_typingTimeoutID`, defaulting to 1000 ms                                                                                                                                                                                                                                                                                   |
| Dropdown positioning  | `@ui5/webcomponents/dist/ResponsivePopover.d.ts` — `placement` of `Bottom` on desktop and `Left`/`Right` on phone                                                                                                                                                                                                                       |
| Empty-value behaviour | Same file — `_isNoValue` / `_selectedOption`, i.e. the "no selection" state is distinct from a value of `""`                                                                                                                                                                                                                            |
| APG listbox           | WAI-ARIA APG Listbox pattern; `useRovingFocus` in `src/internal/focus.ts`                                                                                                                                                                                                                                                               |

Versions read from `../referenceUILibraries/package.json`: `@mui/material` 9.4.0,
`@ui5/webcomponents` 2.27.2.

## Props

| Prop                              | Type                                              | Default              | Notes                                     |
| --------------------------------- | ------------------------------------------------- | -------------------- | ----------------------------------------- |
| `options`                         | `readonly SelectItem[]`                           | —                    | Required. Options and groups.             |
| `label`                           | `ReactNode`                                       | —                    | Visible `<label for>`. Needs an `id`.     |
| `value`                           | `string`                                          | —                    | Controlled.                               |
| `defaultValue`                    | `string`                                          | —                    | Uncontrolled. Read once at mount.         |
| `onChange`                        | `(value: string) => void`                         | —                    | Reports a **value**, not an event.        |
| `placeholder`                     | `string`                                          | `"Select an option"` | Shown when nothing matches.               |
| `helperText`                      | `ReactNode`                                       | —                    | Announced via `aria-describedby`.         |
| `size`                            | `"sm" \| "md" \| "lg"`                            | `"md"`               | Shared ladder.                            |
| `variant`                         | `"ghost" \| "outline" \| "solid"`                 | `"outline"`          | Box emphasis.                             |
| `tone`                            | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"`          | Advisory intent.                          |
| `invalid`                         | `boolean`                                         | `false`              | Overrides `tone`; sets `aria-invalid`.    |
| `disabled`                        | `boolean`                                         | `false`              | Native `disabled`.                        |
| `required`                        | `boolean`                                         | `false`              | Hidden "Required" on the label.           |
| `fullWidth`                       | `boolean`                                         | `false`              |                                           |
| `closeOnSelect`                   | `boolean`                                         | `true`               |                                           |
| `closeOnOutsidePress`             | `boolean`                                         | `true`               |                                           |
| `typeahead`                       | `boolean`                                         | `true`               | See "typing commits, browsing does not".  |
| `typeaheadDelay`                  | `number`                                          | `1000`               | UI5's `_typingTimeoutID` default.         |
| `name`                            | `string`                                          | —                    | Emits a hidden input for form submission. |
| `startAdornment` / `endAdornment` | `ReactNode`                                       | —                    | Inside the trigger.                       |
| `className`                       | `string`                                          | —                    | Merged onto the **root**.                 |
| `ref`                             | `Ref<HTMLButtonElement>`                          | —                    | The trigger.                              |

**There is no `closeOnEscape` prop.** It is typed as `closeOnEscape?: never` so that passing it is a
type error rather than a silently ignored prop. A listbox that cannot be dismissed with Escape
strands a keyboard user inside it, and UI5 documents Escape as "Closes the drop-down without
changing the selection" with no opt-out.

Native `HTMLAttributes` are forwarded to the **trigger `<button>`**, not the root — see
`select.types.ts` for why that is the right boundary and why `onChange` is excluded from it.

## Reconciled design

| Decision              | UIReload                                   | MUI                                 | UI5                                  | Why                                                                                                                                                  |
| --------------------- | ------------------------------------------ | ----------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Options shape         | a `readonly SelectItem[]` prop             | `children` (`<MenuItem>`)           | `children` (`<ui5-option>`)          | One typed prop beats children here: MUI's `renderValue` and UI5's `OptionCustom` are both escape hatches, and neither is needed for a single-select. |
| Option name vs value  | `label` and `value`, both required         | `value` with `children` as the name | same collapse                        | UI5's `_applySelectionByValue` falls back to matching text content, so a value can silently change when someone rewords a label.                     |
| `onChange` signature  | `(value: string) => void`                  | `(event) => void`, `target.value`   | `ui5-change` `detail.selectedOption` | Neither reference event describes _which option_ was chosen without unpacking it.                                                                    |
| Trigger element       | a real `<button>`                          | a `div` with `role="combobox"`      | a custom element                     | The platform then gives Space/Enter activation for free. See "Space and Enter".                                                                      |
| Highlight vs selected | separate `data-active` and `aria-selected` | conflated                           | conflated                            | APG listbox: moving the highlight does not select. This is the component's reason to exist.                                                          |
| Popup behaviour       | composed from `Popover`                    | `Menu` + `Popover` + `Modal`        | `ResponsivePopover`                  | The positioning, portal and dismissal are not worth reimplementing.                                                                                  |
| Grouping              | `role="group"` + `aria-label`              | `MenuList` nesting                  | `<ui5-option-group>`                 | A nested listbox would make each group its own composite widget.                                                                                     |
| Empty value           | `data-empty`                               | —                                   | `_isNoValue`                         | "No selection" is a distinct state from `""`.                                                                                                        |

### Typing commits, browsing does not

This is the decision most worth arguing for, because it departs from native `<select>` behaviour.

The APG listbox pattern specifies that on a **closed** listbox, `Down Arrow` "opens the listbox if
it is not already displayed and moves visual focus to the first option" — it does **not** change the
selection. Native `<select>` elements do the opposite: they change the value and stay closed.

Honouring APG here has a consequence that has to be answered rather than ignored: if arrows open the
list, and opening the list does not commit anything, then **there is no arrow-key route to changing
the value without opening a popup.** Typeahead is that route. It is on by default, it commits, and
it never opens the list — which is exactly what browsers added it for.

So the contract is: **typing commits, browsing does not.** `typeahead={false}` is available and the
`Typeahead` story exists to show what that costs.

### Why roving focus and not `aria-activedescendant`

The listbox is in a portal. `aria-activedescendant` keeps DOM focus on the trigger and points at
the active option, which would mean an activedescendant reference crossing a document-position
boundary that assistive technology is not required to resolve — and the browser's own scrolling of
the active descendant does not work across it either. Moving real focus into the listbox works with
every assistive technology that implements the listbox pattern at all, and `useRovingFocus` already
does it for the composite widgets elsewhere in this library.

The one visible consequence is that the listbox needs exactly one tab stop, which is why the
"highlight nothing when nothing is selected" option was rejected (see `openList` in `select.tsx`).

### Space and Enter are deliberately not handled

The trigger is a real `<button>`, so the browser already activates it on both keys and fires a
`click`. Handling them in `keydown` as well means every press opens the list and then immediately
closes it — the keydown handler runs first, and the `click` that follows toggles the now-open list
shut. This was a real bug, caught by the `opens with Space and Enter` test.

### What is composed, and what is not

`Popover` is composed for positioning, the portal, the outside-press dismissal and the
anchor-out-of-view dismissal. What `Select` keeps to itself is the keyboard contract, the selection
model and the roles, because those are the component. `closeOnEscape` is passed `false` because the
listbox handles Escape itself in order to restore its highlight first.

Unlike `Dialog`, this composition _is_ appropriate: a dropdown and a popover are the same widget
with different content and a keyboard contract the caller owns.

## Keyboard

| Key                           | Behaviour                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `Space` / `Enter`             | Opens the list, natively, via the button's own activation.                                         |
| `ArrowDown` / `ArrowUp`       | Closed: opens the list and moves the highlight one step. Open: moves the highlight. Never commits. |
| `Home` / `End`                | Moves the highlight to the first / last enabled option. Never commits.                             |
| `Enter` / `Space` (list open) | Commits the highlighted option, closes, and returns focus to the trigger.                          |
| `Escape`                      | Closes without committing and restores the highlight to the selection.                             |
| `Tab`                         | Closes. Focus is **not** prevented, so it continues to the next control.                           |
| `F4`, `Alt`+`ArrowUp`/`Down`  | Toggles the list. UI5's two documented spellings.                                                  |
| A printable character         | Typeahead: selects the first match without opening.                                                |

Not implemented, and recorded rather than approximated: `PageUp`/`PageDown` (UI5 has neither),
`Alt`+`Home`/`End`, and any `multiple` selection.

## CSS contract

```
.uir-select                  the root; data-size, data-variant, data-tone, data-empty
.uir-select__label           <label for>; carries the id that aria-labelledby points at
.uir-select__trigger         the <button>; aria-haspopup="listbox", aria-expanded
.uir-select__value           the selected label or the placeholder; absorbs the ellipsis
.uir-select__chevron         two borders meeting at a point, rotated when open
.uir-select__adornment       --start / --end
.uir-select__helper          the announced description
.uir-select__popover         the composed Popover surface; padding removed
.uir-select__listbox         role="listbox"; the scrollport
.uir-select__group           role="group"
.uir-select__group-label     aria-hidden; the group's name comes from the role
.uir-select__option          role="option"; data-active, data-selected, data-disabled
.uir-select__option-label    the label plus the optional detail
```

State attributes on the root: `data-size`, `data-variant`, `data-tone`, `data-invalid`,
`data-disabled`, `data-required`, `data-full-width`, `data-empty`.

Component-local tokens: `--uir-select-height`, `--uir-select-border`, `--uir-select-border-hover`,
`--uir-select-ring`, `--uir-select-helper`, `--uir-select-fill`, `--uir-select-active`,
`--uir-select-active-border`, `--uir-select-hover`.

**`--uir-select-active`, `--uir-select-active-border` and `--uir-select-hover` are declared on the
root, not on the listbox, and that is load-bearing.** The listbox is inside a portal, and CSS
custom properties do not cross a portal boundary — a token declared on `.uir-select__listbox` would
be fine, but one that the root owns has to be _inherited through_ a portal to reach it, which it is
not. Declaring them on the root and letting them fall back to the global values is what keeps the
listbox styled at all. Same constraint as `Dialog` and `Popover`.

The highlight is drawn with `inset box-shadow`, not a change of padding, because a padding change
would shift every option below it as the highlight moves and arrowing down a long list would visibly
jitter.

## Accessibility

- The trigger is a `<button>` with `aria-haspopup="listbox"` and real `aria-expanded`, so "button,
  collapsed" is genuine state rather than decoration.
- `aria-labelledby` points at the visible label rather than `aria-label`, so the two cannot drift.
  The label also carries a real `for`, so clicking it focuses the trigger.
- The listbox is a real `role="listbox"` with `aria-labelledby` to the same label, and every option
  carries `aria-selected`. Groups are `role="group"` with a name, not nested listboxes.
- Roving focus: exactly one option is tabbable, and it is the highlighted one. `data-active` is the
  highlight, `aria-selected` is the selection, and the stylesheet draws them differently — plus a
  `✓` on the selected one, because colour alone would make the two indistinguishable.
- A disabled option is `aria-disabled` and is skipped by click, arrows, `Home`/`End` **and
  typeahead**. It is not `pointer-events: none`, so it stays readable and the cursor is the only
  affordance given up.
- `required` renders a visually hidden "Required" next to an `aria-hidden` asterisk. MUI draws the
  marker from a CSS `::after`, which no screen reader can see.
- `helperText` is wired to `aria-describedby`, so the explanation is announced and not merely drawn.
- Focus moves into the listbox on open, to the first enabled option if nothing is selected, and back
  to the trigger on commit.
- `Tab` closes and is not prevented. Trapping it inside a dropdown is what makes a list of forty
  options impossible to leave.
- `forced-colors` is handled: the highlight uses `Highlight`/`HighlightText` with
  `forced-color-adjust: none`, and the `✓` is a glyph so it survives untouched.
- Two development warnings: a `label` with no `id` to bind to, and no accessible name at all.

## Gaps

- **`multiple` (MUI).** Real and commonly needed. It would change `value` from `string` to
  `string[]`, which is a breaking change to the public types, so it belongs in its own component
  rather than a prop. `closeOnSelect={false}` is provided because it is the one piece of the
  multi-select contract that composes.
- **`renderValue` (MUI) and `OptionCustom` (UI5).** Both allow arbitrary React in the trigger and
  in an option. Here, `label` names the option and `children` decorates it, with `textValue` for
  the announcement. A component whose whole option content is arbitrary React needs its own item
  component with its own announcement contract.
- **`IconComponent` (MUI).** Use `endAdornment`. The chevron is a CSS construction rather than an
  importable icon, because an icon package would be a runtime dependency.
- **The group's option count.** UI5 announces `"3 options"` per group via `_groupCountText`. Not
  reproduced: it is verbose and the count is available from the group label if a consumer needs it.
- **Responsive placement.** UI5's `ResponsivePopover` moves the dropdown to a left/right sheet on a
  phone. `Popover` here flips and clamps within the viewport; a bottom sheet is a different
  component.
- **Entry and exit animation.** Deliberately absent, as elsewhere.
