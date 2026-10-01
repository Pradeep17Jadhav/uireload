# ToggleButtonGroup

Groups toggle buttons into one control.

## Reference libraries

| Concern            | Source                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Selection mode     | `@ui5/webcomponents/dist/SegmentedButton.d.ts` — `selectionMode`, `@default "Single"`          |
| Mode enum values   | `@ui5/webcomponents/dist/types/SegmentedButtonSelectionMode.d.ts` — `Single \| Multiple`       |
| Group event        | Same file: `"selection-change"` with `selectedItems: Array<ISegmentedButtonItem>`              |
| Arrow-key movement | Same file: `_itemNavigation: ItemNavigation`                                                   |
| Fit behaviour      | Same file: `itemsFitContent`, `@default false` (items are equal width when false)              |
| Accessible name    | Same file: `accessibleName`, `accessibleNameRef`, `accessibleDescription`                      |
| Prop surface       | `@mui/material/ToggleButtonGroup/ToggleButtonGroup.d.ts` — `exclusive`, `value`, `orientation` |
| **Role**           | **Neither library declares one.** See below.                                                   |

## Why this component exists

MUI's `ToggleButtonGroup` renders a `<div>` with **no role at all**:
`ToggleButtonGroupProps` extends `StandardProps<React.HTMLAttributes<HTMLDivElement>>`
and declares no `role`, and the implementation adds none. A screen reader announces
the members as a row of loose buttons with no indication that they are one control.

UI5 is closer — `ui5-segmented-button` uses `ItemNavigation`, so it _behaves_ like a
single widget — but its exposed surface does not promise a role either.

So UIReload picks the correct role per mode, because the two cases have different
right answers:

| Mode       | Group        | Member   | State          | Tab stops | Arrows                    |
| ---------- | ------------ | -------- | -------------- | --------- | ------------------------- |
| `single`   | `radiogroup` | `radio`  | `aria-checked` | one       | move focus **and** select |
| `multiple` | `group`      | `button` | `aria-pressed` | one each  | inert                     |

"Choose exactly one" is the APG radio-group pattern, and `role="radio"` +
`aria-checked` is the only correct expression of it. There is no APG pattern for
multiple selection, so individually-tabbable pressed buttons are right there — and
arrow keys must then do nothing, or a set of independent toggles starts behaving like
a single choice.

## Props

| Prop                                       | Type                             | Default        |
| ------------------------------------------ | -------------------------------- | -------------- |
| `selectionMode`                            | `"single" \| "multiple"`         | `"single"`     |
| `label`                                    | `string`                         | —              | Accessible name, applied as `aria-label`. |
| `orientation`                              | `"horizontal" \| "vertical"`     | `"horizontal"` | Also selects the arrow-key axis.          |
| `size` / `variant` / `tone`                | as `Button`                      | as `Button`    | Applied to every member.                  |
| `disabled`                                 | `boolean`                        | `false`        | Applies to every member.                  |
| `value` / `defaultValue` / `onValueChange` | discriminated on `selectionMode` | —              |

The value shape and the callback signature are tied to `selectionMode` by a
discriminated union, so passing an array with `selectionMode="single"` is a **type
error** rather than a runtime surprise:

```tsx
<ToggleButtonGroup selectionMode="multiple" value={["a"]} onValueChange={(v: string[]) => {}} />
<ToggleButtonGroup selectionMode="single"   value={null}   onValueChange={(v: string | null) => {}} />
```

`label` is optional so a consumer can pass `aria-labelledby` when a visible heading
already names the group. A development warning fires when neither is present.

## Keyboard

### Single selection

| Key                        | Behaviour                                            |
| -------------------------- | ---------------------------------------------------- |
| `Tab`                      | Enters at the selected member, or the first if none. |
| `ArrowRight` / `ArrowDown` | Moves focus **and** selects.                         |
| `ArrowLeft` / `ArrowUp`    | Moves focus **and** selects.                         |
| `Home` / `End`             | First / last.                                        |
| `Space` / `Enter`          | Selects (already-selected stays selected).           |

Navigation wraps. Selection follows focus, as APG requires.

### Multiple selection

| Key               | Behaviour             |
| ----------------- | --------------------- |
| `Tab`             | Reaches every member. |
| `Space` / `Enter` | Toggles that member.  |
| Arrows            | Inert.                |

## Reconciled design

| Decision         | UIReload                  | MUI                                | UI5                               | Why                                                                                                                                                                                    |
| ---------------- | ------------------------- | ---------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode prop        | `selectionMode` enum      | `exclusive: boolean`               | `selectionMode` enum              | An enum cannot lose a third mode later, and reads better.                                                                                                                              |
| Default mode     | `single`                  | multiple                           | `Single`                          | Follows UI5. Single is the common case for a button group.                                                                                                                             |
| Value + callback | `value` / `onValueChange` | `value` / `onChange(event, value)` | `selection-change` (Custom Event) | `onValueChange` matches the library's `onXChange` convention. The `event` argument is redundant: `composeHandlers` already gives consumers the event and a `preventDefault()` opt-out. |
| Callback arity   | one argument              | two                                | n/a                               | As above.                                                                                                                                                                              |
| Selection source | the group                 | the group                          | the group                         | A member's own `pressed` is ignored inside a group.                                                                                                                                    |

## Known gaps

- **`itemsFitContent`** (UI5, `@default false`) is not implemented. This group gives
  members their natural width; UI5's default equal-width behaviour can be had with
  `display: grid; grid-auto-columns: 1fr` on the group.
- **Keyboard navigation over the seam** is roving only; there is no wrap-around
  preference beyond `loop`, which is fixed on.

## CSS contract

```
.uir-toggle-button-group    root
```

State attributes: `data-orientation`, `data-selection-mode`. Members carry
`data-grouped` so `Button` can collapse the shared seam.

Rounded only on the outer ends; interior corners are square, so the group reads as one
control. Seams are collapsed with a negative margin in the **block** axis for a
vertical group and the **inline** axis for a horizontal one, both logical.
