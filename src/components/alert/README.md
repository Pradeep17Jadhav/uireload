# Alert

A message that stays until it is dealt with. The whole design question is role and urgency agreeing
with each other.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop           | Type                                | Default     | Notes                                      |
| -------------- | ----------------------------------- | ----------- | ------------------------------------------ |
| `children`     | `ReactNode`                         | —           | The message.                               |
| `tone`         | `Tone`                              | `"neutral"` | `danger` derives `role="alert"`.           |
| `variant`      | `"subtle" \| "outlined" \| "solid"` | `"subtle"`  |                                            |
| `title`        | `ReactNode`                         | —           | A real heading.                            |
| `titleLevel`   | `"h2" \| "h3" \| "h4"`              | `"h3"`      |                                            |
| `icon`         | `ReactNode`                         | —           | `aria-hidden`. Replaces the built-in mark. |
| `action`       | `ReactNode`                         | —           | Inside the alert, not beside it.           |
| `urgency`      | `"polite" \| "assertive"`           | derived     | See below.                                 |
| `role`         | `"status" \| "alert"`               | derived     | See below.                                 |
| `dismissible`  | `boolean`                           | `false`     |                                            |
| `dismissLabel` | `string`                            | `"Close"`   |                                            |
| `onDismiss`    | `() => void`                        | —           | Reports; the alert **stays**.              |
| `className`    | `string`                            | —           |                                            |
| `ref`          | `Ref<HTMLDivElement>`               | —           |                                            |

## Role and urgency are the same fact stated twice

An ARIA live region has two independent parts, and they can disagree:

| `role`   | `aria-live` | Announcement                 |
| -------- | ----------- | ---------------------------- |
| `status` | `polite`    | After the current utterance. |
| `alert`  | `assertive` | Immediately, interrupting.   |

The component **derives both from `tone`**: `tone="danger"` becomes `role="alert"` with
`aria-live="assertive"`, and everything else is a polite `status`.

The reason is that reaching for `tone` should get the right announcement without reaching for a second
prop. The one tone that means "this will cost you" is the only one that justifies interrupting a screen
reader mid-sentence, and a consumer who has to remember a second prop to get that is a consumer who
will forget it.

Two props remain, because the derivation has two legitimate exceptions, and a combination that
contradicts the derivation **warns in development** and names the case:

- `urgency="polite"` on a `danger` tone — a form that re-announces on every keystroke.
- `role="alert"` on a `positive` tone — a genuinely urgent success, rare but real.

`role="alert"` + `urgency="assertive"` is the consistent form and warns about nothing.

## `aria-atomic="true"`

Without it, replacing "3 items failed" with "3 items failed, 1 recovered" announces **"1 recovered"
with no context at all** — the user is told something changed and not what.

## `onDismiss` reports; the alert stays

```tsx
<Alert dismissible onDismiss={() => setMessages([])}>
  …
</Alert>
```

The component never removes itself. An alert that dismisses itself is a message the user can lose, and
an alert is almost always information they need to still have — a declined card, a failed import, a
conflict. The consumer owns the list, exactly as with `Chip`'s `onRemove`.

## The consumer's handler runs first, and can veto the dismissal

The dismiss control composes the root's `onClick` rather than leaving it to bubble, and calls
`preventDefault()` to opt out — the library-wide rule. So:

```tsx
<Alert dismissible onClick={(e) => e.preventDefault()} onDismiss={close}>
```

closes nothing. The handler runs **before** the dismissal, which is the only order in which
`preventDefault()` means anything.

Propagation is stopped so the handler runs exactly once rather than once here and again on the way up.

## The title is a real heading

```html
<h3 class="uir-alert__title">Payment failed</h3>
```

A bold `<div>` is not in a screen reader's heading list, and the heading list is how a user skips past
this to the content they came for.

`h3` is the default so an alert does not outrank the section it sits in. `titleLevel` exists for a
page whose outline starts higher.

## The action is inside the alert

A button beside the alert rather than in it is a button the user meets before knowing what it acts on.
Inside, the two are one thing to a screen reader moving through the page.

## Reconciled design

