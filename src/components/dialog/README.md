# Dialog

A modal surface that interrupts the page: a confirmation, a form, a message that has to be dealt
with before anything else.

## Reference libraries

| Concern              | Source                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prop decomposition   | `@mui/material/Dialog/Dialog.d.ts` — `DialogProps` (`open`, `role`, `maxWidth`, `fullScreen`, `fullWidth`, `scroll`, `onClose`, `aria-modal`)                        |
| Close reasons        | Same file — `onClose(event, reason)` where reason is `"escapeKeyDown" \| "backdropClick"`                                                                            |
| Behaviour, parts     | `@ui5/webcomponents/dist/Dialog.d.ts` — `headerText`, `state`, `stretch`, `draggable`, `resizable`, `showFullscreenButton`; `@csspart header` / `content` / `footer` |
| Structure            | Same file — "A `ui5-dialog` consists of a header, content, and a footer for action buttons"                                                                          |
| Role derivation      | Same file — `_role` getter: `Negative` / `Critical` become `alertdialog`; `isModal` returns true unconditionally                                                     |
| Modality contract    | `@ui5/webcomponents/dist/Popup.d.ts` — `blockPageScrolling`, `applyInitialFocus`, `resetFocus`, `preventFocusRestore`, `initialFocus`                                |
| Dismissal reason     | Same file — `PopupBeforeCloseEventDetail`'s `escPressed`                                                                                                             |
| Value-state enum     | `@ui5/webcomponents-base/dist/types/ValueState.d.ts` — `None`, `Positive`, `Critical`, `Negative`, `Information`                                                     |
| Region labelling     | `Dialog.d.ts` — `_headerAriaLabel`, `_contentAriaLabel`, `_footerAriaLabel`                                                                                          |
| Phone recommendation | `Dialog.d.ts` — `stretch`: "it's recommended to stretch the dialog to full screen on phone"                                                                          |
| Keyboard / focus     | WAI-ARIA APG Dialog pattern; `useFocusTrap` in `src/internal/focus.ts`                                                                                               |

Versions read from `../referenceUILibraries/package.json`: `@mui/material` 9.4.0,
`@ui5/webcomponents` 2.27.2.

## Props

| Prop                   | Type                                              | Default     | Notes                                            |
| ---------------------- | ------------------------------------------------- | ----------- | ------------------------------------------------ |
| `open`                 | `boolean`                                         | —           | Controlled. Nothing renders when false.          |
| `defaultOpen`          | `boolean`                                         | `false`     | Uncontrolled.                                    |
| `onOpenChange`         | `(open: boolean) => void`                         | —           | Every intended change.                           |
| `onClose`              | `(reason: "escape" \| "backdrop-press") => void`  | —           | Fires on every dismissal request.                |
| `urgency`              | `"normal" \| "alert"`                             | `"normal"`  | `alert` takes `role="alertdialog"`.              |
| `title`                | `ReactNode`                                       | —           | Visible heading; `aria-labelledby` points at it. |
| `label`                | `string`                                          | —           | `aria-label` when there is no `title`.           |
| `tone`                 | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | Visual intent. Separate from `urgency`.          |
| `size`                 | `"sm" \| "md" \| "lg"`                            | `"md"`      | Maximum width.                                   |
| `initialFocus`         | `"auto" \| "container"`                           | `"auto"`    | Where focus lands on open.                       |
| `restoreFocus`         | `boolean`                                         | `true`      |                                                  |
| `closeOnEscape`        | `boolean`                                         | `true`      |                                                  |
| `closeOnBackdropPress` | `boolean`                                         | `true`      |                                                  |
| `header` / `footer`    | `ReactNode`                                       | —           | UI5's `@csspart` regions.                        |
| `showCloseButton`      | `boolean`                                         | `false`     | Labelled from the i18n catalog.                  |
| `closeButtonLabel`     | `string`                                          | i18n        | Overrides the catalog string.                    |
| `className`            | `string`                                          | —           | Merged onto the surface.                         |
| `ref`                  | `Ref<HTMLDivElement>`                             | —           | The surface.                                     |

