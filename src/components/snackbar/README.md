# Snackbar

A transient message, portalled to the viewport, in a live region.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop                    | Type                                              | Default        | Notes                                 |
| ----------------------- | ------------------------------------------------- | -------------- | ------------------------------------- |
| `children`              | `ReactNode`                                       | —              | The message.                          |
| `open`                  | `boolean`                                         | —              | Controlled.                           |
| `defaultOpen`           | `boolean`                                         | `false`        | Uncontrolled, mount only.             |
| `onClose`               | `(reason: SnackbarCloseReason) => void`           | —              | The **request**.                      |
| `onDismiss`             | `(reason: SnackbarCloseReason) => void`           | —              | The **fact**. Fires for every close.  |
| `duration`              | `number \| null`                                  | `7000`         | Floored at 5000. `null` never closes. |
| `placement`             | `"top-\|bottom-" + "start\|center\|end"`          | `"bottom-end"` | Logical.                              |
| `tone`                  | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"`    | Glyph and border only.                |
| `showClose`             | `boolean`                                         | `true`         |                                       |
| `closeLabel`            | `string`                                          | `"Close"`      |                                       |
| `dismissOnClickOutside` | `boolean`                                         | `false`        |                                       |
| `pauseOnHover`          | `boolean`                                         | `true`         | Also pauses on focus.                 |
| `live`                  | `"off" \| "polite" \| "assertive"`                | `"polite"`     |                                       |
| `action`                | `ReactNode`                                       | —              |                                       |
| `icon`                  | `ReactNode`                                       | —              | Decorative.                           |
| `className`             | `string`                                          | —              |                                       |
| `ref`                   | `Ref<HTMLDivElement>`                             | —              | The live region.                      |

## Two things carry the whole design

Both are about not losing the user's place.

### The timer pauses

While the pointer is over it, or focus is inside it, the countdown stops — and resumes with the time
that was **left**, not a fresh full duration.

A countdown that keeps running while someone is reading the message, or has tabbed into its action,
removes the thing they were interacting with. The second case is the worse one, because a focused
element vanishing takes the user's place with it.

`focus` / `blur` bubble, so tabbing into the action pauses through the same pair as the pointer. That
is the case the pause exists for.

The remaining time is measured from when the timer started, not counted in ticks, so a countdown
throttled by a background tab resumes from where it actually was.

### The close reason is reported

`"timeout" | "dismiss" | "escape"`. A timed-out message and a dismissed one want different
responses, and a consumer that cannot tell them apart gets the behaviour wrong in a way that is very
hard to see.

Two callbacks, both always:

- `onClose(reason)` is the **request**. In controlled mode the component acts on nothing and the
  consumer decides.
- `onDismiss(reason)` is the **fact**. It fires for every close regardless of mode, from one place, so
  it cannot be missed by a reason added later.

`requestClose` is idempotent: a timer expiring and Escape landing in the same tick calls it once. A
consumer that enqueues an undo on `onClose` would otherwise offer it twice.

## The live region exists before its content

`aria-live` is on the element from the **first render**, and a closed snackbar is
`visibility: hidden` rather than unmounted.

A live region created at the same moment as its text is frequently **not announced at all**:
assistive technology observes changes inside a region it already knows about, and a region that did
not exist a moment ago has nothing to observe. Removing the element and adding it back is a new region,
which is exactly the thing that loses the message.

This is the single most common way a toast message is silently dropped.

## The duration floor is 5000ms

Whatever is passed below that is raised. Below 5s a message is more likely to disappear while it is
being read than to have been read, and the failure is invisible to whoever set the timer.

`duration={null}` never closes on a timer, which is the right setting for anything the user must act
on.

## Dismiss-on-click-away is off by default

It is a convenience on a message with no controls and a hazard on one with them: a stray click on a
message carrying a button throws away what the user was reaching for. There is a close control for the
case where dismissing is wanted.

## A dark, opaque surface for every tone

A message appears over whatever the user is doing, so its own background has to work over an arbitrary
one. A tinted fill cannot promise contrast against unknown content; a dark opaque surface can promise
it against everything. The tone is carried by the glyph and the border, not the fill.

`--uir-snackbar-surface` is deliberately **not** a scheme token — it is the same in light and dark,
because a message that changes colour with the theme is a message that changes contrast with whatever
it covers.

## Portalled

Not for z-index — `position: fixed` handles that. It is so a snackbar rendered inside a container with
`overflow: hidden` or a stacking context is still fully visible, and so a `transform` on an ancestor
does not become the containing block for something meant to be pinned to the viewport. A transient
message is a property of the page, not of the subtree that happened to trigger it.

