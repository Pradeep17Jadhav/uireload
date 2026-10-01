# ToggleButton

A button with two states.

## Reference libraries

| Concern         | Source                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Pressed state   | `@ui5/webcomponents/dist/ToggleButton.d.ts` — `pressed: boolean`, `@default false` |
| Inheritance     | Same file: `class ToggleButton extends Button` — a toggle _is_ a button            |
| Prop surface    | `@mui/material/ToggleButton/ToggleButton.d.ts` — `ToggleButtonOwnProps`            |
| Group value     | Same file: `value: NonNullable<unknown>` (required), `selected?: boolean`          |
| Size / defaults | Same file: `size` defaults to the parent's when inside a group                     |

## Props

| Prop                                           | Type                         | Default     |
| ---------------------------------------------- | ---------------------------- | ----------- |
| `pressed`                                      | `boolean`                    | —           | Controlled when defined.     |
| `defaultPressed`                               | `boolean`                    | `false`     |
| `onPressedChange`                              | `(pressed: boolean) => void` | —           |
| `role`                                         | `"button" \| "radio"`        | `"button"`  | Set by the group. See below. |
| `value`                                        | `string`                     | —           | Required inside a group.     |
| `variant`/`tone`/`size`/`disabled`/`startIcon` | as `Button`                  | as `Button` |

## Reconciled design

| Decision          | UIReload                                      | MUI                  | UI5                  | Why                                                                                                 |
| ----------------- | --------------------------------------------- | -------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| State prop name   | `pressed`                                     | `selected`           | `pressed`            | Matches the ARIA state. "Selected" is a _group_ concept, owned by `ToggleButtonGroup`.              |
| ARIA attribute    | `aria-pressed` (or `aria-checked` as a radio) | `aria-pressed`       | none declared        | The state must be exposed; neither library states the attribute in its `.d.ts`.                     |
| `variant` support | yes                                           | no                   | via `design`         | Added for consistency. A toggle without a `variant` would be the odd one out in a component family. |
| Composition       | wraps `Button`                                | extends `ButtonBase` | extends `ui5-button` | Both references treat it as a button; so does this.                                                 |

### `role` and why it exists

`aria-pressed` is correct for a standalone toggle. Inside a **single-selection**
`ToggleButtonGroup` the correct expression is `role="radio"` with `aria-checked`,
because the APG radio-group pattern governs "choose exactly one". The group sets
`role`, and this component emits exactly one of the two attributes — never both,
which would be an ARIA conflict.

## Keyboard

| Key     | Behaviour                                                                    |
| ------- | ---------------------------------------------------------------------------- |
| `Tab`   | Moves focus. Inside a group, only the selected member is reachable.          |
| `Space` | Toggles.                                                                     |
| `Enter` | Toggles.                                                                     |
| Arrows  | Only inside a single-selection group, where they move focus _and_ selection. |

## CSS contract

```
.uir-toggle-button    root; also carries .uir-button
```

State attributes: `data-pressed`, plus everything `Button` renders.

The pressed appearance reuses the variant's **active** colours, so a pressed toggle
needs no palette of its own. Under `forced-colors: active` the border changes colour
and `forced-color-adjust: none` keeps the state visible, because colour alone cannot
be the signal.

## Accessibility

- `aria-pressed` mirrors the visual state; the two cannot disagree because one is
  derived from the other.
- A consumer can veto the toggle with `preventDefault()` on their own `onClick`,
  because their handler runs first.
- The `pressed` prop is fully controlled or fully uncontrolled. Inside a group the
  group's selection wins, because a member's local state and the group's selection
  cannot both be authoritative.
