# Switch

A binary setting that takes effect immediately, as distinct from a checkbox, which is part
of a form the user submits later.

## Reference libraries

| Concern               | Source                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition    | `@mui/material/Switch/Switch.d.ts` — `SwitchProps` (`color`, `size`, `icon`, `checkedIcon`, `checked`)                                                        |
| Base props / slots    | `@mui/material/internal/SwitchBase.d.ts` — `SwitchBaseProps` (`checked`, `defaultChecked`, `readOnly`, `required`, `id`, `name`, `value`, `onChange`, `edge`) |
| Class-name contract   | `@mui/material/internal/switchBaseClasses.d.ts` — `root`, `input`, `thumb`, `track`, `switchBase`, `focusVisible`, `checked`                                  |
| Behaviour, parts      | `@ui5/webcomponents/dist/Switch.d.ts` — `checked`, `readonly`, `required`, `textOn`/`textOff`; `@csspart slider` / `text-on` / `text-off` / `handle`          |
| DOM structure         | `@ui5/webcomponents/dist/SwitchTemplate.js` — `role="switch"` on the root, the track/handle nesting, and the separate hidden `<input type="checkbox">`        |
| Design enum           | `@ui5/webcomponents/dist/types/SwitchDesign.d.ts` — `Textual`, `Graphical`                                                                                    |
| Aria-readonly pairing | `effectiveAriaReadonly` and `effectiveAriaDisabled` getters, `Switch.d.ts`                                                                                    |
| Duplicate-text rule   | `_textAriaHidden` getter, `Switch.d.ts` — on/off texts that match the role announcement are `aria-hidden`                                                     |
| Size tokens           | `--_ui5_switch_track_width` / `_height`, `--_ui5_switch_handle_width` / `_height` in `@ui5/webcomponents/dist/css/themes/Switch.css`                          |
| Keyboard contract     | WAI-ARIA APG Switch pattern; native `<input type="checkbox">` provides it                                                                                     |

Versions read from `../referenceUILibraries/package.json`: `@mui/material` 9.4.0,
`@ui5/webcomponents` 2.27.2.

## Props

| Prop              | Type                                              | Default     | Notes                                    |
| ----------------- | ------------------------------------------------- | ----------- | ---------------------------------------- |
| `label`           | `ReactNode`                                       | —           | Visible `<label for>`. Needs an `id`.    |
| `checked`         | `boolean`                                         | —           | Controlled state.                        |
| `defaultChecked`  | `boolean`                                         | `false`     | Uncontrolled initial state.              |
| `onCheckedChange` | `(checked: boolean) => void`                      | —           | Every change.                            |
| `disabled`        | `boolean`                                         | `false`     | Native `disabled`.                       |
| `readOnly`        | `never`                                           | �           | Not implemented. See the gap below.      |
| `required`        | `boolean`                                         | `false`     | Native `required` + a hidden "Required". |
| `size`            | `"sm" \| "md" \| "lg"`                            | `"md"`      | `docs/foundations.md` §2.                |
| `tone`            | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | The colour of the track when on.         |
| `labelPosition`   | `"end" \| "start"`                                | `"end"`     | Logical, so it mirrors in RTL.           |
| `ref`             | `Ref<HTMLInputElement>`                           | —           | The `<input>`.                           |
| `className`       | `string`                                          | —           | Always merged onto the **root**.         |

Native `InputHTMLAttributes` are forwarded to the `<input>`, so `name`, `form`, `value` and
every `on*` handler behave as on a bare checkbox.

**There is no `variant`.** See below.

## Reconciled design