There is **no `modal` prop**. A dialog is modal by definition, and MUI making `aria-modal`
configurable is a contradiction rather than a feature.

## Reconciled design

| Decision          | UIReload                       | MUI                                  | UI5                     | Why                                                                                 |
| ----------------- | ------------------------------ | ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------- |
| Urgency vs intent | `urgency` **and** `tone`       | `role` + `color` separately          | one `state` for both    | UI5 folds them: `Negative` is both red and assertive whether or not that was meant. |
| Urgency values    | `"normal" \| "alert"`          | `'dialog' \| 'alertdialog'`          | `ValueState` (5 values) | A name that means urgency rather than a colour that means it.                       |
| Modal             | always                         | configurable                         | always                  | A non-modal `dialog` role is a contradiction.                                       |
| Size              | `sm` / `md` / `lg` as a width  | `maxWidth: Breakpoint \| false`      | `stretch` (boolean)     | Shared scale; the ladder is consistent across the family.                           |
| Close reasons     | `"escape" \| "backdrop-press"` | `"escapeKeyDown" \| "backdropClick"` | `escPressed` boolean    | A named reason beats a boolean, and past tense reads as a report of what happened.  |
| Close button      | `showCloseButton`              | — (slots only)                       | `showFullscreenButton`  | A real, named, focusable control rather than a slot-only affordance.                |
| Initial focus     | `initialFocus`                 | —                                    | `initialFocus` (id)     | APG says focus goes where it is most useful, not always to the first control.       |
| Positioning       | CSS, viewport-centred          | `container` + `Paper`                | `_center()`             | A centred dialog needs no measurement. See below.                                   |

### The one real divergence: urgency is not tone

UI5 has a single `state` property carrying `ValueState`, and derives the ARIA role from it
(`_role`: `Negative` and `Critical` become `alertdialog`). That couples two independent decisions
together, and it does so in the most expensive direction: an `alertdialog` is an **assertive live
region**, announced as soon as it appears, interrupting whatever the user was doing. So under UI5's
API there is no way to say "this is a routine positive message" without also saying "interrupt the
user", and no way to say "this is urgent" without also making it red.

Splitting them into `urgency` and `tone` makes both expressible. `urgency="alert"` is the
consequential one, and it is opt-in — a dialog is non-assertive unless a consumer says otherwise.
The `Tones` and `NonUrgentNotice` stories exist to make the difference visible.

The visual is reinforced without relying on hue: `data-urgency="alert"` thickens the border from
1px to 2px, so urgency is a weight change as well as a colour.

### Why `Dialog` does not compose `Popover`

They are different components, not one component with a `centre` placement:

- A dialog has no anchor, no placement, no align, no offset, no arrow.
- It is always modal; a popover is non-modal by default and must stay that way for a dropdown.
- Its dismissal rules are less optional — a dialog that cannot be dismissed with Escape strands a
  keyboard user inside it.

Forcing it into `Popover` would be reuse for its own sake. What _is_ shared is the infrastructure:
`Portal`, `useScrollLock`, `useFocusTrap` and `useDismiss` from `src/internal/overlay.ts` and
`src/internal/focus.ts`. Recorded rather than hidden.

### Rejected, with reasons

- **`fullScreen` (MUI) / `stretch` (UI5) as a prop.** Handled by CSS instead: below 30rem the
  surface is already edge-to-edge, and the radius drops because a rounded corner on a full-bleed
  surface is a lie about its shape. A prop would be a second mechanism for one behaviour.
- **`scroll="body" | "paper"` (MUI).** One behaviour, fixed. The content region scrolls and the
  header and footer do not, because action buttons that scroll away are the reason users cannot
  complete a dialog. `minmax(0, 1fr)` on the content row is what makes it work — a flex item's
  default minimum is its content size, so a long dialog would push the footer off the viewport.
- **`PaperComponent` / `slots` / `slotProps` / `classes`.** Rejected architecture (`AGENTS.md` §4).
- **`transitionDuration` (MUI).** A Material fade. An exit animation would have to outlive
  unmounting, which is how a portalled component leaves a ghost in the DOM.
