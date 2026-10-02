# Popover

A surface positioned against an anchor: supplementary content, a small form, a list.

## Reference libraries

| Concern              | Source                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition   | `@mui/material/Popover/Popover.d.ts` — `PopoverProps` (`anchorEl`, `placement`, `align`, `open`, `modal`, `marginThreshold`, `container`)                                                   |
| Origin algebra       | Same file — `PopoverOrigin`, `PopoverPosition`, `getOffsetTop` / `getOffsetLeft`, and `PopoverActions.updatePosition()`                                                                     |
| Virtual anchors      | Same file — `PopoverVirtualElement` (a bare `getBoundingClientRect` and nothing else)                                                                                                       |
| Behaviour, parts     | `@ui5/webcomponents/dist/Popover.d.ts` — `placement`, `horizontalAlign`, `verticalAlign`, `modal`, `hideArrow`, `allowTargetOverlap`, `resizable`; `@csspart header` / `content` / `footer` |
| Modality contract    | `@ui5/webcomponents/dist/Popup.d.ts` — `blockPageScrolling`, `applyInitialFocus`, `resetFocus`, `initialFocus`, `preventFocusRestore`                                                       |
| Dismissal reason     | Same file — `PopupBeforeCloseEventDetail`'s `escPressed`, and `closePopup(escPressed)`                                                                                                      |
| Placement enum       | `@ui5/webcomponents/dist/types/PopoverPlacement.d.ts` — `Start`, `End`, `Top`, `Bottom`                                                                                                     |
| Cross-axis enum      | `@ui5/webcomponents/dist/types/PopoverHorizontalAlign.d.ts` and `.../PopoverVerticalAlign.d.ts` — `Center`, `Start`, `End`, `Stretch`                                                       |
| Anchor visibility    | `_onOpenerIntersection` and `_observeOpenerVisibility` in `Popover.d.ts`                                                                                                                    |
| RTL correction       | `getRTLCorrectionLeft()` and `isRtl` in `Popover.d.ts`                                                                                                                                      |
| Regions              | `@ui5/webcomponents/dist/Popover.d.ts` — "three main areas: Header (optional), Content, Footer (optional)"                                                                                  |
| Keyboard / dismissal | WAI-ARIA APG Dialog pattern; `useFocusTrap` and `useDismiss` in `src/internal/`                                                                                                             |

Versions read from `../referenceUILibraries/package.json`: `@mui/material` 9.4.0,
`@ui5/webcomponents` 2.27.2.

## Props

| Prop                     | Type                                              | Default     | Notes                                            |
| ------------------------ | ------------------------------------------------- | ----------- | ------------------------------------------------ |
| `anchor`                 | `FocusTarget`                                     | required    | Ref, node, or thunk. Also a virtual rect.        |
| `open`                   | `boolean`                                         | —           | Controlled. Nothing renders when false.          |
| `defaultOpen`            | `boolean`                                         | `false`     | Uncontrolled.                                    |
| `onOpenChange`           | `(open: boolean) => void`                         | —           | Every intended change.                           |
| `placement`              | `"top" \| "bottom" \| "start" \| "end"`           | `"bottom"`  | Logical. Flips when it would overflow.           |
| `align`                  | `"center" \| "stretch"`                           | `"center"`  | Cross-axis only.                                 |
| `offset`                 | `number`                                          | `8`         | Anchor edge to surface edge, in pixels.          |
| `viewportPadding`        | `number`                                          | `8`         | Minimum gap to a viewport edge.                  |
| `modal`                  | `boolean`                                         | `false`     | Focus, trap, scroll lock, backdrop.              |
| `closeOnOutsidePress`    | `boolean`                                         | `true`      |                                                  |
| `closeOnEscape`          | `boolean`                                         | `true`      |                                                  |
| `closeOnAnchorOutOfView` | `boolean`                                         | `true`      | Closes when the anchor scrolls away.             |
| `autoFocus`              | `boolean`                                         | `true`      | Modal only.                                      |
| `restoreFocus`           | `boolean`                                         | `true`      | Modal only.                                      |
| `label`                  | `string`                                          | —           | `aria-label` when there is no `title`.           |
| `title`                  | `ReactNode`                                       | —           | Visible heading; `aria-labelledby` points at it. |
| `tone`                   | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | Surface border.                                  |
| `header` / `footer`      | `ReactNode`                                       | —           | UI5's `@csspart` regions.                        |
| `arrow`                  | `boolean`                                         | `false`     | `aria-hidden`.                                   |
| `onClose`                | `(reason: "escape" \| "outside-press") => void`   | —           | Fires on every close, controlled or not.         |
| `className`              | `string`                                          | —           | Merged onto the surface.                         |
| `ref`                    | `Ref<HTMLDivElement>`                             | —           | The surface.                                     |