| Decision           | UIReload                        | MUI                         | UI5                                  | Why                                                                                   |
| ------------------ | ------------------------------- | --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| Role               | `role="switch"`                 | `role="switch"`             | `role="switch"` on a `<div>`         | The APG switch pattern, so a screen-reader user can tell a setting from a form value. |
| Underlying element | one `<input type="checkbox">`   | `SwitchBase` + `ButtonBase` | `<div role="switch">` + hidden input | One focusable element, native form participation, native Space, native `:checked`.    |
| Intent             | `tone`                          | `color`                     | `design`                             | Reuses the library's tone set. `design` conflates emphasis with intent.               |
| Emphasis           | **none**                        | none                        | `design: Textual \| Graphical`       | The ladder describes how loud a _command_ is. A switch is a setting.                  |
| Read-only          | **absent**                      | `readOnly`                  | `readonly` + `effectiveAriaReadonly` | A checkbox ignores `readonly` natively, so it needs behaviour no DOM write survives.  |
| Label              | real `<label for>`              | `FormControlLabel`          | `accessibleNameRef`                  | A real label is visible, clickable and needs no JavaScript.                           |
| Required marker    | hidden word + `aria-hidden` `*` | the same on `Textbox`       | `required` attribute                 | A CSS-generated asterisk cannot be announced.                                         |
| Ref                | `ref`                           | `inputRef`                  | `getInputDOMRefSync`                 | There is no proxy element to disambiguate from.                                       |

### The one real divergence: Enter does not toggle

UI5's JSDoc says "The state can be changed by pressing the Space and Enter keys". That is
because `ui5-switch` is a `<div>` with its own `keydown` handler, so it has to implement by
hand what a real checkbox gets from the platform. APG's switch pattern specifies **Space**,
and Enter is not part of it. A native `<input type="checkbox">` toggles on Space and ignores
Enter, so that is the behaviour here, and it is the one MUI gets as well.

### Rejected, with reasons

- **`variant`.** The shared ladder (`ghost` / `outline` / `solid`) describes how loud a
  command is. A switch has no commands, and a "ghost" switch would be invisible by
  definition. `tone` is the only visual axis.
- **`icon` / `checkedIcon` (MUI), `design: Graphical` (UI5).** A check or cross inside the
  handle duplicates what `aria-checked` already announces. UI5 replaces the on/off _texts_
  with icons in graphical mode, which is the same substitution by another route.
- **`textOn` / `textOff` (UI5).** Fiori's own JSDoc warns that anything longer than three
  characters is truncated, and that the component "would not automatically stretch to fit the
  whole text width". A truncated state label is worse than no state label. UI5 also computes
  `_textAriaHidden` to hide the texts from assistive technology when they duplicate the role's
  own announcement — a hint that they were never meant to be the accessible answer. The
  consumer's own `label` says what the setting is for; `aria-checked` says which way it is.
- **`edge` (MUI).** A negative-margin affordance for aligning a ripple inside a Material
  `IconButton`. There are no ripples here.
- **`tooltip` (UI5).** UI5's own JSDoc says an external label reference "should always be the
  preferred option to provide context to the ui5-switch component over a tooltip".
- **`disableRipple`, `disableFocusRipple`.** Material machinery; a focus ring is never
  optional in this library.
- **`classes` / `slots` / `slotProps`.** Rejected architecture (`AGENTS.md` §4). State is
  `data-*`; the four parts are fixed class names.

## Keyboard

| Key     | Behaviour                                                      |
| ------- | -------------------------------------------------------------- |
| `Tab`   | Moves focus in and out. A disabled switch is skipped entirely. |
| `Space` | Toggles. This is the APG switch key.                           |
| `Enter` | Does nothing. Deliberate; see the divergence above.            |

A read-only switch is focusable and its state is readable — see the gap below for why that state
cannot be offered here.

### Two contracts that differ from the rest of the library

**1. `preventDefault()` on `onChange` does not veto the switch.**

Every other component composes its handler with `composeHandlers`: the consumer runs first, and
`preventDefault()` skips our behaviour. `Switch` honours the _ordering_ but not the _veto_, and
the reason is a measured React behaviour rather than a preference.

React snapshots a controlled checkbox's value when it dispatches `change` and restores that
snapshot at the end of the event. In React 19 that restore runs from a **scheduled callback**, so
it lands after the handler, after effects, and after any synchronous correction. Three
implementations were built and measured, and all three ended with the switch visually checked
while announcing `aria-checked="false"`:

