# Design foundations

**The consistency contract.** Every interactive component in UIReload gets its size,
emphasis, intent, shape, typography and state colours from this document and the
tokens it references. A new component does not decide any of these.

Read this before implementing a component. `AGENTS.md` describes the _process_; this
describes the _output_.

---

## 1. Why this document exists

Three sources were read while designing the first components: two widely-used
component libraries and the WAI-ARIA APG. Each makes different choices, and none of them is
internally inconsistent — they are just inconsistent with each other:

|              | One common shape                                  | The other common shape                                                              |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Sizes        | `small` / `medium` / `large`                      | Compact / Cozy (two tiers)                                                          |
| Emphasis     | `variant: text \| outlined \| contained`          | `design: Default \| Transparent \| Emphasized \| Positive \| Negative \| Attention` |
| Intent       | `color: primary \| secondary \| success \| error` | folded into `design`                                                                |
| Toggle group | `exclusive: boolean`, no ARIA role                | `selectionMode: Single \| Multiple`                                                 |

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

**Provenance.** `md` at `2.25rem` and `sm` at `1.5rem` are the two published control heights,
read from the parameter bundle of a widely-used enterprise design system. That source has two
tiers; a third is added because a three-tier scale is genuinely more useful and enterprise apps
need a dense mode.

**Naming.** `sm` / `md` / `lg`, rather than the longer `small` / `medium` / `large`. `Size` was
fixed in `src/types.ts` before any component existed, and changing it later would be a
breaking change across the whole library.

**Target size.** All three heights are at least `1.5rem` (24px), satisfying WCAG 2.2
SC 2.5.8 Target Size (Minimum). A 30px `small` tier is comfortable but leaves no room for a
24px dense row, which is what `sm` is for.

**Minimum width** is `3rem` for all sizes, raised from the `2rem` / `2.25rem` found in
comparable systems. It was raised because a fixed minimum should not
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

| Variant   | Background  | Border  | Use                                          |
| --------- | ----------- | ------- | -------------------------------------------- |
| `ghost`   | transparent | none    | Tertiary actions, dialogs, table rows.       |
| `outline` | transparent | visible | Secondary actions, toolbars, control groups. |
| `solid`   | filled      | visible | The primary action on a screen.              |

**Default: `outline`.** This is a deliberate divergence: one common shape defaults to the
borderless tier and the other to the bordered one. `outline` was chosen because it
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

- `ghost` and `outline` must show a **distinct** hover and press. They render on the page
  background and have no fill to darken, so the wash is their only state signal. See
  section 8.1.

  The same reasoning applies to the neutral tone's wash, which cannot borrow
  `--uir-surface`: that is `#f8fafc`, 1.05:1 against a white page, and the neutral tone is
  the default, so this affected more buttons than any other tone.

  | Token                       | Light     | Dark      | High contrast |
  | --------------------------- | --------- | --------- | ------------- |
  | `--uir-neutral-wash`        | `#e2e8f0` | `#334155` | `#e5e7eb`     |
  | `--uir-neutral-wash-active` | `#cbd5e1` | `#475569` | `#d1d5db`     |
  | `--uir-neutral-on-wash`     | `#0f172a` | `#e2e8f0` | `#000000`     |

- The three variants must be distinguishable at every tone. A tone that cannot fill
  visibly needs a surface ramp, not a reuse of a surface token.
- Exactly one `solid` + `accent` control per page region is the intent. Nothing
  enforces this; it is a design-review convention.

---

## 4. Intent: `tone`

What the action means. Independent of `variant`, so all four tones exist at every
emphasis level.

| Tone       | Meaning                      |
| ---------- | ---------------------------- |
| `neutral`  | Default. No intent.          |
| `accent`   | The affirmative path.        |
| `positive` | Confirms success.            |
| `danger`   | Destructive or irreversible. |

**Default: `neutral`.**

`info` and `warning` tones are deliberately absent. Elsewhere they are palette slots
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

Generated component libraries gate `:hover` the same way, behind a not-touch check.

### 5.2 Focus ring

`--uir-focus-ring-width` (2px), `--uir-focus-ring-offset` (2px),
`--uir-focus-ring-color`. The `.125rem` width and `.0625rem` inset match the values enterprise
systems publish, though some of them add a second inner ring on top.

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

Setting `pointer-events: none` on disabled buttons is common, and its consequence is recorded in
that library's own documentation: a disabled button cannot show a tooltip, and the fix requires
overriding the CSS from outside. Enterprise systems instead leave `pointer-events` intact and use
`cursor: default`. This library does the same, because a tooltip explaining _why_ a control is
disabled is a real and common requirement, and breaking it to obtain a cursor change is a bad
trade.

Disabled controls are out of the tab order (native `<button disabled>` behaviour) and
are exempt from WCAG SC 1.4.3 as inactive user interface components, so the reduced
contrast is conformant.

### 5.4 Loading

Rendered as a disabled control plus a busy indicator. The **accessible name is
preserved** — a loading button must still announce what it is doing.

