# Design foundations

**The consistency contract.** Every interactive component in UIReload gets its size,
emphasis, intent, shape, typography and state colours from this document and the
tokens it references. A new component does not decide any of these.

Read this before implementing a component. `AGENTS.md` describes the _process_; this
describes the _output_.

---

## 1. Why this document exists

Three libraries were read while designing the first components: MUI, SAP Fiori UI5,
and the WAI-ARIA APG. Each makes different choices, and none of them is internally
inconsistent — they are just inconsistent with each other:

|              | MUI                                                                  | Fiori UI5                                                                           |
| ------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Sizes        | `small` / `medium` / `large`                                         | Compact / Cozy (two)                                                                |
| Emphasis     | `variant: text \| outlined \| contained`                             | `design: Default \| Transparent \| Emphasized \| Positive \| Negative \| Attention` |
| Intent       | `color: primary \| secondary \| success \| error \| info \| warning` | folded into `design`                                                                |
| Toggle group | `exclusive: boolean`, no ARIA role                                   | `selectionMode: Single \| Multiple`                                                 |

Rather than pick a winner, this document separates the axes the two libraries had
conflated. **Emphasis** (`variant`) is how loud a control is. **Intent** (`tone`) is
what it does. They multiply:

```
ghost / outline / solid   x   neutral / accent / positive / danger
```

That is why `variant="danger"` does not exist here: it would mean "louder _and_
destructive", and those are two independent decisions that a consumer sometimes wants
to make differently (`solid` + `danger` is a destructive primary action; `ghost` +
`danger` is a quiet destructive action in a table row).

---

## 2. Sizes

Three tiers. `--uir-control-height-*`, `--uir-control-pad-inline-*`,
`--uir-control-font-size-*`, `--uir-icon-size-*`.

| Size | Height    | Min width | Font size  | Padding (inline) | Icon      | Typical use                       |
| ---- | --------- | --------- | ---------- | ---------------- | --------- | --------------------------------- |
| `sm` | `1.5rem`  | `3rem`    | `0.875rem` | `0.5rem`         | `1rem`    | Dense toolbars, table row actions |
| `md` | `2.25rem` | `3rem`    | `1rem`     | `0.75rem`        | `1.25rem` | **Default.** Everything else.     |
| `lg` | `2.75rem` | `3rem`    | `1.125rem` | `1rem`           | `1.5rem`  | Marketing surfaces, touch-first   |

**Provenance.** `md` is Fiori's cozy button and `sm` is its compact button, read from
`--_ui5_button_base_height` in
`@ui5/webcomponents/dist/generated/themes/sap_horizon/parameters-bundle.css.js`
(`var(--_ui5-compact-size, var(--sapElement_Compact_Height))` and
`var(--_ui5-cozy-size, var(--sapElement_Height))`). Fiori has two tiers; a third is
added because MUI's three-tier scale is genuinely more useful and enterprise apps need
a dense mode.

**Naming.** `sm` / `md` / `lg`, not MUI's `small` / `medium` / `large`. `Size` was
fixed in `src/types.ts` before any component existed, and changing it later would be a
breaking change across the whole library.

**Target size.** All three heights are at least `1.5rem` (24px), satisfying WCAG 2.2
SC 2.5.8 Target Size (Minimum). Fiori's compact button is also 24px; MUI's `small`
button is 30px, which is comfortable but leaves no room for a 24px dense row.

**Minimum width** is `3rem` for all sizes. Fiori uses `2rem` / `2.25rem`
(`--_ui5_button_base_min_width`). It was raised because a fixed minimum should not
depend on label length — otherwise a two-character button is 24px and a four-character
button is 32px, and neighbouring buttons in a group have visibly different widths.

**Density** is orthogonal. `--uir-control-height-*` is not multiplied by
`data-uir-density`; the `compact` preset in `src/theme/tokens.css` adjusts the space
and font tokens, and controls follow the size the consumer asked for. Density changes
rhythm, not target size, because shrinking a target size below 24px is an
accessibility regression.

---

## 3. Emphasis: `variant`

