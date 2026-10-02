# Textbox

A single-line or multi-line text field with a visible label, an announced description and
a validation state.

## Reference libraries

| Concern                 | Source                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition      | `@mui/material/TextField/TextField.d.ts` — `BaseTextFieldProps`, `TextFieldVariants`                                                                                             |
| Control-level props     | `@mui/material/InputBase/InputBase.d.ts` — `InputBaseProps` (`startAdornment`, `endAdornment`, `readOnly`, `inputRef`, `margin`)                                                 |
| Class-name contract     | `@mui/material/TextField/textFieldClasses.d.ts` — `TextFieldClasses` (a single `root` slot; the parts here come from the `InputBase` tree)                                       |
| Behaviour, parts, slots | `@ui5/webcomponents/dist/Input.d.ts` — `valueState`, `required`, `readonly`, `maxlength`, `showClearIcon`, `valueStateMessage`, `icon`; `@csspart root` / `input` / `clear-icon` |
| DOM structure           | `@ui5/webcomponents/dist/InputTemplate.js` — the `root` > content > `input` nesting, and the `focused` attribute the focus ring keys off                                         |
| Input type enum         | `@ui5/webcomponents/dist/types/InputType.d.ts` — `Text`, `Email`, `Number`, `Password`, `Tel`, `URL`, `Search`                                                                   |
| Value-state enum        | `@ui5/webcomponents-base/dist/types/ValueState.d.ts` — `None`, `Positive`, `Critical`, `Negative`, `Information`                                                                 |
| Focus ring model        | `@ui5/webcomponents/dist/css/themes/Input.css` — `.ui5-input-focusable-element:after` drawn from `:host([focused])`                                                              |
| Height / padding tokens | `--_ui5_input_base_height` / `--_ui5_input_base_padding` in `@ui5/webcomponents/dist/generated/themes/sap_horizon/parameters-bundle.css.js`                                      |
| Label association       | `@ui5/webcomponents-base/dist/util/AccessibilityTextsHelper.js` — `getAssociatedLabelForTexts`, which reads a real `<label for>`                                                 |
| Pattern                 | WAI-ARIA APG Textbox; the native `<label for>` and `<input>` supply role, name and validation                                                                                    |

Versions read from `../referenceUILibraries/package.json`: `@mui/material` 9.4.0,
`@ui5/webcomponents` 2.27.2.

## Props

| Prop             | Type                                              | Default     | Notes                                                      |
| ---------------- | ------------------------------------------------- | ----------- | ---------------------------------------------------------- |
| `label`          | `ReactNode`                                       | —           | Visible `<label for>`. Needs an `id` to do its job.        |
| `helperText`     | `ReactNode`                                       | —           | Announced via `aria-describedby`. Needs an `id`.           |
| `invalid`        | `boolean`                                         | `false`     | `aria-invalid` + the `danger` role set, whatever the tone. |
| `size`           | `"sm" \| "md" \| "lg"`                            | `"md"`      | `docs/foundations.md` §2.                                  |
| `variant`        | `"ghost" \| "outline" \| "solid"`                 | `"outline"` | The shared ladder, read as a field.                        |
| `tone`           | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | Advisory intent. `invalid` overrides it.                   |
| `disabled`       | `boolean`                                         | `false`     | Native `disabled`: out of the tab order, not submitted.    |
| `readOnly`       | `boolean`                                         | `false`     | Native `readonly`: still focusable, still submitted.       |
| `required`       | `boolean`                                         | `false`     | Native `required` + a hidden "Required" in the label.      |
| `fullWidth`      | `boolean`                                         | `false`     | The only layout-affecting prop, as on every control.       |
| `multiline`      | `boolean`                                         | `false`     | Renders a `<textarea>`; `type` is dropped.                 |
| `rows`           | `number`                                          | browser     | Textarea only.                                             |
| `startAdornment` | `ReactNode`                                       | —           | Decorative, `aria-hidden`.                                 |
| `endAdornment`   | `ReactNode`                                       | —           | Decorative, `aria-hidden`.                                 |
| `value`          | `string`                                          | —           | Controlled value.                                          |
| `defaultValue`   | `string`                                          | `""`        | Uncontrolled initial value.                                |
| `onValueChange`  | `(value: string) => void`                         | —           | Every keystroke.                                           |
| `type`           | `TextboxType`                                     | `"text"`    | Seven UI5 values, in native spelling.                      |
| `ref`            | `Ref<TextboxElement>`                             | —           | The `<input>`, or the `<textarea>` when `multiline`.       |
| `className`      | `string`                                          | —           | Always merged onto the **root**, never the input.          |

Everything else in `InputHTMLAttributes` is forwarded to the text entry element, so
`name`, `form`, `placeholder`, `autoComplete`, `maxLength`, `inputMode`, `enterKeyHint` and
every `on*` handler behave exactly as on a bare `<input>`.

### Where a `data-*` attribute lands

