# Slider

A value in a range, by pointer or by keyboard. One thumb, or two for a range.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop                | Type                                              | Default        | Notes                                        |
| ------------------- | ------------------------------------------------- | -------------- | -------------------------------------------- |
| `label`             | `string`                                          | —              | **Required.** See below.                     |
| `value`             | `readonly number[]`                               | —              | Always an array. Controlled.                 |
| `defaultValue`      | `readonly number[]`                               | `[min]`        | Uncontrolled, read at mount only.            |
| `onValueChange`     | `(value: number[]) => void`                       | —              | Every change, including each step of a drag. |
| `onValueCommit`     | `(value: number[]) => void`                       | —              | Once settled.                                |
| `min` / `max`       | `number`                                          | `0` / `100`    |                                              |
| `step`              | `number \| null`                                  | `1`            | `null` is continuous.                        |
| `marks`             | `readonly SliderMark[]`                           | —              |                                              |
| `showLabels`        | `boolean`                                         | `true`         | Marks without their labels.                  |
| `getAriaValueText`  | `(value, index) => string`                        | —              | Announced and displayed value text.          |
| `valueLabelDisplay` | `"auto" \| "on" \| "off"`                         | `"off"`        | The bubble. Off by default — see below.      |
| `orientation`       | `"horizontal" \| "vertical"`                      | `"horizontal"` |                                              |
| `track`             | `"normal" \| "inverted"`                          | `"normal"`     | Bipolar fill.                                |
| `disabled`          | `boolean`                                         | `false`        |                                              |
| `tone`              | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"`    |                                              |
| `size`              | `"sm" \| "md" \| "lg"`                            | `"md"`         |                                              |
| `snapToStep`        | `boolean`                                         | `true`         |                                              |
| `hideValueText`     | `boolean`                                         | `false`        | Hide the readout beside the label.           |
| `name`              | `string`                                          | —              | Form submission.                             |
| `helperText`        | `ReactNode`                                       | —              | Announced via `aria-describedby`.            |
| `className`         | `string`                                          | —              |                                              |
| `ref`               | `Ref<HTMLInputElement>`                           | —              | The first thumb.                             |

### `SliderMark`

| Field   | Type        | Notes                                                       |
| ------- | ----------- | ----------------------------------------------------------- |
| `value` | `number`    | Must be on the step grid or equal to `min`, or unreachable. |
| `label` | `ReactNode` | Optional; drawn under the track.                            |

## Real `<input type="range">`, drawn

One native range input **per thumb**, visually hidden but focusable, with the rail and the thumbs drawn
in CSS around them.

That is the whole design, and it is what makes the rest of the component short. Because the controls
are real inputs:

- the pointer maths, the step snapping and the arrow keys are the browser's;
- `aria-valuenow` and the form value are the same number, so they cannot drift apart;
- a form submits the slider's value with no bridge;
- two thumbs cannot disagree with each other or with their own announced state.

What has to be added is only what a native range input cannot do: a visible track and thumbs, a
two-thumb interaction that keeps the thumbs ordered, marks, and the coarse and reset keys.

One proxy element with `aria-valuenow` swapped by hand would have been shorter to write and would have
had to reimplement all four of the above.

## `value` is always an array

Even for one thumb. A one-thumb slider is a range whose ends happen to be bound together, which is how
the platform treats it, and `number | number[]` would mean every consumer's callback had to narrow a
union before it could read anything.

The array is always sorted low-to-high and always the same length as the thumb count — see below.

## The thumb count is derived, never passed

The thumb count comes from the length of the normalised value, and nowhere else. A separate `thumbs`
prop would be a second source of truth for one fact that could disagree with the array, and every
consumer would have to keep the two in step. See the reasoning in `checkbox.tsx`'s `indeterminate`
handling for the same pattern applied to a DOM property.

Two consequences, both tested:

- `defaultValue={[50, 50]}` renders **two** thumbs, not one. A collapsed range is a state the user can
  reach by dragging the thumbs together, and they must be able to drag apart again. Dropping a thumb
  would make the control change shape mid-gesture and leave an uncontrolled slider permanently stuck
  at one thumb.
- An uncontrolled slider does **not** gain a thumb when `defaultValue` changes, because `defaultValue`
  is initial-only. A controlled one does, because the count is re-derived each render.

## The neighbour clamp

