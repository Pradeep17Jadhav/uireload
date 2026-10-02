# Checkbox

A binary value that is part of a form the user submits later, as distinct from `Switch`, whose
change takes effect immediately.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop              | Type                                              | Default     | Notes                                 |
| ----------------- | ------------------------------------------------- | ----------- | ------------------------------------- |
| `label`           | `ReactNode`                                       | —           | Visible `<label for>`. Needs an `id`. |
| `checked`         | `boolean`                                         | —           | Controlled.                           |
| `defaultChecked`  | `boolean`                                         | `false`     | Uncontrolled, read at mount only.     |
| `onCheckedChange` | `(checked: boolean) => void`                      | —           | Reports the new state, not an event.  |
| `indeterminate`   | `boolean`                                         | `false`     | Never reachable by interaction.       |
| `disabled`        | `boolean`                                         | `false`     | Native attribute.                     |
| `required`        | `boolean`                                         | `false`     | Hidden "Required" on the label.       |
| `tone`            | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | Checked state only.                   |
| `size`            | `"sm" \| "md" \| "lg"`                            | `"md"`      |                                       |
| `labelPosition`   | `"start" \| "end"`                                | `"end"`     | Logical, so it mirrors in RTL.        |
| `value` / `name`  | `string`                                          | —           | Form submission.                      |
| `helperText`      | `ReactNode`                                       | —           | Announced via `aria-describedby`.     |
| `className`       | `string`                                          | —           | Merged onto the root.                 |
| `ref`             | `Ref<HTMLInputElement>`                           | —           | The input.                            |

**There is no `readOnly` prop.** It is typed `readOnly?: never`, so passing it is a compile error
rather than a prop that is silently accepted. The reasoning is long and is repeated in
`checkbox.types.ts` and `switch.tsx`: `readonly` has no effect on a checkbox in the HTML spec, so
honouring it means refusing a toggle the browser has already performed. Three approaches were built
and measured, and all three end with the box rendering checked while announcing
`aria-checked="false"`. A consumer who needs to refuse a change controls `checked` and declines by
not updating it.

## The two decisions worth arguing for

### Indeterminate is a DOM property, not an attribute

`HTMLInputElement.indeterminate` has no attribute reflection — there is no `indeterminate=""`
content attribute — so it **cannot be expressed in JSX** and has to be set imperatively. This is the
one part of a checkbox that is not the platform's, and it is why the component exists rather than
being a styled `<input>`.

Three things follow:

1. A **stable** ref callback plus a layout effect, rather than an inline callback. An inline
   callback closes over `indeterminate` and changes identity every render, so React detaches and
   reattaches the node on every keystroke in the surrounding form.
2. `aria-checked="mixed"` is emitted **only** when indeterminate. For the two ordinary states the
   native checkedness already maps to `aria-checked`, and writing it by hand would create a second
   source of truth that can disagree with `checked`.
3. The documented ordering rule is honoured in the markup: checked and indeterminate together paint
   as _partially_ checked, and unchecked wins over indeterminate. `data-checked` is suppressed while
   `data-indeterminate` is set, so "partially checked" never renders as fully checked.

Because it is a prop rather than a click result, a parent checkbox can derive "some of my children
are checked" — which is the reason it exists and the reason no interaction can express it. See the
`ParentAndChildren` story.

### The off state is tone-neutral

`--uir-checkbox-border` and `--uir-checkbox-fill` resolve to the same value in all four tones; tone
is carried by the **checked** state. A red box on a checkbox the user has _not_ ticked paints a
warning where there is nothing to warn about.

The same shape appears in `switch.css`, and both are commented in place, because four tone blocks
with two identical pairs read as copy-paste omissions.

## Reconciled design

| Decision                  | Choice                            | Why                                                                                      |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| Underlying element        | one `<input type="checkbox">`     | One focusable element, native form participation, native Space, native `:checked`.       |
| `checked` + indeterminate | both, as properties               | A parent checkbox needs "some"; no click can express it.                                 |
| Indeterminate paint       | suppressed `data-checked`         | Checked-and-indeterminate must read as partially checked, not fully.                     |
| `aria-checked`            | `"mixed"` only when indeterminate | Otherwise the native checkedness is the single source of truth.                          |
| Keyboard                  | Space only                        | APG specifies Space. Enter toggling is what a `<div>` implementation has to add by hand. |
| Intent                    | `tone`, checked state only        | A large area of colour should not warn about something the user did not do.              |
| Tick                      | two borders, `currentColor`       | No icon to import, no request, and it inherits the forced-colours text colour.           |
| Emphasis                  | none — no `variant`               | The ladder describes how loud a _command_ is. A checkbox answers a question.             |
| `readOnly`                | **absent**, typed `never`         | A broken read-only state is worse than an absent one. See above.                         |
| `size`                    | shared three-tier ladder          | A settings list with a checkbox and a switch must agree on height.                       |

## Keyboard

| Key     | Behaviour                                                        |
| ------- | ---------------------------------------------------------------- |
| `Space` | Toggles. Native — nothing is reimplemented.                      |
| `Enter` | Nothing. See above.                                              |
| `Tab`   | Moves focus in and out. A disabled checkbox is skipped entirely. |

Clicking the label toggles, because it is a real `<label for>`.

## CSS contract

```
.uir-checkbox                  the root; data-size, data-tone, data-checked, data-indeterminate,
                              data-disabled, data-required, data-label-position
.uir-checkbox__input           the real input, stretched over the control and transparent
.uir-checkbox__box             the drawn box; carries the tick via ::after
.uir-checkbox__label           real <label for>; carries the id aria-labelledby points at
.uir-checkbox__helper          the announced description, on its own line
```

Component-local tokens: `--uir-checkbox-box`, `--uir-checkbox-tick`, `--uir-checkbox-border`,
`--uir-checkbox-fill`, `--uir-checkbox-on-fill`, `--uir-checkbox-ring`, `--uir-checkbox-hover`.

The box is `aria-hidden`: the input's own checkedness states the value, and announcing both would
say the same thing twice.

`data-label-position="start"` reorders the label with `order`, not with a second DOM shape, so the
markup and the accessible name are identical in both directions.

## Accessibility

- A real `<input type="checkbox">`, so role, name, state, form participation and keyboard come from
  the platform.
- One focusable element: the input covers the whole control, so there is no focusable box and
  clickable label that have to be kept in agreement.
- A real `<label for>` rather than a floating label. A floating label has to animate, and an
  animated label that shrinks into a border has its own contrast problem.
- `aria-checked="mixed"` when indeterminate, and nothing otherwise — see above.
- `required` renders a visually hidden "Required" next to an `aria-hidden` asterisk. A CSS-generated
  asterisk cannot be announced at all.
- `helperText` is wired to `aria-describedby`, so the explanation is announced and not merely drawn.
- Disabled uses `opacity` with `pointer-events` intact, so a tooltip can still explain why.
- `forced-colors` is handled: the fill switches to `Highlight` / `HighlightText`, and the tick is
  `currentColor` so it needs nothing.
- A development warning fires when there is no accessible name — a nameless checkbox announces as
  "checkbox, checked" and nothing more.

## Gaps

- **`readOnly`.** Deliberately absent and typed `never`. Recorded above and in `switch.tsx`.
- **A group container.** `ToggleButtonGroup` covers the "several related controls" case, and a
  `Fieldset` with a `legend` covers the form semantics. A dedicated `checkbox-group` would be a
  layout convenience, not a new role.
- **`displayOnly`.** Some designs offer a non-interactive presentation state. It is `disabled` with
  a different paint, and the difference is presentational, so it is left to CSS via
  `data-disabled`.
