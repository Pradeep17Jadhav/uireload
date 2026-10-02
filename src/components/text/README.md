# Text

The type scale: body prose and six heading levels.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop           | Type                                            | Default     | Notes                                    |
| -------------- | ----------------------------------------------- | ----------- | ---------------------------------------- |
| `children`     | `ReactNode`                                     | —           |                                          |
| `variant`      | `"body" \| "h1" … "h6"`                         | `"body"`    | Also chooses the **element**.            |
| `tone`         | `"inherit" \| "default" \| "muted" \| "subtle"` | `"inherit"` |                                          |
| `as`           | `ElementType`                                   | —           | Escape hatch. Element only, not styling. |
| `align`        | `"start" \| "center" \| "end" \| "justify"`     | `"start"`   | Logical, not left/right.                 |
| `noWrap`       | `boolean`                                       | `false`     | One line, truncated.                     |
| `gutterBottom` | `boolean`                                       | `false`     |                                          |
| `measure`      | `"none" \| "short" \| "long"`                   | `"none"`    | Capped in `ch`.                          |
| `overline`     | `boolean`                                       | `false`     |                                          |
| `className`    | `string`                                        | —           |                                          |
| `ref`          | `Ref<HTMLElement>`                              | —           | Whatever `as` or `variant` renders.      |

## The variant chooses the element

`variant="h2"` renders an `<h2>`. Not a `<div>` with a heading's font size — an `<h2>`.

This is the component's one real decision, and it is why the prop is a single value rather than a
`level` and a `size`. A text component that renders headings as `<div>`s produces a page whose visual
hierarchy and whose document outline disagree: to the eye it is a proper page, and to anyone
navigating by heading it is an undifferentiated wall of prose. That failure is invisible in a
screenshot, which is why it survives review and is worth designing out.

One prop means the rank and the size are the same fact, so there is no path by which they can come
apart.

`body` renders a `<p>` — and deliberately not a heading, because most text on a page is prose.

## `as` changes the element, not the styling

An escape hatch for the cases that are real rather than hypothetical:

- a `<div>` or `<span>` for a heading inside a `summary` or a `legend`, where the heading element is
  not permitted;
- a `<h4>` for something that looks like an `h2`, when a page's outline has to differ from its design;
- a `span` for a run of text inside a heading.

`as` and `variant` are independent axes, and that is the point: `as="h4" variant="h2"` is a visual
h2 that is really an h4. Reach for it only when the automatic element is wrong. A component that
always required `as` would put two sources of truth back where this one just removed one — the same
reasoning that keeps `thumbs` off `Slider` and keeps `RadioGroup` taking an `options` array rather
than children.

## Tone defaults to `inherit`

A text component whose default is a specific colour has decided something about contrast it cannot
see, and imposes that decision on every call site. `inherit` defers to the parent, and the parent is
the only context that knows what the text sits on.

The three named tones map to tokens the colour scheme already defines: `--uir-text`,
`--uir-text-muted` and `--uir-text-disabled`.

## Measure is capped in `ch`

The readability of a line is a function of how many characters it holds. A pixel cap means a
different character count at every font size, and a different count again in every language — which is
how a "65-character" line becomes 90 characters in a script with wider glyphs.

`short` is `45ch`, `long` is `75ch`, and both use `max-inline-size` so the text still shrinks in a
narrow container instead of overflowing it.

## Sizes are literals; body is a token

The six heading sizes are literal `rem` values rather than tokens, deliberately. A heading scale is a
fixed relationship between six sizes, and expressing it as six tokens adds a layer of indirection with
nothing to configure — there is no consumer who wants "make my h4 the size of my h3".

Body text _does_ read tokens, because it genuinely varies: `--uir-font-size` and `--uir-line-height`
differ per colour scheme, because a dark scheme needs a slightly smaller size at a slightly tighter
leading to read as the same optical weight.

The full scale is documented in `docs/foundations.md` §6.

## Truncation, and why there is no `title`

