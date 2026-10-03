# Spinner

An indeterminate busy indicator. A ring that turns, for work that is taking longer than a moment and
whose length is not knowable.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop        | Type                        | Default    | Notes                                          |
| ----------- | --------------------------- | ---------- | ---------------------------------------------- |
| `size`      | `"sm" \| "md" \| "lg"`      | `"md"`     | Diameter.                                      |
| `thickness` | `"thin" \| "md" \| "thick"` | `"md"`     | Ring width, as a fraction of the diameter.     |
| `tone`      | `Tone`                      | `"accent"` |                                                |
| `label`     | `string`                    | —          | **Decides the accessibility role.** See below. |
| `className` | `string`                    | —          |                                                |
| `ref`       | `Ref<HTMLSpanElement>`      | —          |                                                |

## There is no `value` prop, on purpose

A spinner that takes a percentage is a different component, and this is that component. Reporting a
number here would be a lie about something the caller does not know.

The determinate case is [`Loader`](../loader/README.md), and the split is what lets neither component
carry a `mode` flag.

## `label` decides the role, and cannot be merged

| `label` | Output                                 |
| ------- | -------------------------------------- |
| omitted | `aria-hidden="true"`, no role          |
| given   | `role="progressbar"` with `aria-label` |

This is the one decision here that is not a matter of taste. An unlabelled `progressbar` is an
accessibility failure — assistive technology announces a nameless progress indicator — so the two
states cannot be collapsed into one default. Either the spinner names itself or it leaves the tree
entirely.

Omitting `label` gives the **decorative** form, which is the right one for a spinner sitting beside
text that already says what is happening. A second announcement of the same fact is noise, and noise is
what makes live regions get ignored.

Giving `label` gives the **standalone** form, for a spinner that is the only thing on screen saying
work is in flight.

`label` is trimmed and an empty or whitespace-only value is treated as **no** label. An empty string is
not "no name given": passing one would produce a `progressbar` whose accessible name is `""`, which is the
same unlabelled-progressbar failure this prop exists to prevent, reached by the back door. A caller whose
label variable resolved to nothing gets the decorative form.

## `aria-valuenow` is deliberately absent

`role="progressbar"` with no `aria-valuenow` is the specified indeterminate form of the role. The
indeterminate state is not "zero percent" — it is "the value is unknown", and a `progressbar`
reporting `0` claims the first while meaning the second.

`aria-valuetext` is omitted for the same reason: it exists to describe a value, and there is none.

## Two boxes, because a circle has no landmarks

A ring drawn as one circle cannot show rotation: it is symmetric, so turning it in place is
imperceptible. So there are two elements — a full-circle track that does not move, and an arc that
covers three-quarters of one and does.

The arc is sized at `75%` of the ring and centred with a margin, and the gap it leaves is the only
thing making the rotation readable. Both the ring width and the arc size are expressed against the
diameter as `--uir-spinner-size`, so they scale together — four separate values per size would drift,
and the arc's gap would be the first thing to.

`thickness` scales the ring width proportionally rather than adding a fixed amount, which is what keeps
the gap open at `sm` instead of closing it until the ring reads as a solid disc.

## Keyboard

None. A spinner is not interactive and has no tab stop. In the labelled form it is a single
`progressbar` in the accessibility tree; in the decorative form it is not in the tree at all.

## CSS contract

```
.uir-spinner          the root; data-size, data-thickness, data-tone
.uir-spinner__track   the full ring behind the arc
.uir-spinner__arc     the turning three-quarter arc
```

Component-local tokens: `--uir-spinner-size`, `--uir-spinner-track-width`, `--uir-spinner-arc`,
`--uir-spinner-fill`, `--uir-spinner-track`, `--uir-spinner-duration`.

The rotation is a `transform` on the **arc**, not on the root, so it is a compositing change and the
spinner costs no layout and cannot shift its neighbours.

The root is `inline-block`, so a spinner's height comes from its diameter and no line box competes
with it.

## Accessibility

- Labelled: `role="progressbar"` with `aria-label` and **no** `aria-valuenow`.
- Unlabelled: `aria-hidden="true"` and no role.
- `currentcolor` throughout, so the spinner is correct in every colour scheme and in forced colours with
  nothing extra to keep in step.
- Under `prefers-reduced-motion` the rotation stops but the arc keeps its gap and its colour, so
  something is still visibly a partial ring rather than a grey circle. A stopped ring with no gap would
  read as "nothing is happening", which is the opposite of the truth.

## Gaps

- **`indeterminate` as an explicit prop.** Not needed: the component is unconditionally indeterminate,
  so there is no other state for a flag to select.
- **A `delay` before appearing.** Both references offer one, and it is a product decision rather than a
  component one — a spinner shown for 80ms and then replaced reads as a flash, but guessing the
  threshold introduces a visible delay for work that is genuinely fast.
- **A `text` / `textPlacement` pair for a caption beside the ring.** Deliberately omitted in favour of
  the caller's own markup: a caption is content, and this component's job is the indicator. Compose a
  `<Text>` beside it.
- **`ui5-busy-indicator`'s blocking form.** That is a region-level overlay that traps interaction, which
  is a different component with a different focus contract. Not built here.
