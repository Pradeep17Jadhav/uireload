# Pagination

A row of page numbers, plus the announcement that says where you are.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

One library has a pagination component and the other does not, so the window vocabulary below is taken
from the one that does and the live region is this component's own answer to a gap **both** share.

## Props

| Prop               | Type                             | Default           | Notes                           |
| ------------------ | -------------------------------- | ----------------- | ------------------------------- |
| `pageCount`        | `number`                         | —                 | **Required.**                   |
| `page`             | `number`                         | `0`               | Zero-based. Clamped.            |
| `onPageChange`     | `(page: number) => void`         | —                 | Not called for no-op clicks.    |
| `siblingCount`     | `"auto" \| "all" \| 1 \| 2 \| 3` | `"auto"`          |                                 |
| `showEdges`        | `boolean`                        | `true`            | First / previous / next / last. |
| `announcePosition` | `boolean`                        | `true`            |                                 |
| `pageLabel`        | `string`                         | `"Page"`          |                                 |
| `previousLabel`    | `string`                         | `"Previous page"` |                                 |
| `nextLabel`        | `string`                         | `"Next page"`     |                                 |
| `firstLabel`       | `string`                         | `"First page"`    |                                 |
| `lastLabel`        | `string`                         | `"Last page"`     |                                 |
| `size`             | `Size`                           | `"md"`            |                                 |
| `disabled`         | `boolean`                        | `false`           |                                 |
| `className`        | `string`                         | —                 |                                 |
| `ref`              | `Ref<HTMLElement>`               | —                 | The `<nav>`.                    |

## `aria-current="page"`, never `aria-pressed`

```html
<button aria-current="page">3</button>
```

The current page is a **position**, not a toggle the user pressed. `aria-pressed` tells a screen reader
"this button is on", which is a claim about the control; `aria-current` says "this is where you are",
which is a claim about the collection — and it is the one a user moving through pages needs.

`Pagination` and `Stepper` make the same choice for the same reason. A component family that used two
different attributes for "you are here" would make a user learn the distinction for no benefit.

## The live region is the part that is not a row of buttons

```html
<span role="status" aria-live="polite">Page 3 of 12</span>
```

Pressing a page number moves a pressed state and loads content, and **neither is announced**. Without
this region a screen reader user has pressed something and been told nothing.

It is visually hidden, because the current page is already obvious on screen — one button is filled.
The announcement is for a user who cannot see which one.

`aria-live="polite"`, because a page change is announced after whatever the user is currently reading
rather than cutting it off.

The region is **always present**, never conditionally mounted, for the reason `Snackbar` documents:
assistive technology observes changes inside a region it already knows about, and an element that did
not exist a moment ago has nothing to observe.

The text is composed through `formatMessage` with a `{total}` placeholder, because "Page 3 of 12" in
English is "Seite 3 von 12" in German and "ページ 3 / 12" in Japanese — the word order is not the same,
so a template is the only form a translator can work with.

## The window: first, last, and a run around the current page

```
« ‹ 1 … 5 6 [7] 8 9 … 20 › »
```

First and last are **always** present. Dropping either end would put the end of the collection two
clicks away and out of sight, which is the thing a page-number row exists to prevent.

`siblingCount="auto"` is one page either side. Below five pages there is nothing to compress, so every
page shows.

The gap is a `<span aria-hidden="true">…</span>`. It is not focusable, and announcing "ellipsis"
announces a piece of CSS — a screen reader user gets the page count from the status region instead.

### Why the window is narrow at the ends

At page 1 of 20 the row is `1 2 … 20`. You cannot jump to page 7 from page 1; you step. **That is the
entire reason the ellipsis exists**, and it is correct: a control showing all twenty numbers is a
control whose numbers are too small to aim at.

A consequence worth stating, because it surprises people: `page={0}` renders only pages 1, 2 and 20. If
you are writing a test that clicks "page 5" from the first page, the button is not there — and that is
the window doing its job, not a bug.

### `siblingCount` is an explicit opt-out, not a size guess

`siblingCount="all"` shows every page. The alternative — guessing at a threshold and switching
automatically — was rejected because **the point at which a row of numbers stops fitting is a question
about the container, and this component cannot measure it.** Guessing wrong in either direction is a
visible bug, so the choice is the consumer's.

## `page` is a zero-based index; the user counts from one

```tsx
<Pagination page={6} pageCount={20} /> // renders "7" as current
```

A component that shows "0" is a bug every consumer then works around by adding one everywhere, in
every place they render a page number themselves.

The announced name is `Page 7`, and the reported value is `6`.

## `page` is clamped, and no-op clicks are not reported

`page` is a number the consumer passes, and a consumer whose total shrank under a stale index would
otherwise render a control with nothing pressed and every button pointing at a page that does not
exist.

```tsx
const go = (target) => {
  if (target < 0 || target > last) return;
  if (target === current) return;
  onPageChange(target);
};
```

A control that reports a change it did not make is a control a consumer has to defensively filter.

## One page renders nothing

```tsx
if (last < 1) return null;
```

A single page has nothing to paginate. Rendered as one disabled button it would take space on screen
with nothing to say — and on a list of twenty tables that is twenty rows of dead weight.