How much visual weight the control carries. Weakest to strongest.

| Variant   | Background  | Border  | Use                                                                         |
| --------- | ----------- | ------- | --------------------------------------------------------------------------- |
| `ghost`   | transparent | none    | Tertiary actions, dialogs, table rows. MUI `text`, UI5 `Transparent`.       |
| `outline` | transparent | visible | Secondary actions, toolbars, control groups. MUI `outlined`, UI5 `Default`. |
| `solid`   | filled      | visible | The primary action on a screen. MUI `contained`, UI5 `Emphasized`.          |

**Default: `outline`.** This is a deliberate divergence from both libraries. MUI
defaults to `text` (ghost), UI5 to `Default` (outline). `outline` was chosen because it
is the safest default for an unknown context: it is visible in a toolbar without
competing with a page's single primary action, and it does not look like a disabled
button when the consumer forgets to pass a variant. A library default should be hard
to get wrong, not loud.

**Rules.**

- `ghost` has no border. It must not rely on colour alone to be distinguishable; its
  label is the affordance.
- `outline` has a border and no fill.
- `solid` is the only variant with a fill, and **the fill must be visible against the
  page**. This matters most for `tone="neutral"`, which has no colour to fill with and
  therefore needs its own surface ramp:

  | Token                       | Light     | Dark      | High contrast |
  | --------------------------- | --------- | --------- | ------------- |
  | `--uir-neutral-fill`        | `#f1f5f9` | `#1e293b` | `#1f2937`     |
  | `--uir-neutral-fill-hover`  | `#e2e8f0` | `#334155` | `#374151`     |
  | `--uir-neutral-fill-active` | `#cbd5e1` | `#475569` | `#4b5563`     |

  `--uir-surface-raised` is **not** a control fill. It is `#ffffff` in the light scheme,
  and filling a `solid` neutral button with it produced a button pixel-identical to
  `outline` — the ladder collapsed to two steps for the most common tone.
  `tests/button-foundation.test.ts` asserts the rule.

- The three variants must be distinguishable at every tone. A tone that cannot fill
  visibly needs a surface ramp, not a reuse of a surface token.
- Exactly one `solid` + `accent` control per page region is the intent. Nothing
  enforces this; it is a design-review convention.

---

## 4. Intent: `tone`

What the action means. Independent of `variant`, so all four tones exist at every
emphasis level.

| Tone       | Meaning                      | MUI       | UI5          |
| ---------- | ---------------------------- | --------- | ------------ |
| `neutral`  | Default. No intent.          | `primary` | `Default`    |
| `accent`   | The affirmative path.        | `primary` | `Emphasized` |
| `positive` | Confirms success.            | `success` | `Positive`   |
| `danger`   | Destructive or irreversible. | `error`   | `Negative`   |

**Default: `neutral`.**

MUI's `secondary`, `info` and `warning` are deliberately absent. They are palette slots
in a theme object; there is no palette here, and a `warning`-toned button with no
`warning` in the consumer's theme would render as an undefined colour. A tone set is
only useful if every value in it is guaranteed to render.

---

## 5. States

Six states. Each has a visual requirement **and** a behavioural one; the behaviour is
the part that is easy to omit.

| State           | Visual                                  | Behaviour                                              |
| --------------- | --------------------------------------- | ------------------------------------------------------ |
| `rest`          | Base tokens.                            | —                                                      |
| `hover`         | Foreground/background shift.            | Pointer only. Suppressed on coarse pointers.           |
| `active`        | Slightly stronger than hover.           | Press feedback, including keyboard press.              |
| `focus-visible` | 2px ring, 2px offset.                   | **Keyboard only.** Never `:focus`.                     |
| `disabled`      | `opacity: var(--uir-disabled-opacity)`. | Not actionable, out of the tab order, still hoverable. |
| `loading`       | Disabled appearance.                    | Not actionable. Accessible name preserved.             |

### 5.1 Hover

Suppressed on coarse pointers, because a hover state that persists after a tap is a
known mobile annoyance:

