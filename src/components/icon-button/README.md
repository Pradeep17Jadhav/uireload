# IconButton

A button whose entire content is an icon.

## Reference libraries

| Concern            | Source                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Prop surface       | `@mui/material/IconButton/IconButton.d.ts` — `IconButtonOwnProps`                                                                       |
| `edge` semantics   | Same file: `edge?: 'start' \| 'end' \| false`, documented as removing a negative margin                                                 |
| Icon-only handling | `@ui5/webcomponents/dist/Button.d.ts` — `tooltip` JSDoc, `isIconOnly` getter                                                            |
| Icon-only styling  | `@ui5/webcomponents/dist/css/themes/Button.css` — `:host([icon-only]…){min-width:auto;padding:0}`                                       |
| Accessible name    | UI5 `tooltip` JSDoc: "A tooltip attribute should be provided for icon-only buttons, in order to represent their exact meaning/function" |

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

| Decision        | UIReload       | MUI                  | UI5          | Why                                                                                                               |
| --------------- | -------------- | -------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Default variant | `ghost`        | inherited (`text`)   | n/a          | An icon button has no label to read as an affordance; a border would be its only cue. Most usage is in a toolbar. |
| `edge`          | kept           | kept                 | n/a          | No equivalent a consumer could write without duplicating the negative-margin rule.                                |
| Composition     | wraps `Button` | extends `ButtonBase` | `ui5-button` | Inherits the entire visual contract, so size and state cannot drift from `Button`.                                |

### Rejected

- **`loadingPosition`** (MUI): Material-specific, and meaningless without a label to
  position against.
- **`loadingIndicator`** was kept; UI5 does not expose it, MUI does.

## Keyboard

Identical to `Button`: `Tab`, `Enter`, `Space`. A disabled icon button is skipped.

## CSS contract

```
.uir-icon-button              root; also carries .uir-button
.uir-icon-button__icon        sized slot wrapping children
```

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