A thumb cannot pass its neighbour. The low neighbour is the floor, the high neighbour the ceiling,
and the range's own `min` / `max` stand in at the ends.

This is what makes a pair behave as a _range_ rather than as two unrelated sliders drawn together. Two
independent range inputs will happily cross, and a slider whose thumbs have swapped is a slider
reporting a minimum above its maximum — a state that renders fine and lies to everyone who submits it.

The clamp's terminal state is both thumbs on one value, not an inversion.

## Only the keys the platform lacks

Handled here: `PageUp` / `PageDown` (a tenth of the range), `+` / `-` (one step), and `Escape`.

Handled by the browser, and deliberately **not** re-handled: `ArrowLeft` / `ArrowRight` / `ArrowUp` /
`ArrowDown` / `Home` / `End`. The platform fires `change` for each, so handling them too would move the
thumb twice per press and land on a value neither the step nor the user asked for.

`Escape` restores the value from before the current interaction — not a cancel of the component, just
of the drag or key sequence in progress. It is the only way back from a value the user passed through
and did not mean to keep.

## `onValueChange` and `onValueCommit`

Both are needed and neither subsumes the other. A slider that fires only on commit cannot show a live
readout; one that fires only live cannot be submitted.

The split is by **whether a pointer button is down**, not by remembering "a key was pressed". The
platform fires `change` identically for a drag and for an arrow press, so the event alone cannot tell
them apart — but a drag necessarily has a button held and an arrow press necessarily does not.

The alternative — remember a keypress and let the next `change` inherit it — depends on the keydown
handler running before the change handler, which is not guaranteed: a listener in the capture phase
can change the value and fire `change` before the event ever reaches this component. Button state has
no such ordering requirement.

Without this, a keyboard user moves the thumb and `onValueCommit` never fires, so a form submitted on
blur has no committed value to read.

## Two value normalisations worth naming

1. **A continuous slider is still rounded to two decimals.** `0.1 + 0.2` is not `0.3`, and a slider
   reporting `0.30000000000000004` to `aria-valuenow` and to `onValueChange` is reporting
   floating-point noise as if it were data. `step={null}` therefore still gets an arrow increment —
   a hundredth of the range, which is fine enough to feel continuous and coarse enough to cross the
   range in a sane number of presses.
2. **`min` and `max` are always reachable, snapped or not.** `max` need not be a whole number of steps
   from `min` — `step={7}` on a `0..10` range is legal — so snapping `10` would give `7`, and `End`
   would stop one step short of the end of the rail. A bound the user can reach by pressing `End`
   cannot also be a value the control refuses.

`step={0}` is reported in development and then treated as the default, because `snap` would divide by
it. A broken prop value is a mistake, not a reason to take the page down. `min > max` is reported for
the same reason: every value clamps to the same number and the thumb cannot move.

## Reconciled design

| Decision        | Choice                               | Why                                                                                            |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Controls        | one `<input type="range">` per thumb | The pointer maths, the keyboard, the form value and the announced value are all the browser's. |
| `value`         | always an array                      | One shape for one and two thumbs; no union at every callback.                                  |
| Thumb count     | derived from the value               | One source of truth.                                                                           |
| Ordering        | sorted, clamped to the neighbour     | A range whose minimum is above its maximum is a control that lies.                             |
| Collapsed range | both thumbs kept                     | The user can drag them apart again.                                                            |
| Arrow keys      | the platform's                       | Re-handling them moves the thumb twice per press.                                              |
| Coarse step     | `PageUp` / `PageDown`                | A modifier-only shortcut is undiscoverable and missing on a keypad.                            |
| Reset           | `Escape`                             | The only way back from a value the user passed through.                                        |
| Commit          | by pointer-button state              | The event cannot distinguish a drag from a keypress; button state can.                         |
| `label`         | required                             | A slider announces its value and nothing about what it measures.                               |
| Bubble          | off by default                       | It duplicates what is announced and what `aria-valuenow` already says.                         |
| Marks           | explicit values                      | `marks` as a boolean is a layout decision dressed up as a value.                               |
| Geometry        | percentages from custom properties   | The same rule serves both orientations; no measuring in JS.                                    |

## Keyboard

