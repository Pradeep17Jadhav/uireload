# Button

Triggers an action. The reference implementation for every other control — if you
are unsure how something should behave, read this first.

## Reference libraries

| Concern                 | Source                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition      | `@mui/material/Button/Button.d.ts` — `ButtonOwnProps`                                                                                                                  |
| Size / variant enums    | Same file: `size?: 'small' \| 'medium' \| 'large'`, `variant?: 'text' \| 'outlined' \| 'contained'`                                                                    |
| Class-name contract     | `@mui/material/Button/buttonClasses.d.ts` — `ButtonClasses`                                                                                                            |
| Behaviour, slots, parts | `@ui5/webcomponents/dist/Button.d.ts` — `design`, `icon`, `endIcon`, `type`, `@csspart button` / `icon` / `endIcon`                                                    |
| Design enum values      | `@ui5/webcomponents/dist/types/ButtonDesign.d.ts`                                                                                                                      |
| Form type enum          | `@ui5/webcomponents/dist/types/ButtonType.d.ts`                                                                                                                        |
| Size / state tokens     | `@ui5/webcomponents/dist/generated/themes/sap_horizon/parameters-bundle.css.js` — `--_ui5_button_base_height`, `_base_min_width`, `_base_padding`, `_base_icon_margin` |
| Hover gating            | `@ui5/webcomponents/dist/css/themes/Button.css` — `:not([_is-touch])` around `:hover`                                                                                  |
| Keyboard contract       | WAI-ARIA APG Button pattern; native `<button>` provides it                                                                                                             |

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
| `endIcon`          | `ReactNode`                                       | —           | Fiori advises against using it alone.   |
| `fullWidth`        | `boolean`                                         | `false`     | The only layout-affecting prop.         |
| `type`             | `"button" \| "submit" \| "reset"`                 | `"button"`  | Narrowed from MUI's `string`.           |

Native `ButtonHTMLAttributes` are forwarded, including `form`, `name` and `value`.

## Reconciled design

| Decision         | UIReload                      | MUI                               | UI5                                      | Why                                                                                                          |
| ---------------- | ----------------------------- | --------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Emphasis names   | `ghost` / `outline` / `solid` | `text` / `outlined` / `contained` | `Transparent` / `Default` / `Emphasized` | Renamed: a variant describes appearance only.                                                                |
| Intent           | `tone` prop                   | `color` prop                      | folded into `design`                     | Separated so emphasis and intent multiply instead of being conflated.                                        |
| Default variant  | `outline`                     | `text`                            | `Default`                                | Divergence. `outline` is visible in a toolbar without competing with the page's one primary action.          |
| Default tone     | `neutral`                     | `primary`                         | `Default`                                | Neutral is the safe default when there is no provider to resolve a palette.                                  |
| Sizes            | `sm` / `md` / `lg`            | `small`/`medium`/`large`          | Compact / Cozy (two)                     | `Size` was fixed in `src/types.ts` before any component existed.                                             |
| Disabled styling | `opacity` only                | `pointer-events: none`            | `opacity` + `pointer-events: unset`      | Follows Fiori. MUI's approach breaks tooltips on disabled controls, which their docs record as a limitation. |
| Loading          | always-mounted wrapper        | `loading` wrapper always rendered | `loading` + `loadingDelay`               | Avoids the Google Translate crash (mui/material-ui#27853).                                                   |
| Icons            | `startIcon` / `endIcon`       | same                              | `icon` / `endIcon`                       | `startIcon` is unambiguous; `icon` does not say which side.                                                  |

### Rejected, with reasons

- **`href` / `component` / `asChild`.** v1 renders a real `<button>` only. A link
  button needs either `asChild` composition or a second code path for `disabled` on an
  anchor. Both are planned; neither is silently absent.
- **`loadingPosition`.** Material-specific. Fiori overlays a centred busy indicator,
  which is what this does.
- **`loadingDelay`** (UI5, default 1000ms). Rejected: it makes `loading`
  non-deterministic in tests and in first paint. Recorded rather than omitted
  quietly — `docs/foundations.md` §5.4.
- **`disableElevation`, `disableRipple`, `disableFocusRipple`.** Material machinery.
  Elevation and ripples are not part of this library's surface, and a focus ring is
  never optional.
- **`badge` slot** (UI5). Needs a `Badge` component first.
- **`accessibleRole`** (UI5, `Button`/`Link`). Rejected: use a real `<a>`. Emitting
  `role="button"` on a link misleads assistive technology about what activation does.
- **`accessibilityAttributes`** (UI5: `expanded`, `hasPopup`, `controls`,
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
