# Accordion

A vertically stacked set of headings, each one a control that reveals its own section. The design question
is entirely about **structure a screen reader can navigate**: the header is a heading, the panel is a region
named by that heading, and the two are wired together.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice — is
recorded in `docs/references.md`, which is not published.

## Props

| Prop               | Type                                                                 | Default      | Notes                                         |
| ------------------ | -------------------------------------------------------------------- | ------------ | --------------------------------------------- |
| `items`            | `readonly AccordionItem[]`                                           | —            | Required. Each has `id`, `title`, `children`. |
| `selectionMode`    | `"single" \| "multiple"`                                             | `"single"`   | A discriminator, not a flag. See below.       |
| `value`            | `string \| null` \| `readonly string[]`                              | —            | Depends on `selectionMode`.                   |
| `defaultValue`     | same as `value`                                                      | —            | Uncontrolled initial state.                   |
| `onExpandedChange` | `(id: string \| null) => void` \| `(ids: readonly string[]) => void` | —            | Depends on `selectionMode`.                   |
| `allowAllClosed`   | `boolean`                                                            | `true`       | `"single"` only.                              |
| `headingLevel`     | `2 \| 3 \| 4 \| 5 \| 6`                                              | `3`          | `1` is not offered.                           |
| `variant`          | `"outlined" \| "plain"`                                              | `"outlined"` |                                               |
| `size`             | `Size`                                                               | `"md"`       |                                               |
| `lazy`             | `boolean`                                                            | `false`      |                                               |
| `disabled`         | `boolean`                                                            | `false`      | All items.                                    |
| `className`        | `string`                                                             | —            |                                               |
| `ref`              | `Ref<HTMLDivElement>`                                                | —            |                                               |

`AccordionItem` is `{ id, title, children?, disabled?, tone? }`.

## `selectionMode` is a discriminator, not a flag

```tsx
// One open at a time. `value` is `string | null`.
<Accordion items={items} value={open} onExpandedChange={setOpen} />

// Several. `value` is `readonly string[]`.
<Accordion items={items} selectionMode="multiple" value={open} onExpandedChange={setOpen} />
```

The two modes cannot share one value type: a single open id is `string | null`, several are
`readonly string[]`, and one `string | readonly string[] | null` prop would push a cast onto every consumer
to read their own value back. So the prop is a TypeScript discriminator and the wrong combination is a
compile error rather than a runtime surprise.

Internally both modes normalise to a set of ids, so there is only one toggle path and only one place that
can be wrong.

`undefined` and `null` are different in `"single"` mode: `undefined` means **uncontrolled**, `null` means
**controlled, with nothing open**. Collapsing the last panel reports `null`.

## `allowAllClosed={false}` uses `aria-disabled`, not `disabled`

For a wizard-style accordion where exactly one panel is always open.

The open header gets `aria-disabled="true"` and **stays focusable**. An inert `disabled` button would be
removed from the tab sequence, so the user could see the step they were on and never return to it — a trap.
`aria-disabled` keeps the control announced, focusable and visibly open, and simply does nothing when
activated, which is exactly what it means.

## Keyboard

| Key                       | Action                                 |
| ------------------------- | -------------------------------------- |
| `Enter` / `Space`         | Toggle the focused panel.              |
| `Tab` / `Shift + Tab`     | Next / previous focusable element.     |
| `Arrow Up` / `Arrow Down` | **Nothing. Deliberately — see below.** |
| `Home` / `End`            | **Nothing. Deliberately — see below.** |

There is **no roving tabindex** and no arrow-key navigation. The pattern keeps every header _and_ every
expanded panel's content in the page's natural tab sequence, so headers are ordinary buttons and `Tab`
simply reaches them in order.

Adding Up/Down/Home/End would be a toolbar pattern that this widget is not, and it would make the arrow keys
disagree with the tab order that is actually in force: a user pressing Down expecting to leave a panel's
first input would instead jump back to a header. Nothing is implemented by hand here because a real
`<button>` already provides Enter and Space.

## `hidden`, not a CSS-only collapse