Every attribute UIReload does not own is forwarded to the text entry element, so a
`data-testid`, a `data-*` styling hook or an `aria-*` lands on the `<input>` rather than
on the wrapper. That is deliberate: the field is the element a consumer queries, labels,
serialises and wires to a form library, and putting its test id on a div would mean every
consumer writes a descendant selector to reach it.

The consequence, worth knowing: the wrapper is reachable only through its own class
(`.uir-textbox`), which is also how consumer CSS reaches it. `className` and `style` are
the documented exception, and they always land on the root.

## Reconciled design

| Decision        | UIReload                         | MUI                             | UI5                               | Why                                                                                       |
| --------------- | -------------------------------- | ------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| Emphasis axis   | shared `ghost`/`outline`/`solid` | `standard`/`filled`/`outlined`  | one design (`--_ui5_input_*`)     | Keeps one ladder across the family; a field and a button cannot disagree about `outline`. |
| Validation      | `invalid` boolean                | `error` boolean                 | folded into `valueState`          | Validation and intent are separate decisions. Named for `aria-invalid` and `:invalid`.    |
| Advisory state  | `tone`                           | `color`                         | `valueState`                      | Reuses the library's tone set rather than inventing a second vocabulary.                  |
| `invalid` wins  | overrides `tone`                 | `error` overrides `color`       | `Negative` overrides `valueState` | A green field above a red message is worse than no colour.                                |
| Label           | real `<label for>`               | floating `InputLabel`           | real `<label for>`, per           | A floating label is Material machinery. `getAssociatedLabelForTexts` shows UI5 uses a     |
|                 |                                  |                                 | `AccessibilityTextsHelper`        | plain label, and a real one is clickable and needs no JavaScript.                         |
| Description     | `helperText` + automatic wiring  | `helperText` + `FormHelperText` | `valueStateMessage` slot          | Auto-wired, because an unannounced message is the usual way this goes wrong.              |
| Required marker | hidden "Required" word + `*`     | CSS `*` from `InputLabel`       | `required` attribute              | A CSS asterisk tells a screen reader nothing (`docs/foundations.md` §8).                  |
| Native `type`   | narrowed to seven values         | pass-through `string`           | `InputType` enum, seven values    | A typo becomes a compile error, as `ButtonType` already does.                             |
| Ref target      | the `<input>`/`<textarea>`       | `inputRef`                      | `getInputDOMRefSync`              | The element with focus is the thing worth a ref. `ref` rather than `inputRef` because the |
|                 |                                  |                                 |                                   | component is not an `InputBase` wrapper.                                                  |

### Rejected, with reasons

- **`inputRef` in addition to `ref`.** Two ways to reach the same node is two ways to
  disagree. The component is not a wrapper around somebody else's input, so the ordinary
  `ref` is the whole contract.
- **Floating label.** MUI's `InputLabel` shrinks into the border and only then does the
  empty field show a placeholder. It is a Material behaviour with its own animation and
  its own contrast problem, and `ui5-input` does not do it.
- **`FormControl` context.** MUI threads `error`, `disabled`, `size` and `margin` down
  through React context from a `FormControl` wrapper. This library has no provider
  (`docs/roadmap.md`), and a context is a runtime cost for something two props do.
- **`margin: 'dense' | 'none'`.** Density here is `[data-uir-density]` in
  `src/theme/tokens.css`, applied to a subtree, not a per-field prop.
- **`showSuggestions` / `suggestionItems` (UI5) / `select` (MUI).** A combobox is the
  APG `combobox` pattern, not a textbox. It needs a listbox, typeahead and a popover, and
  it is its own component. Recorded as a gap.
- **`showClearIcon` (UI5).** A clear control is a button, and this library has `Button`.
  Reproducing it here would mean a second button implementation inside a field.
- **`accessibleName` / `accessibleNameRef` (UI5).** A real `<label for>` is strictly
  better: it is visible, clickable, and needs no JavaScript. `aria-label` and
  `aria-labelledby` are forwarded natively for the cases where a visible label is wrong.
- **`minRows` / `maxRows` / `TextareaAutosize` (MUI).** Auto-sizing a textarea is a
  layout algorithm with its own edge cases, not a prop. Use `rows` plus the browser's own
  resize grip, which this component keeps.
- **`aria-errormessage`.** A better fit for a validation message than
  `aria-describedby`, and it is not wired here: it needs the error text to be a sibling
  _of the field_ rather than a description, and its support is recent enough that the
  description is the safer default. Recorded as a gap.
- **`date`, `time`, `datetime-local`, `month`, `week`, `color`, `range`, `file`.** Not
  text entry, and not reachable through a narrowed `type`. A consumer who needs one today
  renders a native `<input>` and can borrow `.uir-textbox__control` for the box. Recorded
  as a gap.
- **Auto-generated `id`.** React's `useId` emits `:` (or `«»`) in its identifiers, either
  of which breaks `document.querySelector("#" + id)` in consumer code. An explicit `id` is
  required, and a development warning says so. This is the trade MUI makes; its `id`
  JSDoc says "use this prop to make `label` and `helperText` accessible for screen
  readers".