## Reconciled design

| Decision          | Choice                        | Why                                                             |
| ----------------- | ----------------------------- | --------------------------------------------------------------- |
| `pageCount`       | required                      | Without a total it is a "next" button with numbers around it.   |
| Current marker    | `aria-current="page"`         | A position, not a toggle.                                       |
| Live region       | always present                | A live region that appears with its content is never observed.  |
| Politeness        | `polite`                      | Announced after the current utterance, not through it.          |
| Index base        | zero-based prop, one-based UI | A consumer adding one everywhere is a bug in every one of them. |
| Gap               | `aria-hidden`, not focusable  | Announcing "ellipsis" announces CSS.                            |
| Window            | first + last always           | The ends must be one click away.                                |
| `siblingCount`    | an opt-out                    | Fit is a question about the container, not the component.       |
| `page`            | clamped                       | A stale index would render a control pointing nowhere.          |
| No-op clicks      | not reported                  | Do not report a change you did not make.                        |
| `pageCount <= 1`  | renders nothing               | A control with nothing to say is worse than no control.         |
| Announcement text | `{total}` template            | Word order is the translator's to choose.                       |
| Root element      | `<nav>` with `aria-label`     | Unnamed landmarks are indistinguishable to a landmark user.     |

## Keyboard

| Key     | Behaviour                                                          |
| ------- | ------------------------------------------------------------------ |
| `Tab`   | Reaches every control in DOM order. Native — they are `<button>`s. |
| `Space` | Activates. Native.                                                 |
| `Enter` | Activates. Native.                                                 |

There is **no roving tabindex and no arrow-key navigation.** That is a deliberate rejection: the APG
pattern for a toolbar is roving focus, but pagination is a _set of links to distinct pages_, not a
single widget with a cursor. Every page is a genuine destination, every page has its own accessible
name, and a user who cannot see them should be able to tab through the row and hear "Page 5", "Page 6",
"Page 7" to find where they are.

Edge controls at the ends are genuinely `disabled`, so `Tab` skips them — a disabled button is
announced as unavailable, which is true and useful ("you are on page 1").

## CSS contract

```
.uir-pagination           the <nav>; data-size, data-disabled
.uir-pagination__control  first / previous / next / last;
                          data-direction on the inner chevron
.uir-pagination__page     a page number; data-current
.uir-pagination__chevron  the arrow, drawn from two borders
.uir-pagination__gap      the ellipsis; aria-hidden
.uir-pagination__status   the live region; visually hidden
```

Component-local tokens: `--uir-pagination-size`, `--uir-pagination-fill`,
`--uir-pagination-border`, `--uir-pagination-text`, `--uir-pagination-current`,
`--uir-pagination-current-text`, `--uir-pagination-hover`, `--uir-pagination-disabled-opacity`.

Every control is **square and sized off `--uir-control-height-md`**, including the edge controls —
which is the case usually given a smaller size. A "next" that is easier to miss than a page number is a
"next" nobody uses.

Square is deliberate. A pill-shaped number reads as a toggle, and `aria-current="page"` is a position.

`font-variant-numeric: tabular-nums`, so a page number does not change width as it counts and the row
does not shuffle sideways as the current page moves.

The row is `flex-wrap: wrap`. Twenty page numbers do not fit in a narrow container, and a row that
overflows is a row whose last pages are unreachable.

The current page is a **solid accent fill**, not an outline: an outlined current page on a row of
filled ones reads as "selected but not active", and the whole point is that this is where the user is.

## Accessibility

- A `<nav>` with `aria-label`, so it is distinguishable from every other landmark by a user moving
  between them.
- `aria-current="page"` on the current page and nothing else.
- A `role="status"` live region, always present, reading "Page 3 of 12", composed through
  `formatMessage`.
- `aria-hidden` on the gap, which is not focusable and carries no information a screen reader can use.
- `aria-label` on every control, so "Page 5" and "Next page" are both unambiguous out of context.
- Genuinely `disabled` edge controls at the ends, so they are announced as unavailable rather than
  silently ignored.
- Nothing is focusable that is not actionable.
- `forced-colors` restates every button as `Canvas` / `CanvasText` and the current page as `Highlight`
  / `HighlightText`, because a custom accent fill is not a colour the system palette knows and a filled
  current page and an unfilled one would otherwise be indistinguishable — the one thing the control
  must never lose.

## Gaps

- **No `sizes` prop.** There is no items-per-page control. It changes what "page 3" means, so it
  belongs to whatever owns the query, not to the pagination row.
- **No `href` / router links.** Every control is a `<button>`, because a client-side router is a
  per-project decision (see `Link`'s README for the same reasoning). A consumer who wants real links
  gets them by rendering their own list — which is why `pageCount` and `onPageChange` are separated from
  the markup.
- **Jump-to-page.** A number input for "go to page 47" is a real need at 200 pages and a real cost in
  complexity, and it duplicates the stepper. Not built; `page` being fully controlled means a consumer
  can drive the component from their own field.
- **Page-size changes mid-collection.** Changing the page size invalidates the current page, and what to
  move it to is a product decision rather than a component one. `page` is clamped, which is the best a
  component can do on its own.
