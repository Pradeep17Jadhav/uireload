# Button

Triggers an action. The reference implementation for every other control — if you
are unsure how something should behave, read this first.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

The keyboard contract is the WAI-ARIA APG Button pattern, which a native `<button>` already
provides; nothing about activation is reimplemented here.

## Props

| Prop               | Type                                              | Default     | Notes                                   |
| ------------------ | ------------------------------------------------- | ----------- | --------------------------------------- |
| `variant`          | `"ghost" \| "outline" \| "solid"`                 | `"outline"` | Emphasis. See `docs/foundations.md` §3. |
| `tone`             | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | Intent, orthogonal to `variant`. §4.    |
| `size`             | `"sm" \| "md" \| "lg"`                            | `"md"`      | §2.                                     |
| `disabled`         | `boolean`                                         | `false`     | Native attribute; out of the tab order. |
| `loading`          | `boolean`                                         | `false`     | Busy state; blocks interaction.         |
| `loadingIndicator` | `ReactNode`                                       | spinner     | Must be decorative.                     |
| `startIcon`        | `ReactNode`                                       | —           | Sized by `--uir-icon-size-*`.           |
| `endIcon`          | `ReactNode`                                       | —           | Meaningless without a label.            |
| `fullWidth`        | `boolean`                                         | `false`     | The only layout-affecting prop.         |
| `type`             | `"button" \| "submit" \| "reset"`                 | `"button"`  | Narrowed from `string`.                 |

Native `ButtonHTMLAttributes` are forwarded, including `form`, `name` and `value`.

## Reconciled design

| Decision         | Choice                        | Why                                                                                                                                                   |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Emphasis names   | `ghost` / `outline` / `solid` | A variant describes appearance only, never intent.                                                                                                    |
| Intent           | separate `tone` prop          | Separated so emphasis and intent multiply instead of being conflated.                                                                                 |
| Default variant  | `outline`                     | Visible in a toolbar without competing with the page's one primary action.                                                                            |
| Default tone     | `neutral`                     | The safe default when there is no provider to resolve a palette.                                                                                      |
| Sizes            | `sm` / `md` / `lg`            | `Size` was fixed in `src/foundations.ts` before any component existed.                                                                                |
| Disabled styling | `opacity` only                | `pointer-events: none` breaks the tooltip that explains why a control is disabled.                                                                    |
| Loading          | always-mounted wrapper        | A conditionally mounted subtree makes Google Translate re-translate it mid-flight, which crashes it.                                                  |
| Icons            | `startIcon` / `endIcon`       | `startIcon` is unambiguous; a single `icon` does not say which side.                                                                                  |
| Unfilled states  | two wash steps + `on-wash`    | `ghost` and `outline` have no fill to darken, so the wash is the whole signal. One value made press identical to hover, and the click showed nothing. |

### The wash ramp

`ghost` and `outline` render on the page background, so they have no fill to darken. Their
entire hover and press signal is a background wash, and that wash is **two** steps plus a
matching foreground:

| Role                       | Light     | Dark                    | High contrast |
| -------------------------- | --------- | ----------------------- | ------------- |
| `--uir-<tone>-wash`        | `#dbeafe` | `rgba(96,165,250,0.22)` | `#e5e7eb`     |
| `--uir-<tone>-wash-active` | `#bfdbfe` | `rgba(96,165,250,0.30)` | `#d1d5db`     |
| `--uir-<tone>-on-wash`     | `#1d4ed8` | `#bfdbfe`               | `#000080`     |

(The table shows the `accent` tone; `positive` and `danger` follow the same shape. The
`neutral` tone's values are the `--uir-neutral-*` steps in `src/theme/tokens.css`.)

This is deliberately **not** `--uir-<tone>-subtle`. That token is the static tint fill — a
`solid` field's background, where text sits permanently — so it is the palest step
available, 1.05:1 to 1.09:1 against a white page. A wash has the opposite requirement: it is
transient feedback competing with the page for attention, so it clears 1.2:1 on hover and
1.4:1 on press. Below that it does not read as a deliberate fill, and if the two steps are
close they collapse back into the single-value bug this ramp exists to fix.

`on-wash` exists because darkening the wash darkens the ground under the label.
`--uir-accent` clears 4.5:1 on the page but reaches only 4.24:1 on `--uir-accent-wash`, so
each tone darkens (light) or brightens (dark) its own label as the wash deepens. Every pair
is measured in `tests/contrast.test.ts`.

### Rejected, with reasons

- **`href` / `component` / `asChild`.** v1 renders a real `<button>` only. A link
  button needs either `asChild` composition or a second code path for `disabled` on an
  anchor. Both are planned; neither is silently absent.
- **`loadingPosition`.** Repositioning the label around the indicator. A centred
  busy indicator is overlaid instead.
- **`loadingDelay`** (commonly offered, default 1000ms). Rejected: it makes `loading`
  non-deterministic in tests and in first paint. Recorded rather than omitted
  quietly — `docs/foundations.md` §5.4.
- **`disableElevation`, `disableRipple`, `disableFocusRipple`.** Elevation and ripples
  are not part of this library's surface, and a focus ring is never optional.
- **`badge` slot.** Needs a `Badge` component first.
- **`accessibleRole`.** Rejected: use a real `<a>`. Emitting `role="button"` on a link
  misleads assistive technology about what activation does.
- **`accessibilityAttributes`** (`expanded`, `hasPopup`, `controls`,
  `ariaKeyShortcuts`). No wrapper prop: pass `aria-expanded` etc. directly, which
  `ButtonHTMLAttributes` already allows.

## Keyboard

Native `<button>` behaviour; nothing is reimplemented.

| Key     | Behaviour                                                      |
| ------- | -------------------------------------------------------------- |
| `Tab`   | Moves focus in and out. A disabled button is skipped entirely. |
| `Enter` | Activates.                                                     |
| `Space` | Activates.                                                     |

## CSS contract

```
.uir-button                      root
.uir-button__loading             busy indicator, always present, `aria-hidden`
.uir-button__spinner             default indicator
.uir-button__label               label; takes the ellipsis
.uir-button__icon--start         start icon
.uir-button__icon--end           end icon
```

State attributes: `data-variant`, `data-tone`, `data-size`, `data-loading`,
`data-full-width`, `data-grouped`.

Every dimension comes from `--uir-control-*` or `--uir-icon-size-*`. There are no
hardcoded sizes in this file.

## Accessibility

- Renders a real `<button type="button">`, so form participation, focus order,
  Enter/Space activation and `:disabled` are the platform's, not ours.
- Focus ring is `:focus-visible` only: 2px, 2px offset.
- Disabled controls use `opacity` and keep `pointer-events` intact, so a tooltip can
  still explain _why_ something is disabled.
- The loading state keeps the accessible name and adds `aria-busy`.
- Loading is a stronger claim than `disabled`: it also blocks form submission, so a
  double submit is not possible.