A collapsed panel carries the `hidden` attribute.

`height: 0; overflow: hidden` leaves the panel's links **focusable**, so `Tab` would move through content
that is invisible — the single worst failure a disclosure widget can have. `hidden` is what removes it from
the tab sequence and from the accessibility tree.

The trade-off is that there is no height animation, because an animated element cannot be `hidden`. The
chevron's rotation is the only motion, and it is suppressed under `prefers-reduced-motion`.

## `role="region"` and the six-panel warning

Each panel is a `role="region"` named by its own header, so a screen reader user can jump to it by name.

The pattern calls this **optional** and warns against it above roughly six simultaneously expandable panels:
a long list of identical landmarks is a navigation problem rather than a solved one. `region` is used
because it is the more useful default, and the judgement belongs to the page. The `ManyItems` story shows
eight on purpose.

## Ids are generated from the index, not from `item.id`

`item.id` is the caller's state key and may contain anything — a space, a quote. It is used for state
identity and **never** put in the DOM. The element ids come from React's `useId` plus the index, so the
`aria-controls` / `aria-labelledby` pair cannot be broken by a consumer's id.

## `lazy` grows and never shrinks

A collapsed panel's children are not mounted until the item has been opened **once**. After that they stay
mounted, even when the panel closes again: `lazy` is about first-render cost, and re-mounting on every
toggle would make the second open slower than the first.

## CSS contract

```
.uir-accordion          the root; data-selection-mode, data-size, data-variant
.uir-accordion__item    one section; data-expanded, data-disabled, data-tone
.uir-accordion__heading the heading element; contains nothing but the trigger
.uir-accordion__trigger the button; data-expanded, aria-expanded, aria-controls
.uir-accordion__title   the label
.uir-accordion__icon    the chevron; CSS-drawn, aria-hidden
.uir-accordion__panel   role=region, aria-labelledby, hidden when collapsed
```

Component-local tokens: `--uir-accordion-border`, `--uir-accordion-surface`, `--uir-accordion-tone-text`,
`--uir-accordion-tone-accent`, `--uir-accordion-trigger-height`.

The heading element's UA margin is reset rather than compensated for with a negative margin, and the seam
between items is a `::before` on every item but the first rather than a grid gap — a gap is transparent, so
adjacent items with a surface would read as separate cards instead of one divided list.

The chevron is a rotated square with `border-block-start` and `border-inline-start`, so it mirrors in RTL
with no second rule, and the same rotation then opens the panel in either reading direction.

## Accessibility

- Each header is a `<button>` inside a heading element, and it is the **only** thing inside that heading —
  a chevron or badge rendered beside the label inside the heading would make it read as "Title Collapse",
  a different label from the one the button announces.
- `aria-expanded` on the button, `aria-controls` pointing at the panel, `aria-labelledby` on the panel
  pointing back at the button.
- No `role` on the container: a region there would nest every panel's region inside another region.
- Disabled items use the native `disabled` attribute, so they leave the tab sequence.
- An open, non-collapsible header is `aria-disabled` and remains focusable.
- In forced colours the seam and the outline become `CanvasText`; left as translucent tokens they can
  resolve to nothing, turning a divided list into several indistinguishable headers.

## Gaps

- **Arrow-key navigation.** See above. Deliberately absent, because the pattern specifies the natural tab
  sequence instead.
- **Nesting.** An accordion inside an accordion works structurally but is discouraged by the pattern when
  regions are involved; the `headingLevel` prop is what makes it correct if you do it.
- **A `stickyHeader`.** Both references offer one — the header stays pinned while the panel scrolls. Not
  built: it is a scroll-position behaviour layered on top of a disclosure widget, and it needs a
  scroll container the library does not own.
- **Height animation on open.** Blocked by `hidden`, which is the correct way to remove a panel from the
  tab sequence. A grid-rows animation would work only if the panel were left in the tree and focusable,
  which is the failure this design avoids.
- **A panel-level action beside the header.** The pattern notes that some accordions allow this. It is
  deliberately excluded, because anything inside the heading element changes the heading's accessible name.
