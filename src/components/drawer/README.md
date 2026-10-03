# Drawer

A panel that slides in from an edge. The whole design question is whether it traps you.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop                     | Type                                                             | Default          | Notes                       |
| ------------------------ | ---------------------------------------------------------------- | ---------------- | --------------------------- |
| `children`               | `ReactNode`                                                      | —                |                             |
| `open`                   | `boolean`                                                        | `false`          | Controlled when set.        |
| `defaultOpen`            | `boolean`                                                        | `false`          | Uncontrolled initial state. |
| `onClose`                | `(reason: DrawerCloseReason) => void`                            | —                | **The request.**            |
| `onDismiss`              | `(reason: DrawerCloseReason) => void`                            | —                | **The fact.**               |
| `placement`              | `"inline-start" \| "inline-end" \| "block-start" \| "block-end"` | `"inline-start"` | Logical.                    |
| `modal`                  | `boolean`                                                        | **`false`**      | Focus trap and scroll lock. |
| `size`                   | `string`                                                         | `20rem`          | Inline for a side drawer.   |
| `title`                  | `ReactNode`                                                      | —                | A real `<h2>`.              |
| `showClose`              | `boolean`                                                        | `true`           |                             |
| `closeLabel`             | `string`                                                         | `"Close"`        |                             |
| `header`                 | `ReactNode`                                                      | —                | Pinned above the title bar. |
| `footer`                 | `ReactNode`                                                      | —                | Pinned below the body.      |
| `dismissOnBackdropClick` | `boolean`                                                        | `true`           | Only when `modal`.          |
| `disabled`               | `boolean`                                                        | `false`          | Appearance.                 |
| `initialFocus`           | `"first" \| "container" \| "none"`                               | `"first"`        | See below.                  |
| `className`              | `string`                                                         | —                | Merged onto the **panel**.  |
| `style`                  | `CSSProperties`                                                  | —                | Merged onto the **panel**.  |
| `ref`                    | `Ref<HTMLDivElement>`                                            | —                | The **panel**.              |

## `modal` defaults to `false`, and that is the component's most consequential decision

Modal is a focus trap and a scroll lock. Both are real costs to impose on a page, and for the most
common drawer there is none — a navigation drawer.

**A navigation drawer that traps focus is worse than one that does not**, because the user cannot reach
the navigation item they opened it to change. They open the drawer to go somewhere else, and the
drawer will not let them leave.

`modal` is for the case that genuinely needs it: a destructive confirmation panel, or a filter panel
that must be finished with before anything else happens.

### What each mode does about focus

|                       | `modal`              | not `modal`                  |
| --------------------- | -------------------- | ---------------------------- |
| `aria-modal`          | `true`               | absent                       |
| Focus trap            | yes                  | no                           |
| Scroll locked         | yes                  | no                           |
| Backdrop              | rendered             | none — the page stays usable |
| Focus on open         | the trap's choice    | the panel, so you can get in |
| Focus on close        | restored by the trap | restored                     |
| `Tab` past the drawer | no                   | yes                          |

`aria-modal` is a promise about **the rest of the page**, and this component only makes it when it has
trapped focus and locked scrolling to keep it. A non-modal drawer is still a `dialog` — it has a name,
it can contain anything, and `dialog` is what tells a screen reader it is a region to read rather than
a part of the page flow.

### Why focus moves even when it does not trap

Without it, `Tab` from the page goes to the next page element and a keyboard user can **never get
inside** a drawer that has opened over the content they were reading. This is the case that gets
skipped, and it is the reason a non-modal drawer is often unreachable.

It is done in a **callback ref**, not an effect, because `Portal` renders `null` on its first pass so
the server and client markup match — which means the panel ref is still empty when every layout effect
on mount runs. An effect keyed on `[modal, open]` would fire once against an empty ref and never fire
again.

## `onClose` is the request, `onDismiss` is the fact

```tsx
<Drawer open={open} onClose={setOpenFalse} onDismiss={logWhy}>
  …
</Drawer>
```

| Reason           | Cause                                         |
| ---------------- | --------------------------------------------- |
| `"escape"`       | the Escape key                                |
| `"dismiss"`      | the close control, or a press on the backdrop |
| `"programmatic"` | the consumer closing it from outside          |

A user dismissing a drawer and a consumer resetting it are different facts, and a consumer that cannot
tell them apart will undo its own navigation. `Dialog`, `Popover` and `Snackbar` all report reasons
for the same reason.

A **controlled** drawer does not close itself. React is the source of truth; the component reports and
the consumer decides.

Both fire for one dismissal. `onClose` is what you act on; `onDismiss` is for logging and for work that
must happen regardless of who decided.

## `placement` is logical, not physical

`inline-start` is the reading direction's leading edge, so the whole set mirrors in RTL without a
second prop. A drawer pinned to the physical `left` in an RTL page is on the wrong side of the reading
flow — the consumer has to think about direction to place a navigation drawer, which is exactly what
logical properties exist to stop.

`size` is applied as `inline-size` for an inline drawer and `block-size` for a block one, so one prop
covers both axes.

## Closed means unmounted

```tsx
if (!open) return null;
```

A drawer that is always in the DOM and merely `hidden` puts a `role="dialog"` and an `aria-modal` in the
accessibility tree for a panel nobody is looking at.