| Decision          | Choice              | Why                                                                |
| ----------------- | ------------------- | ------------------------------------------------------------------ |
| Role              | derived from `tone` | Reaching for `tone` should get the right announcement.             |
| `danger`          | `role="alert"`      | The only tone that justifies interrupting.                         |
| Other tones       | `role="status"`     | Interrupting a screen reader to say "saved" is absurd.             |
| `aria-atomic`     | always              | Otherwise a replacement is announced with no context.              |
| Self-dismissal    | never               | An alert is information the user needs to still have.              |
| Dismiss ordering  | consumer first      | `preventDefault()` must run before the dismissal to mean anything. |
| Title             | a real heading      | Otherwise it is not in the heading list.                           |
| Title level       | `h3` default        | An alert should not outrank its section.                           |
| Action placement  | inside the alert    | A button met before its subject is a button with no context.       |
| Glyph             | `aria-hidden`       | A mark beside text that says the same thing is decoration.         |
| No `warning` tone | absent              | A tone must change what the user should _do_; `accent` covers it.  |

## Keyboard

| Key     | Behaviour                                                 |
| ------- | --------------------------------------------------------- |
| `Tab`   | Reaches the dismiss control and the action, in DOM order. |
| `Space` | Activates whichever control has focus. Native.            |
| `Enter` | Activates whichever control has focus. Native.            |

The alert itself is **not** focusable and takes no focus. It is a region, not a dialog: the content
inside it is reachable by tabbing from wherever the user already was, which is what lets a user read
past it.

## CSS contract

```
.uir-alert               the root; data-tone, data-variant,
                         data-urgency, data-has-title,
                         data-has-action, data-dismissible
.uir-alert__icon         a custom icon; aria-hidden
.uir-alert__glyph        the built-in tone mark; aria-hidden
.uir-alert__title        the heading
.uir-alert__message      the body
.uir-alert__action       the action area
.uir-alert__dismiss      the dismiss control
.uir-alert__dismiss-glyph  the cross, drawn from two borders
```

Component-local tokens: `--uir-alert-fill`, `--uir-alert-border`, `--uir-alert-text`,
`--uir-alert-icon`, `--uir-alert-radius`, `--uir-alert-gutter`.

The glyphs are drawn from rotated borders rather than imported SVGs, so they are `currentColor` in
every scheme and in forced colours with nothing to keep in step. Tone is carried by an edge bar as well
as by colour, so the meaning does not depend on hue alone.

`solid` is the loud variant and is for the one thing that is actually wrong: a page of solid alerts is a
page of stop signs, and a stop sign that is always there is a decoration.

## Accessibility

- `role="status"` with `aria-live="polite"`, or `role="alert"` with `aria-live="assertive"`, derived
  from `tone` and overridable — with a development warning on a contradictory pair.
- `aria-atomic="true"` so a replacement is read whole.
- The title is a real heading at a configurable level, defaulting to `h3`.
- The icon and the built-in glyph are `aria-hidden`.
- The dismiss control is a real `<button>` with a name, `dismissLabel` settable for a page with
  several alerts — "Close" alone in a list of six announces six identical buttons.
- `forced-colors` restates the fill as `Canvas`, the border as `CanvasText` and the tone as a border
  width plus `CanvasText`, because a custom tone fill is not a colour the system palette knows and
  "this is an error" would otherwise be conveyed by hue alone.

## Gaps

- **A `title` attribute.** Not implemented, and not the same word as `title`: the browser tooltip over
  an alert would duplicate the message a screen reader is already being given.
- **Stacking several alerts.** Nothing here coordinates a queue. Two alerts mounted at once are two
  live regions, and whether the second should wait for the first to be read is a product decision.
- **`Snackbar` for transient messages.** Deliberately a different component. `Snackbar` times out and
  reports why it closed; this one never closes itself. Reaching for the wrong one of the two is the
  mistake this note exists to prevent.
- **An `onDismiss` reason.** `Dialog`, `Popover`, `Snackbar` and `Drawer` all report _why_ they were
  dismissed. A single alert's dismiss button has exactly one reason, so a reason parameter would be a
  parameter with one legal value.
