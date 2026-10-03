# Tooltip

A short explanation, on hover or focus. The whole design question is making it stop being an attack.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published. **No counterpart exists in one of the two
reference libraries**, which is recorded there as a finding rather than papered over with a citation to
something that does not exist.

## Props

| Prop           | Type                                                  | Default     | Notes                               |
| -------------- | ----------------------------------------------------- | ----------- | ----------------------------------- |
| `label`        | `ReactNode`                                           | —           | No surface without it.              |
| `children`     | `ReactNode`                                           | —           | Wrapped in a focusable `<span>`.    |
| `placement`    | `"top" \| "bottom" \| "inline-start" \| "inline-end"` | `"top"`     | Logical, not `left` / `right`.      |
| `offset`       | `number`                                              | `8`         | Pixels.                             |
| `delay`        | `number`                                              | `400`       | Hover only.                         |
| `hideDelay`    | `number`                                              | `200`       | The grace period.                   |
| `open`         | `boolean`                                             | `false`     | Controlled.                         |
| `onOpenChange` | `(open: boolean) => void`                             | —           |                                     |
| `describe`     | `"tooltip" \| "label"`                                | `"tooltip"` | `aria-describedby` vs `aria-label`. |
| `className`    | `string`                                              | —           | Merged onto the **trigger**.        |
| `style`        | `CSSProperties`                                       | —           | Merged onto the **trigger**.        |
| `ref`          | `Ref<HTMLSpanElement>`                                | —           | The **trigger**.                    |

## A delay, a grace period, and a difference between hover and focus

Three decisions carry the component, and none of them is visible in a screenshot.

**1. `delay={400}` before it opens on hover.** A tooltip that appears with no delay fires on every
pass of the pointer across a toolbar. Sweep the pointer along a row of eight icon buttons with
`delay={0}` and eight tooltips fire; with `delay={400}` one does — the one you stopped on.

**2. `hideDelay={200}` before it closes.** This is what makes a tooltip usable. Moving the pointer onto
the tooltip — to read it, or to select its text — must not dismiss it. Without the grace period the
tooltip is only readable if you already know what it says.

**3. The delay applies to hover only.** Focus shows it immediately. A keyboard user has arrived at the
element deliberately, and there is no "passed over it by accident" case to guard against; a pointer
user has both. Applying the delay to focus would make the tooltip slower for the one group that cannot
accidentally trigger it.

## Keyboard

| Key      | Behaviour                                                         |
| -------- | ----------------------------------------------------------------- |
| `Tab`    | Reaches the trigger. The wrapper is `tabIndex={0}`.               |
| `Escape` | Dismisses immediately, skipping the grace period.                 |
| `Space`  | The platform's — which may activate a control inside the trigger. |

`Escape` is not decoration. A tooltip is not dismissable content: it takes no focus and traps nothing.
But a user who dismisses a tooltip they are reading wants it gone, and the only other way to dismiss
one is to move the pointer — which a keyboard user cannot do.

## The trigger wrapper is focusable, and that is a cost

```html
<span class="uir-tooltip-trigger" tabindex="0">…</span>
```

A tooltip must be reachable by keyboard, and a `<span>` around a non-focusable element is the only way
to make one focusable without changing what that element is.

The cost is real and is stated here: **a tooltip on a control that is already focusable adds a second
tab stop for the same information.** If your control already has an accessible name, the tooltip is
supplementary — describe the control, do not wrap it.

## `describe` chooses between two attributes that are not interchangeable

| `describe`  | Attribute          | Correct when                                  |
| ----------- | ------------------ | --------------------------------------------- |
| `"tooltip"` | `aria-describedby` | The tooltip **supplements** an existing name. |
| `"label"`   | `aria-label`       | The tooltip **is** the name.                  |

`aria-describedby` supplements a name and cannot replace a missing one, so an icon button with no text
and a tooltip has **no accessible name** — announced as "button" and nothing else. `aria-label` supplies
one.

`aria-label` is applied **only when `label` is a string**. A `ReactNode` has no string form and
`String(node)` is `"[object Object]"`, which is a worse name than none; supply `aria-label` yourself in
that case.

`aria-describedby` is set **only while the tooltip is showing**, because a description pointing at an
absent or hidden element is an invalid reference and every reader handles a stale one by saying nothing
at all.

## The surface is always in the DOM

```html
<div role="tooltip" hidden>…</div>
```

