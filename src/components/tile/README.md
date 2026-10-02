# Tile

A surface that groups related content.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop          | Type                                              | Default     | Notes                                   |
| ------------- | ------------------------------------------------- | ----------- | --------------------------------------- |
| `children`    | `ReactNode`                                       | —           | The body.                               |
| `elevation`   | `"flat" \| "raised" \| "floating"`                | `"flat"`    |                                         |
| `interactive` | `boolean`                                         | inferred    | Renders a `<button>`.                   |
| `href`        | `string`                                          | —           | Renders an `<a>`. Implies interactive.  |
| `target`      | `string`                                          | —           | With `href`.                            |
| `rel`         | `string`                                          | —           | With `href`. Never defaulted.           |
| `header`      | `ReactNode`                                       | —           |                                         |
| `footer`      | `ReactNode`                                       | —           |                                         |
| `tone`        | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | The block-start edge bar.               |
| `padding`     | `"none" \| "sm" \| "md" \| "lg"`                  | `"md"`      |                                         |
| `maxHeight`   | `number \| string`                                | —           | Bound for an internally-scrolling body. |
| `loading`     | `boolean`                                         | `false`     | Skeleton; `aria-busy`.                  |
| `as`          | `ElementType`                                     | `"div"`     | When not interactive.                   |
| `className`   | `string`                                          | —           |                                         |
| `ref`         | `Ref<HTMLElement>`                                | —           | The interactive element, or the root.   |

## The element is the interaction

`interactive` and `href` decide what is rendered, and that is not a rendering detail — it is the whole
accessibility story.

| Props         | Element                  | Notes                                               |
| ------------- | ------------------------ | --------------------------------------------------- |
| neither       | `<div>`                  | No role, no tab stop. A grouping surface.           |
| `interactive` | `<button type="button">` | One tab stop, Space and Enter activate it natively. |
| `href`        | `<a>`                    | Announced destination, context menu, middle-click.  |

"The whole card is clickable" is a real interaction and the only correct way to express it is with the
element that means it. A `<div>` with a `tabIndex`, a `role` and a `keydown` handler gets close — and
still loses the platform's activation semantics, its accessible name computation, and its form
behaviour.

`href` **implies** `interactive`. A link-shaped tile that is not activatable is a link with no link
behaviour: it looks like a destination, takes no pointer, and is not in the tab order.

## `interactive` and a nested control are incompatible

A `<button>` containing a `<button>` is invalid HTML and an unlabelled one to a screen reader. An
activatable tile is one tab stop, so a control in its header or footer is unreachable.

The honest fix is to make the tile non-interactive and put the affordance in the header or footer. This
is recorded rather than worked around, because the component cannot detect it: a `TabBar` or a
`Button` in a tile's footer is legitimate until `interactive` is also set.

## Elevation: `flat` is the default

Three tiers, and the cheapest is the default:

- `flat` — a border, no shadow.
- `raised` — a border **and** a shadow.
- `floating` — a larger shadow and **no** border. The shadow is the edge.

Elevation is the most expensive visual decision in a design system. A page of raised cards reads as a
page of popups, and nothing else on the page is raised. `raised` keeps the border _and_ adds a shadow
because dropping the border is what makes a shadow read as elevation rather than as a smudge on a
bordered box.

## Tone is an edge bar, not a fill

A tinted background on a large surface is the fastest way to make a page unreadable, and the
block-start edge is where a status is scanned for. The bar is drawn on the **root**, not on a part:
drawn per-part it has to be suppressed on two of the three, and on a tile whose body scrolls it
scrolls away with the content, so a long tile loses its status colour exactly when it matters.

The bar is `display: none` for a neutral tile rather than drawn transparent — transparent still costs a
paint and still occupies the inline-start edge, shifting the content by the bar's width.

## Header and footer own their own insets

The root's padding is zero and each part owns its inset. A header with a tinted fill _and_ padding
inside it looks like a border, not a header. Separators between the parts are hairlines of the border
width, so the tile reads as one object rather than three stacked boxes.