```css
@media (hover: hover) and (pointer: fine) {
  .uir-button:hover {
    /* … */
  }
}
```

Fiori does the same thing in its generated CSS, gating `:hover` behind
`:not([_is-touch])`.

### 5.2 Focus ring

`--uir-focus-ring-width` (2px), `--uir-focus-ring-offset` (2px),
`--uir-focus-ring-color`. Fiori uses `.125rem` (2px) solid `--sapContent_FocusColor`
at `.0625rem` (1px) inset (`--_ui5_button_focused_border`), plus a second inner ring
on some designs.

**`:focus-visible`, never `:focus`.** Showing a ring on mouse click is noise;
removing it on keyboard focus is an accessibility failure. The base layer in
`src/index.css` sets the global default, so a component only overrides the colour.

### 5.3 Disabled — the one that catches everyone

```css
.uir-button:disabled {
  opacity: var(--uir-disabled-opacity);
  cursor: not-allowed;
  /* pointer-events is deliberately NOT set to none */
}
```

MUI's ButtonBase sets `pointer-events: none` on disabled buttons. Their documentation
records the consequence: a disabled button cannot show a tooltip, and the fix
requires overriding their CSS from outside. Fiori uses `pointer-events: unset` with
`cursor: default`. This library follows Fiori, because a tooltip explaining _why_ a
control is disabled is a real and common requirement, and breaking it to obtain a
cursor change is a bad trade.

Disabled controls are out of the tab order (native `<button disabled>` behaviour) and
are exempt from WCAG SC 1.4.3 as inactive user interface components, so the reduced
contrast is conformant.

### 5.4 Loading

Rendered as a disabled control plus a busy indicator. The **accessible name is
preserved** — a loading button must still announce what it is doing.