The loading wrapper must always be in the DOM, not conditionally added, or Google Translate
re-translates the subtree mid-flight and crashes (material-ui#27853). Every component here
renders the wrapper unconditionally and toggles its visibility.

Some libraries additionally offer `loadingDelay` (default `1000`ms) to avoid a flash on fast
responses. **Rejected for v1**: it makes `loading` non-deterministic in tests and in
first paint, and every consumer would have to override it. Recorded as a gap rather
than a silent omission.

---

## 6. Shape, typography, truncation

| Concern     | Token                        | Value      | Note                                                  |
| ----------- | ---------------------------- | ---------- | ----------------------------------------------------- |
| Radius      | `--uir-control-radius`       | `0.375rem` | Matches the published control corner radius.          |
| Border      | `--uir-control-border-width` | `1px`      | Matches the published control border width.           |
| Icon gap    | `--uir-control-gap`          | `0.375rem` | Matches the published icon-to-label margin.           |
| Font weight | `--uir-control-font-weight`  | `500`      | The closest widely available weight to Semibold.      |
| Truncation  | `text-overflow: ellipsis`    | -          | `white-space:nowrap; overflow:hidden; text-overflow`. |

### Body text and headings

The control ladder above is for _controls_. Body text and headings are a separate scale, because a
control that is 16px tall and a paragraph that is 16px tall are different objects and sharing a scale
between them is how a design ends up with controls that are too loud to sit beside prose.

**Body text.** `--uir-font-size` and `--uir-line-height`, both of which vary by colour scheme
(`1rem / 1.6` light, `0.9375rem / 1.45` dark — a dark scheme needs a slightly smaller size at a
slightly tighter leading to read as the same optical weight). This is what `Text` renders at its
default.

**Headings.** Six levels, `h1` to `h6`, on a descending scale. Two rules:

1. **The level is the heading rank.** `variant="h2"` renders an `<h2>`. The visual size and the
   document outline are the same fact, so they cannot disagree — which is the failure a `<div>` with a
   big font produces: a page whose visual hierarchy says one thing and whose heading structure says
   another, and a screen reader navigating by heading gets the wrong outline.
2. **The scale descends, the weights do not jump.** Every level below `h1` uses the same weight;
   size alone carries the hierarchy. Weight that oscillates — 700, 500, 700 — makes a level look
   more important than the one above it.

| Level | Element | Font size   | Weight | Line height |
| ----- | ------- | ----------- | ------ | ----------- |
| `h1`  | `<h1>`  | `2rem`      | `700`  | `1.2`       |
| `h2`  | `<h2>`  | `1.5rem`    | `600`  | `1.25`      |
| `h3`  | `<h3>`  | `1.25rem`   | `600`  | `1.3`       |
| `h4`  | `<h4>`  | `1rem`      | `600`  | `1.4`       |
| `h5`  | `<h5>`  | `0.875rem`  | `600`  | `1.45`      |
| `h6`  | `<h6>`  | `0.8125rem` | `600`  | `1.5`       |

`h6` is smaller than `h5` but still heavier, so the last two levels do not swap their apparent
importance when a colour scheme tightens the body size.

**Heading line height is tighter than body line height at every level.** A heading is one or two
lines and its leading is only visible as space around it; a body line's leading is what makes the
paragraph readable. Sharing one number between them is why large text in a UI often looks loosely set.

One radius for every control. Mixed radii are the single most common reason a component
family looks unrelated.

Controls are **single-line and truncate**. A button that wraps to two lines breaks
every row alignment below it.

---

## 7. Full-width and group behaviour

- **`fullWidth`** fills the container. The only layout-affecting prop on a control.
- **Groups** join controls edge to edge and remove the internal borders:
  `data-grouped` on every member but the first collapses its `border-inline-start`, which is
  also how segmented-button designs do it with `:not(:first-child)`.
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

| Role                            | Used by                                   |
| ------------------------------- | ----------------------------------------- |
| `--uir-button-fill`             | `solid` background                        |
| `--uir-button-fill-hover`       | `solid` hover                             |
| `--uir-button-fill-active`      | `solid` press, and a pressed solid toggle |
| `--uir-button-on-fill`          | `solid` text                              |
| `--uir-button-tint`             | `ghost` and `outline` text at rest        |
| `--uir-button-tint-border`      | `outline` border                          |
| `--uir-button-tint-wash`        | `ghost` and `outline` hover background    |
| `--uir-button-tint-wash-active` | `ghost` and `outline` press background    |
| `--uir-button-tint-on-wash`     | `ghost` and `outline` text on either wash |

There are deliberately **two** foreground roles at rest, not one. A single per-tone
foreground is correct for `solid` and makes the other two variants' labels invisible:
white-on-blue becomes white-on-white. Adding a tone means adding these nine declarations
and nothing else.

### 8.1 Two kinds of pale fill

`--uir-<tone>-subtle` and `--uir-<tone>-wash` are both pale tints of the tone, and they
have **opposite** requirements, so they are not interchangeable:

| Token                 | Used for                                                   | Wants to be                                            |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `--uir-<tone>-subtle` | a `solid` field's background, a dialog footer's background | as pale as possible — text sits on it permanently      |
| `--uir-<tone>-wash`   | an unfilled control's hover and press background           | obvious — it is the only state signal that variant has |

The wash is therefore **two** steps, `-wash` and `-wash-active`, plus an `-on-wash`
foreground. All three exist because of a real defect: `ghost` and `outline` have no fill
to darken, so a single wash token made hover and press render identically, and the press
registered nothing at all — the signal appeared and vanished inside one frame. The static
`-subtle` step was 1.05:1 to 1.09:1 against a white page, which is below what an eye reads
as a deliberate fill. The wash ramp clears 1.2:1 on hover and 1.4:1 on press, or the two
states collapse into each other again.

Enterprise systems model the same split: an unfilled variant carries separate background,
hover-background, active-background and hover-text values rather than one shared tint.

`-on-wash` exists because darkening the wash darkens the ground under the label.
`--uir-accent` clears 4.5:1 on the page but only reaches 4.24:1 on `--uir-accent-wash`, so
each tone darkens (light) or brightens (dark) its own label as the wash deepens.

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
