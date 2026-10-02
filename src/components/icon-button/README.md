# IconButton

A button whose entire content is an icon.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

The accessible-name requirement is the one every comparable implementation states: a tooltip
attribute must be provided for icon-only buttons so it represents their exact meaning rather than
their function.

## Props

All of `Button`'s props except `fullWidth`, `startIcon` and `endIcon`, plus:

| Prop       | Type                        | Default   | Notes                                |
| ---------- | --------------------------- | --------- | ------------------------------------ |
| `edge`     | `"start" \| "end" \| false` | `false`   | Removes padding on one inline edge.  |
| `variant`  | `Variant`                   | `"ghost"` | Differs from `Button`'s `"outline"`. |
| `children` | `ReactNode`                 | —         | The icon. Required.                  |

### `aria-label` is required

There is deliberately no `label` prop that could be forgotten. Both reference
libraries rely on the consumer passing `aria-label`; UI5 states the requirement in
prose. Supply either:

```tsx
<IconButton aria-label="Delete"><TrashIcon /></IconButton>

<IconButton><TrashIcon /><span className="uir-visually-hidden">Delete</span></IconButton>
```

## Reconciled design

| Decision        | Choice                      | Why                                                                                                               |
| --------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Default variant | `ghost`                     | An icon button has no label to read as an affordance; a border would be its only cue. Most usage is in a toolbar. |
| `edge`          | kept                        | No equivalent a consumer could write without duplicating the negative-margin rule.                                |
| Composition     | wraps `Button`              | Inherits the entire visual contract, so size and state cannot drift from `Button`.                                |
| Icon goes in…   | `Button`'s `startIcon` slot | See below.                                                                                                        |

### The icon goes in `startIcon`, not in `children`

`Button` wraps `children` in `.uir-button__label`. A label is a line box, so an
inline-flex icon inside one is baseline-aligned and gets the parent's font descent
underneath it — every icon rendered a few pixels high (6px of inset above and 10px below
on an `md` control, instead of 8px and 8px). The label is also never `:empty`, so the
collapse rule below could not fire and `Button`'s inline padding survived, leaving the
control 46×36 rather than the square 36×36 it should be.

Both references avoid this by keeping the icon out of the text wrapper. Passing it
through `startIcon` makes it a direct flex child of the root, where `align-items: center`
applies, and leaves the label genuinely empty.

Consequences, all of them deliberate:

- `.uir-icon-button__icon` now fills `Button`'s slot rather than declaring its own size.
  `button.css` already sizes `.uir-button__icon` per `data-size`, and a second definition
  of `--uir-icon-size-*` here is one more number that can drift.
- `.uir-icon-button .uir-button__label:empty` now actually matches, because the label is
  no longer the icon's container. It stays `:empty` rather than becoming a bare
  descendant: the label is the accessible name by `Button`'s own contract, so if
  anything ever fills it, this must not hide the control's name.
- The padding reset has to out-specify `Button`. `.uir-icon-button { padding-inline: 0 }`
  is one class; `.uir-button[data-size]` is a class and an attribute, so the reset was
  dropped. `.uir-button.uir-icon-button[data-size]` wins on specificity rather than on
  bundle order, so the rule does not also depend on `icon-button.css` coming after
  `button.css`.

Geometry is not asserted by any test — jsdom has no layout, which is how both bugs
survived the suite. `tests/icon-button-foundation.test.ts` guards the two structural
facts that cause them, and appearance is checked in Storybook across all three schemes.

### Rejected

- **`loadingPosition`** (MUI): Material-specific, and meaningless without a label to
  position against.
- **`loadingIndicator`** was kept; UI5 does not expose it, MUI does.

## Keyboard

Identical to `Button`: `Tab`, `Enter`, `Space`. A disabled icon button is skipped.

## CSS contract

```
.uir-icon-button              root; also carries .uir-button
.uir-icon-button__icon        children, filling Button's .uir-button__icon slot
.uir-button__label            Button's; collapsed while empty
```

The icon is a direct flex child of the root — `<span class="uir-button__icon">` from
`Button`, containing `<span class="uir-icon-button__icon">` — so
`.uir-button { align-items: center }` centres it on both axes. Nothing here should need a
`vertical-align` or a `line-height` fix.

State attributes: `data-edge`, plus everything `Button` renders.

`edge` uses logical `margin-inline-start` / `margin-inline-end`, so it mirrors in
RTL. MUI calls it `edge` and implements it the same way.

## Accessibility

- **The accessible name is the whole contract here.** An unnamed icon button is
  announced as "button".
- Icon sizing is inherited; a consumer SVG should use `currentColor` (set here by
  `.uir-icon-button__icon > svg { block-size: 100%; inline-size: 100% }`) so it
  follows every tone and state. A hardcoded `fill` deliberately wins over inheritance —
  explicit beats inherited for brand assets.
- Square box driven by `--uir-control-height-*`, so it lines up with a `Button` of the
  same size.