## Keyboard

Native `<input>`/`<textarea>` behaviour; nothing is reimplemented. MUI's `Escape` handling
comes from its `useAutocomplete`; UI5's from its suggestion list, and neither applies to a
plain text field.

| Key               | Behaviour                                                     |
| ----------------- | ------------------------------------------------------------- |
| `Tab`             | Moves focus in and out. A disabled field is skipped entirely. |
| Any printable key | Inserts at the caret. Native IME composition is preserved.    |
| `Home` / `End`    | Start / end of the value.                                     |
| Arrow keys        | Move the caret.                                               |
| `Enter`           | Submits the form only inside a `<form>`.                      |

## CSS contract

```
.uir-textbox                            root
.uir-textbox__label                     <label for>
.uir-textbox__control                   the bordered box
.uir-textbox__input                     the native input / textarea
.uir-textbox__adornment--start          decorative, aria-hidden
.uir-textbox__adornment--end            decorative, aria-hidden
.uir-textbox__helper                    description, carries the announced id
```

State attributes on the root: `data-size`, `data-variant`, `data-tone`, `data-invalid`,
`data-disabled`, `data-readonly`, `data-full-width`, `data-multiline`.

Component-local tokens, per `docs/foundations.md` §11 step 7 (only this component uses
them): `--uir-textbox-height`, `--uir-textbox-border`, `--uir-textbox-border-hover`,
`--uir-textbox-ring`, `--uir-textbox-helper`, `--uir-textbox-fill`.

Every other dimension comes from `--uir-control-*`. There are no hardcoded sizes in
`textbox.css`.

### The focus ring

Drawn by the `<input>` with `:focus-visible` and a negative `outline-offset` that clears
the border, so it lands immediately inside the control rather than floating outside it.

Three alternatives, all rejected, and why:

- **A ring on the wrapper via `:focus-within`**, which is what UI5 does (a `::after`
  pseudo-element keyed off a `focused` attribute set from `focusin`/`focusout`). It fires
  on mouse click too, which `docs/accessibility.md` rule 4 rules out, and it is a second
  ring: the base layer's `input:focus-visible` outline still fires underneath it.
- **Suppressing the input's outline.** Removing a focus outline is an accessibility
  failure and is out of scope for this library.
- **Leaving the base ring at `+2px`.** It sits 3px outside the control, and with an
  adornment present it hugs the text entry area while the border and the adornment sit
  outside it.

The outcome is keyboard-only, on the element that actually has focus, with nothing removed.

## Accessibility

- Renders a real `<input>`/`<textarea>`, so form participation, constraint validation,
  focus order, IME composition, autofill and the browser's own password manager all work
  without this component implementing them.
- A visible `label` is a real `<label for>`, so it is also a click target for the field.
  Without an `id` it would render perfectly and announce nothing, so that combination
  logs a development warning.
- `helperText` is wired to `aria-describedby` automatically, and is therefore announced
  rather than merely present. A consumer's own `aria-describedby` wins outright instead of
  being merged, because interleaving two independently authored description lists is a
  guess.
- `invalid` produces both `data-invalid` (for CSS) and `aria-invalid` (for assistive
  technology), and `helperText` supplies the text. Colour is never the only signal.
- `required` adds a visually hidden "Required" from the i18n catalog inside the label, with
  the asterisk marked `aria-hidden`, so the word is announced and the symbol is not.
- Adornments are `aria-hidden`. An icon beside a field must not become part of its
  accessible name, and must not add a tab stop; anything interactive belongs after the
  field, as a sibling.
- `disabled` uses `opacity` and leaves `pointer-events` intact, so a tooltip can still
  explain why the field is disabled. `readOnly` deliberately does _not_ dim: the value is
  still meaningful, still submitted, and still read by a screen reader.
- Placeholder text sets `opacity: 1`. The browser default of 0.54 silently drops it below
  the contrast `tests/contrast.test.ts` measures, and a placeholder is text, so SC 1.4.3
  applies to it.
- `forced-colors` is handled explicitly, because a field drawn with only a transparent
  background stops being distinguishable from the page when the OS replaces the palette.

## Gaps

Recorded rather than worked around, per `AGENTS.md` section 7.

- **Combobox / autocomplete.** Not implemented. APG treats it as a separate pattern with
  its own listbox, and it is the natural consumer of the `popover` component.
- **Clear button.** No `showClearIcon` equivalent; compose one with `Button` and
  `endAdornment` is not possible because adornments are `aria-hidden` by design, so put it
  after the field as a sibling.
- **`date` and friends.** See the rejected list.
- **`aria-errormessage`.** See the rejected list.
- **Auto-sizing textarea.** See the rejected list.
- **Character counter.** UI5 has no equivalent and MUI has no prop either; it would be a
  `helperText` the consumer renders from the value.