## Reconciled design

| Decision                  | UIReload                      | MUI                                | UI5                                            | Why                                                                             |
| ------------------------- | ----------------------------- | ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Placement vocabulary      | `top`/`bottom`/`start`/`end`  | `anchorOrigin` + `transformOrigin` | `placement` (`Top`/`Bottom`/`Start`/`End`)     | Logical, so it mirrors in RTL with no extra rule.                               |
| Cross-axis                | one `align` prop              | a second origin object             | two enums (`HorizontalAlign`, `VerticalAlign`) | The cross axis is implied by the placement, so two props is one too many.       |
| `start` / `end` for align | **rejected**                  | `left` / `right` / `center`        | `Start` / `End` / `Center` / `Stretch`         | They duplicate `placement`, and accepting both lets them disagree.              |
| Modality                  | `modal`, default `false`      | always a `Modal`                   | `modal`, default `false`                       | Follows UI5. A dropdown list must not lock the page.                            |
| Dismissal reason          | `"escape" \| "outside-press"` | `onClose(event, reason)`           | `escPressed` flag                              | A boolean is not enough for unsaved work; a named reason is.                    |
| Naming                    | `title` for a visible heading | `TransitionProps`                  | `headerText`                                   | A visible heading names the surface for sighted and assistive technology alike. |
| No-anchor state           | centred + `data-unpositioned` | not handled                        | not handled                                    | An anchor inside an unmounted conditional is a real state, not an error.        |
| Overlay                   | none                          | `Paper` + `Backdrop`               | none                                           | The surface is a plain element with a CSS contract.                             |

### The one real divergence: `start`/`end` instead of `left`/`right`

UI5's `PopoverPlacement` already offers `Start`/`End`, which is the right vocabulary, and then
patches the physical case at runtime with `getRTLCorrectionLeft()` and an `isRtl` getter.
MUI's `PopoverOrigin` takes physical `left`/`right`/`center` and leaves the mirroring to the
consumer.

Here the logical vocabulary is used end to end: the placement prop is logical, the _reported_
placement stays logical after a flip, and the arrow's offset is a percentage against
`inset-inline-start`. All the direction-dependent arithmetic lives in two functions —
`resolvePlacement` and the `candidate` closure in `computeOverlayPosition` — so there is no
correction pass that can disagree with the placement it is correcting.

### Rejected, with reasons

- **Positioning via CSS `anchor()`.** The right answer, and not in the baseline across the
  engines this library supports. A component that silently fails to position in Firefox is worse
  than one that does it in JavaScript. Every value the algorithm returns is written to an inline
  `style`, so a consumer can still override any of it without `!important`.
- **`elevation` (MUI, default 8).** Material shadow machinery, and a numeric scale into the
  bargain. `--uir-shadow` and `--uir-shadow-large` exist; which one a surface uses is a CSS
  decision.
- **`marginThreshold` (MUI).** Renamed to `viewportPadding` and expressed in the same direction
  as UI5's `VIEWPORT_MARGIN`, which is the value it corresponds to.
- **Entry and exit animations.** Deliberately absent. A fade-out would have to outlive
  unmounting, which is the classic way a portalled component leaves a half-faded ghost in the
  DOM. A consumer who wants one adds it through their own CSS keyed off the `data-*`
  attributes this component exposes.
- **`resizable` (UI5).** An interactive drag handle is a feature, not a style, and it needs its
  own keyboard and pointer contracts.
- **`allowTargetOverlap` (UI5).** Exists to resolve a conflict this algorithm does not have:
  it flips or clamps, and never overlaps the anchor unless the content is larger than the
  viewport.
- **`hideArrow` (UI5).** The negative of `arrow`, which is the clearer name for a boolean
  default of `false`.
- **`PopoverActions.updatePosition()` (MUI).** Repositioning is automatic here, via
  `ResizeObserver` and the scroll and resize listeners. An imperative handle for it would be a
  second way to ask for the same thing.