`noWrap` applies the published truncation contract: `white-space: nowrap`, `overflow: hidden`,
`text-overflow: ellipsis`, plus the `min-inline-size: 0` that is easy to miss and without which the
ellipsis never engages — a flex or grid item defaults to `min-width: auto` and refuses to shrink.

It is opt-in, because truncation loses content and nothing in the DOM tells a screen reader how much.

**No `title` attribute is set.** It looks like the fix and is not: a `title` is a tooltip, unavailable
to touch, invisible to a keyboard user on most platforms, and not announced by most screen readers. If
a consumer needs the full text, the honest fix is a longer layout or a disclosure — not a tooltip.

## Reconciled design

| Decision        | Choice                           | Why                                                                  |
| --------------- | -------------------------------- | -------------------------------------------------------------------- |
| Heading element | the variant's own element        | The rank and the size are one fact, so they cannot drift apart.      |
| One prop        | `variant`, not `level` + `size`  | Two sources of truth for one fact is the failure being designed out. |
| Escape hatch    | `as`, element only               | The real cases are an element problem, never a styling one.          |
| Default tone    | `inherit`                        | A default colour decides contrast the component cannot see.          |
| Alignment       | `start` / `end`                  | A left-aligned RTL paragraph is not aligned with anything.           |
| Measure         | `ch`, `max-inline-size`          | Readability is character count, which varies with size and language. |
| Heading leading | tighter than body at every level | A heading's leading is only visible as space around it.              |
| Heading weight  | 700 then 600, then flat          | Weight that oscillates makes a level outrank the one above it.       |
| Overline        | reduces size on headings too     | Uppercase 24px with tracking is neither small nor readable.          |
| Sizes           | literals; body reads tokens      | A fixed relationship needs no indirection; body genuinely varies.    |
| Truncation      | opt-in, no `title`               | A tooltip is not a fix, and truncation loses content silently.       |

## Keyboard

None. `Text` renders no focusable element and handles no keys.

## CSS contract

```
.uir-text   the root element; data-variant, data-tone, data-align
            and, when set, data-overline, data-measure, data-nowrap, data-gutter
```

There is one element, not a wrapper around the caller's children. A wrapper would add a box for a
heading inside a `summary` to break out of, and would put the wrapper inside the accessible name of
whatever the text labels.

The optional attributes are **absent** when unset rather than present with a `"none"` value, so a
consumer's `.uir-text[data-variant="body"]` selector is not made more specific than it needs to be by
an attribute that is on every instance.

## Accessibility

- Real heading elements, so the document outline is navigable. See the `Outline` story.
- A real `<p>` for body text, which is what gives a screen reader's paragraph navigation something to
  navigate.
- `tone="inherit"` by default, so a text colour is never imposed without knowing the background.
- `noWrap` sets no `title`, because a tooltip is not announced and not available to touch.
- `forced-colors` needs no special case: text inherits its colour from its context in every
  forced-colours theme, and every tone here resolves to a token the theme redefines. Recorded so the
  absence is a decision.

## Gaps

- **A separate `Title` component.** Not implemented. It would be `Text` with a heading variant and a
  `required` level, which is a wrapper rather than a component — and the request for one is recorded
  here rather than answered with a thin alias that adds a name without a behaviour.
- **Balanced text wrapping.** `text-wrap: balance` on headings and `pretty` on body prose measurably
  improves ragging, and is a property rather than a component. It is not applied because it is
  expensive on long content and the right threshold varies; a consumer can set it on `.uir-text`.
- **Per-line alignment within one block.** `align` is per component, so a page cannot have a single
  `<p>` with mixed alignment without two components. That is the right trade: alignment belongs to the
  block, and splitting it is how justification bugs appear.
- **`aria-level` overrides.** A component can render `role="heading"` with an explicit `aria-level` to
  decouple rank from size. This one does not, on purpose — the decoupling is available through `as`,
  and a heading with an `aria-level` that contradicts its element is harder to reason about than a
  differently-styled one.