This is the same live-region problem `Snackbar` documents: assistive technology observes changes inside
a region it already knows about, and an element that did not exist a moment ago has nothing to observe.

So the surface is rendered on every pass whether or not it is open, and `hidden` does the work. Note
that this is the **opposite** of what `Drawer` does, and deliberately: a tooltip's description is
read as part of the trigger's name and description, whereas a dialog's existence is announced the
moment it appears — so announcing a dialog that is not there is worse than announcing nothing.

## Reconciled design

| Decision           | Choice                       | Why                                                                 |
| ------------------ | ---------------------------- | ------------------------------------------------------------------- |
| `delay`            | `400`, hover only            | A tooltip with no delay fires on every pass across a toolbar.       |
| `hideDelay`        | `200`                        | Moving onto the tooltip to read it must not dismiss it.             |
| Focus              | immediate                    | No accidental-pass-over equivalent exists with a keyboard.          |
| `Escape`           | dismisses                    | Otherwise the only dismissal is moving the pointer.                 |
| Trigger            | a focusable `<span>`         | The only way to make a non-focusable element reachable.             |
| Portalled          | yes, `position: fixed`       | Not clipped by an ancestor's `overflow`.                            |
| Always rendered    | `hidden`, not unmounted      | A description that appears with its element is never observed.      |
| `describe`         | a prop                       | `aria-describedby` cannot replace a missing name.                   |
| Placements         | logical, four values         | `left` / `right` are `inline-start` / `inline-end` plus `vertical`. |
| Flip and clamp     | the shared overlay algorithm | Same behaviour as every other overlay in the library.               |
| Reposition         | on scroll and resize         | A tooltip belongs to the viewport, so scrolling strands it.         |
| No arrow enter     | `pointer-events: none`       | A tooltip the pointer cannot enter dismisses as you read it.        |
| No enter animation | —                            | A fade-in tooltip is missed by the time it appears.                 |

## CSS contract

```
.uir-tooltip-trigger  the focusable wrapper; data-open
.uir-tooltip          the portalled surface; data-placement
```

Component-local tokens: `--uir-tooltip-fill`, `--uir-tooltip-text`, `--uir-tooltip-radius`.

The surface is `position: fixed` and its coordinates come from the shared overlay algorithm
(`computeOverlayPosition`), so **no rule here positions anything** — appearance only. The arrow is a
`::before`, so the label stays a plain text node and a screen reader has nothing extra to skip.

`max-inline-size: 20ch`, because a tooltip that runs the full width of a window is a paragraph, and a
paragraph has no role, no focus and no dismissal.

The fill is the **same in every colour scheme**: the surface is inverted relative to the page because it
is almost always over content of the opposite colour and has to promise contrast against whatever it
lands on. `--uir-tooltip-fill` is declared on the component, not on `:root`, for the same reason
`Snackbar`'s is.

## Accessibility

- The trigger is focusable, so the tooltip is reachable without a pointer.
- `Escape` dismisses it, so it is dismissable without a pointer.
- `role="tooltip"` on the surface, referenced by `aria-describedby` only while shown, or named with
  `aria-label` when the tooltip is the name.
- The surface has no tab stop and takes no focus: a tooltip is not dismissable content.
- `forced-colors` restates the fill as `Canvas` with a `CanvasText` border and `forced-color-adjust:
none`, because a dark custom fill is almost certainly not a colour a forced-colours theme knows, and a
  tooltip whose text colour is computed from one can end up unreadable — on a component whose entire
  job is to be read.

## Gaps

- **A group / arrow placement control.** The arrow sits centred on the surface's edge facing the
  trigger. For a long tooltip against a small trigger, a consumer usually wants the arrow pinned to the
  trigger rather than the surface. Not exposed.
- **A max width in `rem` rather than `ch`.** `ch` tracks the text, which is right for a short
  explanation and wrong for a tooltip containing a long unbroken string.
- **A `title`.** Deliberately not implemented, and this is the component's most common wrong answer: a
  `title` cannot be styled, cannot be shown on focus, cannot be positioned, is suppressed by some
  browsers for a while, and is unreachable by touch. Every one of those is a reason this component
  exists.
- **Touch.** There is no long-press to show a tooltip, deliberately: a tooltip that appears under a
  finger obscures the thing it describes, and on touch the information belongs in the content. Use
  `open` to control it if your design genuinely needs one.