- **Reusing `Popover` for `Dialog`.** They are not the same component: a dialog is
  viewport-centred rather than anchored, it has no arrow, and its outside-press and Escape
  behaviour are not optional in the same way. `Dialog` shares the portal, the scroll lock and the
  focus trap from `src/internal/overlay.ts`, and implements its own placement. Recorded rather
  than forced into one component with a `centre` placement.

## Keyboard

Native behaviour inside the surface; the overlay-level keys come from the hooks in
`src/internal/`.

| Key         | Modal                                   | Non-modal                         |
| ----------- | --------------------------------------- | --------------------------------- |
| `Tab`       | Cycles inside the surface.              | Moves through the page normally.  |
| `Shift+Tab` | Cycles backwards inside.                | Moves backwards through the page. |
| `Escape`    | Closes, unless `closeOnEscape={false}`. | Same.                             |

On close, focus returns to whatever was focused before, which is what makes Escape feel like
undoing rather than teleporting the user to the top of the document.

## CSS contract

```
.uir-popover                  the surface; role="dialog"
.uir-popover__backdrop        only when modal; blocks pointer events
.uir-popover__arrow           aria-hidden; inline-positioned by measurement
.uir-popover__header          UI5's @csspart header
.uir-popover__title           the heading, and the aria-labelledby target
.uir-popover__content         UI5's @csspart content; scrollable
.uir-popover__footer          UI5's @csspart footer
```

State attributes: `data-placement` (the _resolved_ placement, so a consumer can see a flip),
`data-modal`, `data-shifted`, `data-unpositioned`, `data-tone`, `data-align`.

Position comes from inline `style` written by the algorithm, not from CSS. Component-local
tokens: `--uir-popover-arrow-size`, `--uir-popover-arrow-offset`, `--uir-popover-border`,
`--uir-popover-ring`.

### Why the arrow is two borders meeting at a point

It is the smallest thing that draws an arrow: no markup, no extra request, and nothing to theme
that is not already the surface's own background. It is `aria-hidden`, so it costs a
screen-reader user nothing — `aria-checked` and the position of the surface are what carry the
meaning.

In `forced-colors`, the arrow is hidden rather than left in place. The OS replaces the palette
and cannot recolour a transparent border, so a recoloured arrow would point at a colour that no
longer exists.

## Accessibility

- `role="dialog"` is emitted for every popover, modal or not. A non-modal surface is still a
  group of content a screen-reader user should be able to enter and leave deliberately.
- `aria-modal` is emitted **only** when `modal` is set. `aria-modal="false"` is noise, and some
  assistive technology treats the mere presence of the attribute as a claim of modality.
- `title` renders a visible heading and `aria-labelledby` points at it, which is better than
  `label` because a sighted user gets the name too. `aria-labelledby` is emitted only when a
  heading actually exists — a dangling reference makes assistive technology fall back to nothing,
  suppressing the `aria-label` as well.
- A nameless surface logs a development warning, since it is announced as "dialog" and nothing
  else.
- Modal surfaces move focus in on open, trap `Tab`, and restore focus on close. Non-modal ones do
  none of that: a non-modal surface that steals focus is unusable for a keyboard, because the
  user is still working in the page.
- The backdrop blocks pointer events for a modal surface. Without it, a click lands on the page
  behind, closes the surface and discards whatever the user was doing.
- A press on the anchor does not count as an outside press. Without that exclusion, pressing a
  trigger while its surface is open closes it on `pointerdown` and the click then reopens it —
  which reads as a surface stuck open.
- Dismissal is caught on `pointerdown` and `keydown` in the capture phase at the document level.
  A handler on the surface only sees presses that _reached_ the surface, so "click outside to
  dismiss" would fail precisely where it matters.
- Nothing is rendered when closed — not a hidden surface. A node with `display: none` or
  `aria-hidden` is still reachable by some assistive technology and still a node for a
  consumer's selector to trip over.

## Gaps

- **Positioning is `position: fixed`.** A surface inside a transformed ancestor will not be
  portalled _into_ that ancestor, so it is positioned against the viewport rather than the
  scroll container. Recorded in `docs/architecture.md` with the portal's other limitation:
  CSS inheritance, including scoped `--uir-*` tokens, does not cross the portal boundary.
- **iOS Safari scroll lock.** `overflow: hidden` on `<html>` is ignored there. Both reference
  libraries share the gap.
- **`autoUpdate` from Floating UI.** The observer set here covers resize, scroll and content
  growth, but not layout shifts from sibling movement without a scroll event. Recorded rather
  than approximated.