- **`draggable` and `resizable` (UI5).** Both are real features, and both need their own pointer and
  keyboard contracts — including `Shift`+arrow resizing and a `Tab`-reachable resize handle, which
  UI5 has to special-case in `forwardToLast`. Recorded as gaps rather than half-built.
- **`accessibleRole` (UI5 `Popup`).** Renamed and split into `urgency`, which is the only two values
  the dialog pattern has.
- **`showClearIcon`-style header/footer defaults.** None: the structure is UI5's
  header/content/footer, and the padding is this library's.

## Keyboard

| Key               | Behaviour                                                |
| ----------------- | -------------------------------------------------------- |
| `Tab`             | Cycles inside the dialog. Never reaches the page behind. |
| `Shift+Tab`       | Cycles backwards inside.                                 |
| `Escape`          | Closes, unless `closeOnEscape={false}`.                  |
| `Space` / `Enter` | Activates the focused control, natively.                 |

On open, focus moves to the first tabbable descendant, or to the surface itself when
`initialFocus="container"` or when there is nothing to focus. On close, focus returns to whatever
had it before.

## CSS contract

```
.uir-dialog                  the surface; role=dialog | alertdialog, aria-modal, tabindex=-1
.uir-dialog__backdrop        covers the viewport, blocks pointer events, aria-hidden
.uir-dialog__header          UI5's @csspart header
.uir-dialog__title           the heading, and the aria-labelledby target
.uir-dialog__content         UI5's @csspart content; the only scrolling region
.uir-dialog__footer          UI5's @csspart footer; fixed while the content scrolls
.uir-dialog__close           a real <button>, labelled from the i18n catalog
```

State attributes: `data-size`, `data-tone`, `data-urgency`.

Component-local tokens: `--uir-dialog-width-sm` / `-md` / `-lg`, `--uir-dialog-border`,
`--uir-dialog-ring`, `--uir-dialog-footer`.

Position is CSS rather than measured — `position: fixed` with `inset: 0` and `margin: auto` — because
a viewport-centred dialog has nothing to measure against. Flex centring was rejected: it clamps to
the viewport and pushes the header off the top, so a long dialog ends up with no title and no way to
scroll to it.

## Accessibility

- `role="dialog"` and `aria-modal="true"` always. `role="alertdialog"` when `urgency="alert"`, which
  is what makes assistive technology announce it on appearance rather than on demand.
- `title` renders a visible heading and `aria-labelledby` points at it, which is better than `label`
  because a sighted user gets the name too. `aria-labelledby` is emitted only when a heading exists —
  a dangling reference makes assistive technology fall back to nothing, suppressing the `aria-label`
  as well.
- `tabindex="-1"` on the surface, so it is programmatically focusable without being a tab stop. This
  is what makes `initialFocus="container"` work at all: a `<div>` without it silently refuses
  `focus()`, leaving the user outside the dialog they are supposed to be inside.
- Focus moves in on open, is trapped while open, and returns to the trigger on close.
- `restoreFocus={false}` is the right choice when the trigger was removed, and its test asserts the
  consequence rather than the intent.
- The backdrop is `aria-hidden` and not a focusable element. An unnamed, unlabelled interactive
  element is an axe violation _and_ a tab stop nobody can name; Escape and the backdrop press are the
  dismissal paths.
- The close button is a real `<button>` with a name from the i18n catalog, and is _not_
  `aria-hidden` — a keyboard user with no other route out of the dialog needs it. The glyph inside
  is `aria-hidden`.
- Both `Escape` and a backdrop press are on by default. A dialog that cannot be dismissed with
  Escape strands a keyboard user inside it.
- `forced-colors` is handled explicitly: the backdrop is a translucency the OS replaces, so the
  surface gets an explicit border, because in forced colours the border is the only thing separating
  it from the page.

## Gaps

- **`draggable` / `resizable` (UI5).** Real features needing their own keyboard contracts. See the
  rejected list.
- **Entry and exit animation.** Deliberately absent; see the rejected list.
- **Multiple stacked dialogs.** Supported by the scroll-lock counter, and it is what UI5 advises
  ("each dialog element should be separate in the markup. Avoid nesting dialogs"). Nested markup is
  not tested because both libraries warn against it.