## Loading

`aria-busy` on the root and `aria-hidden` on the body, with a CSS placeholder at a fixed height —
because a skeleton with the real content's height is not a skeleton.

**No live region.** The tile's _arrival_ is what a consumer announces; a region inside every loading
tile is a screen reader talking over itself.

A link tile drops its `href` while loading. An anchor cannot be `disabled`, and removing the `href` is
the honest signal that there is nowhere to go yet. A button tile uses the native `disabled`.

## Reconciled design

| Decision          | Choice                           | Why                                                                     |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------- |
| Element           | div / button / anchor by prop    | The element _is_ the role, name and keyboard work.                      |
| `href`            | implies `interactive`            | A link-shaped tile that does nothing is a link with no behaviour.       |
| `type="button"`   | always, on the button variant    | A tile inside a form must not submit it.                                |
| Default elevation | `flat`                           | A page of raised cards reads as a page of popups.                       |
| Tone              | a block-start edge bar           | A tint on a large surface is the fastest way to make a page unreadable. |
| Surface           | never tinted                     | The tone is the edge and the content, not the background.               |
| Header / footer   | own insets, hairline separators  | Padded tinted headers look like borders; three boxes look like three.   |
| Loading           | `aria-busy` + `aria-hidden` body | No live region: arrival is the consumer's to announce.                  |
| `maxHeight`       | a prop, not a token              | The bound has to be settable conditionally.                             |
| Padding           | logical                          | An edge in the wrong direction is not an edge.                          |

## Keyboard

| Key     | Behaviour                                          |
| ------- | -------------------------------------------------- |
| `Tab`   | Reaches the tile when it is interactive. One stop. |
| `Space` | Activates a button tile. Native.                   |
| `Enter` | Activates a button tile. Native.                   |

A plain tile has no keyboard interaction. A link tile follows it.

## CSS contract

```
.uir-tile             the root; data-elevation, data-tone, data-padding, data-interactive,
                      data-link, data-loading, data-has-header, data-has-footer
.uir-tile__header     above the body
.uir-tile__body       the body; aria-hidden while loading
.uir-tile__footer     below the body
```

Component-local tokens: `--uir-tile-fill`, `--uir-tile-border`, `--uir-tile-divider`,
`--uir-tile-hover`, `--uir-tile-shadow`, `--uir-tile-radius`, `--uir-tile-pad`, `--uir-tile-edge`,
`--uir-tile-edge-width`.

`::before` on the root draws the tone bar; it is the only pseudo-element and it is `display: none` for
a neutral tone.

## Accessibility

- The rendered element carries the role, the name and the keyboard behaviour. Nothing is faked with
  `role` attributes on a `div`.
- A plain tile has no role, which is correct for a grouping surface.
- `aria-busy` and `aria-hidden` on the body while loading, rather than a live region.
- Disabled uses the native attribute where one exists, and `opacity` with `pointer-events` intact so a
  tooltip can still explain why.
- `forced-colors` is handled: a `box-shadow` is invisible there, so an elevation that is only a shadow
  loses its edge entirely and the tile disappears into the page. The elevation tiers fall back to
  border _weights_, which is what a tier that cannot be seen should fall back to.

## Gaps

- **Nested controls while interactive.** Undetectable from inside, and invalid HTML. Documented above;
  the fix is to make the tile non-interactive.
- **Overflow into an affordance.** When `scrollable` is the wrong answer because the tabs must all be
  visible, that is a dropdown of tabs — a different component with its own keyboard contract. Recorded
  rather than half-built.
- **A grid.** A page of tiles needs to be arranged, and every layout library has opinions about it. The
  component supplies `min-inline-size: 0` so it behaves inside a grid; the grid itself is the
  consumer's.
- **Images.** `header` and `footer` take arbitrary content, so an image works — but with no sizing
  contract of its own.