| Approach                                               | Result                                                 |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `event.target.checked = checked` in the change handler | Written, then discarded by React's restore.            |
| The same write from a `useEffect`                      | `false` inside the effect, `true` a microtask later.   |
| Uncontrolled input + `preventDefault()`                | Races the platform's activation behaviour; unreliable. |

A veto that silently fails is worse than no veto: the switch would look one way and be announced
another. So a consumer who needs to refuse a change **controls `checked` and declines by not
updating it** — the standard React contract, asserted by _"refuses a change by staying
controlled"_. The `ControlledAndDeclined` story is the pattern.

**2. There is no `readOnly` prop.**

UI5 has one (`readonly`, since 2.21.0) and pairs it with `effectiveAriaReadonly`, which is
exactly the pairing this component would need. It is absent here because `readonly` has no effect
on a checkbox in the HTML spec, so implementing it means _refusing a toggle the browser has already
performed_ — the same restore problem as above, with no way out.

A fourth approach does work: recreating the `<input>` with a `key`. It was built, and it was
rejected because it hands the consumer a different DOM node on every refused toggle, which breaks
node identity for their refs and their measurement. A read-only state that lies is worse than no
read-only state.

Use `disabled`, or the controlled-and-declined pattern above. Recorded here and in
`switch.tsx`; revisit if React's controlled-input behaviour changes.

## CSS contract

```
.uir-switch                  root
.uir-switch__input           the real checkbox, transparent, covering the control
.uir-switch__track           aria-hidden, carries the on/off colour
.uir-switch__handle          aria-hidden, moved by a transform
.uir-switch__label           <label for>
```

State attributes on the root: `data-size`, `data-tone`, `data-checked`, `data-disabled`,
`data-required`, `data-label-position`.

Component-local tokens: `--uir-switch-track-width`, `--uir-switch-track-height`,
`--uir-switch-handle-size`, `--uir-switch-track`, `--uir-switch-track-border`,
`--uir-switch-track-checked`, `--uir-switch-track-border-checked`,
`--uir-switch-track-active`, `--uir-switch-track-checked-active`.

### The invisible input

The native checkbox carries focus, form participation, the Space key and `:checked`, so it
cannot be `display: none` — that would remove it from the tab order and from form
submission. It is `opacity: 0` and absolutely positioned over the root instead, so the
visible control _is_ the element being clicked. Without that, a click on the far end of the
track would miss the input entirely, and a consumer's `user.click(track)` would silently do
nothing.

### The focus ring

Drawn by the input's own `:focus-visible` outline. An `outline` still traces a transparent
element's box, and the input's box is the root's box, so the ring appears around the whole
control. No wrapper ring, and no second outline underneath.

### The handle's travel

`translateX` rather than a positional property, so the move is composited and reflows
nothing. The distance is computed rather than written — `track width - handle size - inset` —
so a change to any of the three updates it automatically. A handle that does not reach the
end of its track is the specific failure this prevents. One `[dir="rtl"]` rule negates the
whole `calc`; the handle does not move in its own coordinate system, it moves in the track's.

## Accessibility

- `role="switch"` with `aria-checked` is the APG pattern, and the entire reason this is not
  a checkbox. `aria-checked` is emitted explicitly rather than left to the native `checked`,
  so the announcement cannot drift from the rendered state.
- The track and handle are `aria-hidden`. The position is announced once, by the control.
- A switch with no name is announced as "switch, on" and nothing more, so a missing name
  logs a development warning. Same rule as `Textbox` and `ToggleButtonGroup`.
- The label is a real `<label for>`, so it is also a click target. Clicking the label
  toggles the switch, which is the native behaviour and the reason a real label beats
  `aria-label` only.
- Disabled uses `opacity` with `pointer-events` intact, so a tooltip can still explain why.
- `forced-colors` is handled explicitly, including `forced-color-adjust: none` on the
  handle — without it the OS overrides the handle's background and the "on" state becomes a
  filled track with no visible knob in it.

## Gaps

- **Grouped switches with a shared label.** A `fieldset` + `legend` works today with the
  consumer's own markup, as the `SettingsGroup` story shows. A `SwitchGroup` component is
  not written.
- **Positioning the label in the middle** (`labelPosition="both"`). Not in either library.