MUI documents a specific bug here: the loading wrapper must always be in the DOM, not
conditionally added, or Google Translate crashes (mui/material-ui#27853). Every
component here renders the wrapper unconditionally and toggles its visibility.

UI5 additionally offers `loadingDelay` (default `1000`ms) to avoid a flash on fast
responses. **Rejected for v1**: it makes `loading` non-deterministic in tests and in
first paint, and every consumer would have to override it. Recorded as a gap rather
than a silent omission.

---

## 6. Shape, typography, truncation

| Concern     | Token                        | Value      | Provenance                                                             |
| ----------- | ---------------------------- | ---------- | ---------------------------------------------------------------------- |
| Radius      | `--uir-control-radius`       | `0.375rem` | Fiori `--_ui5_button_border_radius` (`--sapButton_BorderCornerRadius`) |
| Border      | `--uir-control-border-width` | `1px`      | Fiori `--sapButton_BorderWidth`                                        |
| Icon gap    | `--uir-control-gap`          | `0.375rem` | Fiori `--_ui5_button_base_icon_margin`                                 |
| Font weight | `--uir-control-font-weight`  | `500`      | Fiori sets Semibold for Emphasized                                     |
| Truncation  | `text-overflow: ellipsis`    | —          | Fiori `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`    |

One radius for every control. Mixed radii are the single most common reason a component
family looks unrelated.

Controls are **single-line and truncate**. A button that wraps to two lines breaks
every row alignment below it.

---

## 7. Full-width and group behaviour

- **`fullWidth`** fills the container. The only layout-affecting prop on a control.
- **Groups** join controls edge to edge and remove the internal borders:
  `[data-grouped]` on all but the first collapses its `border-inline-start`. Fiori does
  this with `:not(:first-child)` on `ui5-segmented-button-item`.
- **Groups share one size.** A group takes a single `size`, `variant` and `tone` and
  passes them to its members. Mixing sizes inside a group is not supported; MUI
  inherits the group's size for the same reason.

---

## 8. Colour

There is no palette and no `color` prop. A control's colours come from
`--uir-*` semantic tokens:

```
--uir-accent          --uir-accent-contrast
--uir-surface         --uir-surface-raised
--uir-text            --uir-text-muted      --uir-text-disabled
--uir-border          --uir-border-strong
--uir-danger          --uir-danger-contrast
--uir-success         --uir-warning
```

A tone supplies a **role set**, not a single colour, because a control paints three
states per tone plus a wash for unfilled variants:

| Role                       | Used by                                   |
| -------------------------- | ----------------------------------------- |
| `--uir-button-fill`        | `solid` background                        |
| `--uir-button-fill-hover`  | `solid` hover                             |
| `--uir-button-fill-active` | `solid` press, and a pressed solid toggle |
| `--uir-button-on-fill`     | `solid` text                              |
| `--uir-button-tint`        | `ghost` and `outline` text                |
| `--uir-button-tint-border` | `outline` border                          |
| `--uir-button-tint-subtle` | `ghost` and `outline` hover wash          |

There are deliberately **two** foreground roles, not one. A single per-tone foreground is
correct for `solid` and makes the other two variants' labels invisible: white-on-blue
becomes white-on-white. Adding a tone means adding these seven declarations and nothing
else.

### Contrast is measured, not reviewed

`tests/contrast.test.ts` computes the WCAG 2.x ratio for every tone x variant x scheme
pair, from the token values, and fails below **4.5:1** (SC 1.4.3, normal-size text).
Borders and focus rings are held to **3:1** (SC 1.4.11). Disabled text is exempt, because
SC 1.4.3 exempts inactive controls, and that exemption is asserted rather than assumed.

This exists because a screenshot looked fine while `--uir-success` sat at 3.30:1 and
`--uir-border-strong` at 2.56:1. Both semantic ramps are therefore one step darker than a
conventional 600/400 scale, and the reasons are recorded beside the tokens.

**Never use colour as the only signal.** Selected, invalid and disabled states all
carry an attribute or text as well.

---

## 9. RTL and logical properties

Every control uses logical properties only. `npm run lint:css` fails the build on
physical direction properties. Consequences that specifically affect controls:

- Icon-to-label gap is `gap` or `margin-inline-start`, never `margin-left`.
- Adjacent radius in a group uses `border-start-start-radius`, not `top-left`.
- `fullWidth` and `edge` use `start` / `end`, never `left` / `right`.

See `docs/rtl.md`.

---

## 10. Accessibility baseline

Applies to every component. `docs/accessibility.md` has the full contract; the
control-specific minimum is:

1. A real `<button type="button">` unless the pattern requires something else. `type`
   defaults to `button` so a control inside a form does not submit it by accident.
2. An accessible name. Icon-only controls **require** `aria-label` — there is no
   `label` prop to forget.
3. Complete keyboard support for the APG pattern for that widget.
4. State exposed as `data-*` _and_, when it conveys meaning to assistive technology, as
   the correct ARIA attribute (`aria-pressed`, `aria-checked`, `aria-expanded`).
5. `axe` reports zero violations.

---

## 11. Adding a component that conforms

1. Read the APG pattern. Note role, states, keyboard.
2. Read both reference counterparts per `AGENTS.md`.
3. Import `Variant`, `Tone`, `Size` from `uireload`. Do not invent new values.
4. Style from `--uir-control-*` and `--uir-icon-size-*`. Do not hardcode a dimension.
5. Implement all six states in section 5.
6. Add the CSS contract to `docs/foundations.md` if you need a _new_ shared dimension.
   If you only need a new value for an existing dimension, add a token.
7. A token that only one component uses does not go in `tokens.css`. Put it in the
   component's own stylesheet, prefixed `--uir-<component>-`.

Step 7 is the rule that keeps this document from becoming a dumping ground.

---

## 12. Machine-readable

| What                      | Where                                                |
| ------------------------- | ---------------------------------------------------- |
| `Variant`, `Tone`, `Size` | `src/foundations.ts`                                 |
| Token names               | `CONTROL_TOKENS` in `src/foundations.ts`             |
| Token values              | `src/theme/tokens.css`                               |
| Enforced rules            | `scripts/check-css.mjs`, `tests/conventions.test.ts` |

`tests/conventions.test.ts` asserts every `CONTROL_TOKENS` entry exists in
`tokens.css`, so the two cannot drift.