| Key                       | Behaviour                                            |
| ------------------------- | ---------------------------------------------------- |
| `ArrowRight` / `ArrowUp`  | Up by one step. The platform's.                      |
| `ArrowLeft` / `ArrowDown` | Down by one step. The platform's.                    |
| `Home` / `End`            | Jump to `min` / `max`. The platform's.               |
| `PageUp` / `PageDown`     | A tenth of the range. Ours.                          |
| `+` / `-`                 | Up / down by one step. Ours.                         |
| `Escape`                  | Restore the value from before the interaction. Ours. |
| `Tab`                     | Every thumb is its own tab stop.                     |

A continuous slider (`step={null}`) uses a hundredth of the range for the arrows.

## CSS contract

```
.uir-slider              the root; data-orientation, data-size, data-tone, data-track,
                         data-range, data-disabled
.uir-slider__header      label and readout
.uir-slider__label       the real <label for> the first thumb
.uir-slider__readout     the current value, one span per thumb
.uir-slider__rail        the drawn track. aria-hidden.
.uir-slider__track       the filled portion
.uir-slider__thumb       one drawn thumb per value. aria-hidden.
.uir-slider__inputs      the real controls. Visually hidden, focusable.
.uir-slider__input       one <input type="range"> per thumb
.uir-slider__marks       the marks row. aria-hidden.
.uir-slider__mark        one mark, positioned by --uir-slider-at
.uir-slider__mark-label  a mark's label
.uir-slider__labels      the value bubbles. aria-hidden.
.uir-slider__value-label one bubble
.uir-slider__helper      the announced description
```

Component-local tokens: `--uir-slider-track-size`, `--uir-slider-thumb-size`, `--uir-slider-accent`,
`--uir-slider-ring`, `--uir-slider-fill`, `--uir-slider-fill-strong`, `--uir-slider-bubble`,
`--uir-slider-bubble-text`, `--uir-slider-thumb-shadow`.

Positioning is by `--uir-slider-at` (0..1), `--uir-slider-from` and `--uir-slider-to`, all set as inline
custom properties from the values. Percentages rather than pixels so the same rule serves both
orientations and so a thumb never has to be measured in JavaScript to find where to sit. The rail, the
marks and the bubbles all read the same property, so they cannot disagree about where a value is.

`data-range` marks a two-thumb slider, which the second thumb's stacking order keys on.

## Accessibility

- A real `<input type="range">` per thumb, so role, value, bounds, keyboard and form participation are
  the platform's. The announced number _is_ the form value.
- `label` is **required**, and rendered as a real `<label for>` pointing at the first thumb rather than
  an `aria-label` on the root: the root is not the slider, each thumb is, and a label associated with
  the first input is what a browser and a screen reader both understand.
- Every thumb is its own tab stop, so a range slider is two stops and not one.
- `helperText` is wired to `aria-describedby` on each thumb.
- `getAriaValueText` covers both the announced value and the displayed readout, so "40 dollars" is
  announced as well as shown. Without it a price slider announces "40".
- The rail, the thumbs, the marks and the bubbles are all `aria-hidden`: each is a picture of a value
  the inputs already state, and announcing the geometry as well would restate it in a second role.
- Disabled uses the native `disabled` attribute, so every thumb leaves the tab order.
- `forced-colors` is handled: the thumb is a light circle with a coloured border, and both of those are
  replaced by the system palette, so the rule sets it explicitly rather than letting it vanish against
  the rail.

## Gaps

- **A logarithmic `scale`.** Not implemented. It has no keyboard or form-submission story and would
  need the step grid to be non-uniform. Recorded rather than half-built.
- **One focus ring per thumb.** Every drawn thumb gets the ring when any input has focus, because CSS
  cannot know which input maps to which thumb. Narrowing it to one needs the focus index exposed as a
  data attribute on the root.
- **Vertical pointer interaction.** `orientation="vertical"` renders and is keyboard-operable, but the
  drawn geometry is inverted (`inset-block-end`) rather than re-derived, so the fill and the pointer hit
  area are worth browser-checking before this is relied on.
- **Touch.** `input[type=range]` handles touch natively, and the drawn thumb is sized from a token
  rather than from the platform's own thumb, so the visual and the hit area can differ slightly on a
  touch device.
- **`aria-valuemin` / `aria-valuemax` overrides** for a non-contiguous scale. Not applicable to a
  linear slider, and recorded so its absence is understood rather than assumed.
