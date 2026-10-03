# Loader

A progress bar, for work that **is** measurable. The determinate half of the idea
[`Spinner`](../spinner/README.md) covers the other half of.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop         | Type                   | Default     | Notes                                                 |
| ------------ | ---------------------- | ----------- | ----------------------------------------------------- |
| `value`      | `number`               | —           | **Omitted means indeterminate.** Clamped to `0..max`. |
| `max`        | `number`               | `100`       | The value that means complete.                        |
| `label`      | `string`               | `"Loading"` | The accessible name.                                  |
| `showValue`  | `boolean`              | `false`     | Render the number beside the bar.                     |
| `valueLabel` | `string`               | —           | A description of the step. Becomes `aria-valuetext`.  |
| `size`       | `"sm" \| "md" \| "lg"` | `"md"`      | Bar height.                                           |
| `tone`       | `Tone`                 | `"accent"`  |                                                       |
| `className`  | `string`               | —           |                                                       |
| `ref`        | `Ref<HTMLDivElement>`  | —           |                                                       |

## `value` is optional, and that is the whole design

| `value`     | Role                         | `aria-valuenow` / `min` / `max` |
| ----------- | ---------------------------- | ------------------------------- |
| given       | `progressbar`, determinate   | all three present               |
| **omitted** | `progressbar`, indeterminate | **all three absent**            |

`role="progressbar"` with no `aria-valuenow` is the specified way to say the value is unknown. That is
why `value` is optional rather than defaulting to `0`: **"nothing done yet" and "we do not know" are
different facts**, and a bar pinned at zero makes the second claim while the user hears the first.

One role and two forms, rather than two components and two roles, because they are the same widget
reporting one field.

## Why `Spinner` is separate

Both references express this as one component with a `variant` or a `value`-that-may-be-absent flag, and
that is a reasonable API. It is not the one used here, because a caller choosing between "I know how much
is left" and "I do not" is making a decision about their own data, and expressing it as a flag means the
two shapes are interchangeable in a way they are not.

So: `Spinner` never takes a value and is compact and inline; `Loader` treats an absent value as
indeterminate and is block-level. **Pick the component, not the flag.** There is no case where both are
right for the same job.

## Clamping happens before the value is announced

A value outside `0..max` is a bug in the caller, and the fix keeps the **accessible** value honest as
well as the drawn one — a `progressbar` reporting 140 out of 100 is wrong whether or not the bar
overflows its track.

Clamped in JS, not by CSS, because CSS can clamp what is drawn and has no way to correct what is
announced.

A non-finite value reads as `0`, which is the only safe interpretation of `NaN`.

## `showValue` is about sight only

The bar already shows the proportion, so repeating it as text is a second thing to read that says the
same thing. It is off by default for that reason.

The **accessible** value is present regardless — `aria-valuenow` is not gated on `showValue`, because a
progress bar that refuses to report its value to a screen reader while printing it next to itself would
be exactly backwards.

`tabular-nums` on the value, because it changes as the bar moves: proportional figures make the digits
change width, which makes the text jitter beside a bar that is otherwise perfectly smooth.

## `valueLabel` is where the step description goes

`aria-valuetext` is not a number and does not have to be. `valueLabel` carries it, so a screen reader
hears "Step 2 of 7 — verifying" instead of "20". A percentage says **how much**, never **what**, and a
long-running job needs both.

When `valueLabel` is set it also replaces the number on screen, so the two never disagree.

## Keyboard

None. A loader is not interactive and has no tab stop.

## CSS contract

```
.uir-loader          the root; data-size, data-tone, data-determinate (when determinate)
.uir-loader__track   the whole range
.uir-loader__fill    the filled portion
.uir-loader__value   the number, or the valueLabel
```

Component-local tokens: `--uir-loader-height`, `--uir-loader-fill`, `--uir-loader-track`,
`--uir-loader-percent`.

`--uir-loader-percent` is set **inline** by the component from `value / max` and is declared in the
stylesheet at `100%` so the rule is complete on its own — a fill with nothing set on it is a full bar,
which is the right reading of a loader whose value was cleared.

A percentage rather than a pixel width, so the same rule serves any `max` and a consumer who changes the
maximum needs no arithmetic.

The fill's width grows from the inline start, which is what makes it mirror in RTL and in a vertical
writing mode with no second rule.

The value sits on the grid **beside** the track rather than inside it, so a long `valueLabel` widens the
row instead of being squeezed against the fill's end.

## Accessibility

- Always `role="progressbar"` with a name — defaulting to `"Loading"`, because the common case is a caller
  who has not thought about it and that case must not be the broken one.
- `aria-valuenow` / `min` / `max` present only when determinate, which is what distinguishes the two
  forms.
- `aria-valuetext` carries `valueLabel` when given.
- In forced colours the fill becomes `Highlight` — the one colour a forced-colours theme guarantees to
  mean "the system chose this". Left to `currentcolor` it would be the label's colour, which is legible
  but carries no sense of being the filled portion.

## Gaps

- **`valueState`.** The bar can be tinted by `tone`, but there is no dedicated "this failed" state. A
  failed load is not a progress value, and reporting it as one — a red bar at 40% — tells a screen
  reader the work is a third done when it has stopped.
- **Buffering / secondary progress.** A second, lighter bar behind the fill, for streamed media. Nothing
  in either reference's counterpart pair covers it for a general-purpose loader, and the buffered amount
  is not something a generic component can know.
- **A blocking overlay form.** For marking a whole region as busy. That is a different component with a
  real focus contract, not a prop on this one. Use `aria-busy` on the region and put a `Spinner` inside.