## Reconciled design

| Decision           | Choice                               | Why                                                                        |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------- |
| Timer              | pauses on hover **and focus**        | A countdown aimed at the control the user is reaching for.                 |
| Pause resume       | from the time that was left          | A fresh full duration is a message that hides longer every hover.          |
| Close              | `onClose` request + `onDismiss` fact | Controlled and uncontrolled both need a reliable signal.                   |
| `requestClose`     | idempotent                           | A timer and a key in one tick must not offer two undos.                    |
| Duration           | floored at 5000                      | Below that, the message is more likely unread than read.                   |
| Live region        | present from the first render        | A region born with its text is frequently not announced.                   |
| Closed             | `visibility: hidden`, not unmounted  | See above.                                                                 |
| Surface            | dark and opaque for every tone       | It has to work over content it cannot see.                                 |
| Click-away         | off by default                       | A hazard on a message carrying a button.                                   |
| Placement          | logical                              | `bottom-end` is the reading direction's trailing edge.                     |
| Escape             | on the root, not on `document`       | Must not steal Escape from a dialog behind it.                             |
| `onClick` on close | composed, consumer-first             | The consumer's handler runs first and can veto the dismissal.              |
| Portalled          | to the end of the body               | `overflow: hidden` and `transform` on an ancestor both trap a fixed child. |

## Keyboard

| Key      | Behaviour                                                            |
| -------- | -------------------------------------------------------------------- |
| `Escape` | Dismisses. Handled on the root, so a dialog behind keeps its own.    |
| `Tab`    | Moves into and out of the message and its action, pausing the timer. |

## CSS contract

```
.uir-snackbar             the root and the live region; data-placement, data-tone, data-live,
                          data-open, data-paused, data-has-action
.uir-snackbar__icon       a custom leading adornment; aria-hidden
.uir-snackbar__glyph      the tone marker; aria-hidden
.uir-snackbar__message    the text
.uir-snackbar__action     the trailing action
.uir-snackbar__close      the close control
.uir-snackbar__close-glyph the cross, drawn from two rotated borders
```

Component-local tokens: `--uir-snackbar-surface`, `--uir-snackbar-surface-text`,
`--uir-snackbar-fill`, `--uir-snackbar-text`, `--uir-snackbar-border`, `--uir-snackbar-accent`,
`--uir-snackbar-close-hover`, `--uir-snackbar-close-active`, `--uir-snackbar-pad`,
`--uir-snackbar-gap`.

`[data-placement^="top-"]` / `[data-placement$="-start"]` attribute selectors rather than nine `inset`
rules, so every placement is one declaration and the whole set mirrors in RTL without a second rule.

Hover styling is applied to the close control **only**. Hovering the message must not change it: a
surface that shifts under text while the pointer crosses it is text the user cannot read.

## Accessibility

- A live region present from the first render, `aria-atomic` so the whole message is read rather than
  the diff.
- `assertive` is opt-in: it interrupts whatever is being read, which is right for an error and wrong for
  everything else.
- The glyph and any custom icon are `aria-hidden`; the tone is not something a screen reader can
  usefully relay and the message text already carries the meaning.
- The close control is a real `<button>` with an `aria-label`, sized to the 24px target minimum — a
  close control sized to its glyph is about 12px on a control users aim at in a hurry.
- No entrance animation. A moving live region is announced while it moves, and a sliding toast reads as
  arriving late even when it is not.
- `forced-colors`: an arbitrary dark fill is almost certainly not a colour the theme knows, so the
  surface goes to `Canvas` / `CanvasText` and the tone moves entirely to the border and the glyph.

## Gaps

- **A queue.** Only one snackbar at a time. Three at once is three live regions competing, and
  deciding which to show is a policy question — FIFO, by severity, deduplicated — that belongs to the
  application.
- **A undo stack.** `onDismiss(reason)` gives you everything needed to build one; the component does
  not, because an undo stack has opinions about how long an undo stays available that are not the
  component's to hold.
- **Stacking against a portal.** `z-index: var(--uir-z-index-overlay)`, the same as `Popover` and
  `Dialog`. A snackbar and a dialog open at once will collide, and the right ordering depends on which
  one caused the other.
- **Swipe to dismiss.** Not implemented. It is a touch gesture with no keyboard equivalent, and a
  message whose only dismissal gesture needs a finger is a message some users cannot dismiss.
- **`onTransitionEnd`.** No exit animation, so there is nothing to await. A consumer animating the
  element out themselves has to know that.