This is the **opposite** of what `Tooltip` does with its surface, and deliberately: a tooltip's
description is read as part of the trigger's name, so the element has to exist first (see
`Tooltip`'s README). A dialog's existence is announced the moment it appears, so announcing a dialog
that is not there is worse than announcing nothing.

## Reconciled design

| Decision              | Choice                    | Why                                                              |
| --------------------- | ------------------------- | ---------------------------------------------------------------- |
| `modal` default       | `false`                   | A navigation drawer that traps focus is unusable.                |
| Role                  | `dialog`, always          | It is a named region to read, modal or not.                      |
| `aria-modal`          | only when `modal`         | A promise about the rest of the page, kept only when kept.       |
| Focus on open         | the panel, when not modal | Otherwise `Tab` never gets inside.                               |
| Focus mechanism       | a callback ref            | `Portal`'s first pass renders nothing for an effect to find.     |
| Closed                | unmounted                 | An unannounced dialog in the tree is worse than none.            |
| Placement             | logical                   | Mirrors in RTL without a second prop.                            |
| `onClose`/`onDismiss` | both, with a reason       | A dismissal and a reset are different facts.                     |
| Controlled            | never self-closes         | React is the source of truth.                                    |
| Title level           | fixed `h2`                | One heading level in the component beats a prop per caller.      |
| `size`                | a prop, not a token       | 16rem for navigation, 28rem for filters; a token cannot be both. |
| No animation          | —                         | A panel that slides over content makes the user wait for it.     |

## Keyboard

| Key      | Behaviour                                                    |
| -------- | ------------------------------------------------------------ |
| `Tab`    | Cycles inside when `modal`; moves past the panel when not.   |
| `Escape` | `onClose("escape")`. Composed — `preventDefault()` opts out. |
| `Enter`  | The platform's, for whatever control has focus.              |

Escape is handled on the panel rather than on `document`, so a consumer's own `onKeyDown` can
`preventDefault()` to keep the drawer open — the library-wide rule, and the only order in which
`preventDefault()` means anything.

## CSS contract

```
.uir-drawer               the panel; data-placement, data-modal,
                          data-vertical, data-disabled
.uir-drawer__backdrop     the scrim; aria-hidden; modal only
.uir-drawer__header       pinned above the title bar
.uir-drawer__titlebar     grid: title and close
.uir-drawer__title        the <h2>
.uir-drawer__body         the only scrolling part
.uir-drawer__footer       pinned below the body
.uir-drawer__close        the dismiss control
.uir-drawer__close-glyph  the cross, drawn from two borders
```

Component-local tokens: `--uir-drawer-size`, `--uir-drawer-fill`, `--uir-drawer-backdrop`,
`--uir-drawer-pad`, `--uir-drawer-close-hover`, `--uir-drawer-close-active`.

The panel is `display: flex` with `flex: 1; min-block-size: 0; overflow-y: auto` on the body — the
`min-block-size: 0` is load-bearing, because without it a flex item refuses to shrink below its content
and the drawer grows past the viewport instead of its body scrolling inside it.

The separator is a **border on the edge the drawer came from**, not a shadow on all sides: a panel
flush to the viewport edge has no outside for a shadow to fall on.

The close control is sized to the **control height**, not to its cross. A close control sized to a 12px
glyph is a control users aim at in a hurry while something is overlaying their page.

The panel does not animate. A drawer that slides in over the content the user is reading makes them
wait for it, and a `prefers-reduced-motion` user should not be the only one for whom that is true.

## Accessibility

- `role="dialog"`, `aria-modal` only when modal, named by `title` through `aria-labelledby` or by the
  root's `aria-label`.
- `tabIndex={-1}` on the panel: programmatically focusable without adding a tab stop for its contents.
- The backdrop is `aria-hidden`. `aria-modal` already says the rest of the page is unavailable, and a
  backdrop in the tree is a focusable stop that goes nowhere.
- A controlled drawer never closes itself.
- `initialFocus="container"` is available for a drawer whose first tabbable descendant is the close
  control — otherwise the user opens the drawer and their first action is to close it.
- `forced-colors` restates the scrim as `Canvas` at partial opacity, because
  `rgb(15 23 42 / 45%)` is not a colour the system palette knows and `Canvas` at an opacity is the
  closest expressible thing. The modal state is additionally carried by the panel's border width, so
  the scrim is never the only signal.

## Gaps

- **A `title`.** Not implemented; `title` is the drawer's heading and the browser tooltip would
  duplicate it.
- **`variant: permanent | persistent | temporary`.** The reference APIs split a drawer into three by
  whether it is permanently in the layout, in the layout but hideable, or an overlay. Here `modal`
  covers the overlay case and a `permanent` drawer is a `Tile` or a `Tile`-grid column — a layout
  decision that a fixed-overlay component should not make. Three names for two behaviours would be
  worse than one honest prop.
- **A slide-in animation.** Not implemented at all, deliberately, for the reason above. A consumer who
  needs one can add it with `transition` on their own wrapper; adding it here would mean shipping
  motion that `prefers-reduced-motion` has to undo correctly.
- **Nested drawers.** A second `Drawer` while one is open produces two `role="dialog"` elements and two
  focus traps. Nothing coordinates them, and the right behaviour is a product decision.
