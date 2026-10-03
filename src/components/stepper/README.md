# Stepper

A progress strip for a sequence. The whole design question is which steps are buttons.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice —
is recorded in `docs/references.md`, which is not published.

## Props

| Prop               | Type                                           | Default        | Notes                                        |
| ------------------ | ---------------------------------------------- | -------------- | -------------------------------------------- |
| `steps`            | `StepperStep[]`                                | —              | **Required.**                                |
| `active`           | `number`                                       | `0`            | Zero-based. Clamped.                         |
| `onStepChange`     | `(index: number) => void`                      | —              | The component never moves.                   |
| `navigation`       | `"linear" \| "non-linear"`                     | `"linear"`     |                                              |
| `orientation`      | `"horizontal" \| "vertical"`                   | `"horizontal"` |                                              |
| `labelPlacement`   | `"inline-end" \| "block-start" \| "block-end"` | `"inline-end"` | Where the label sits relative to its marker. |
| `showContent`      | `boolean`                                      | `false`        |                                              |
| `children`         | `ReactNode`                                    | —              | Rendered when `showContent`.                 |
| `announcePosition` | `boolean`                                      | `true`         |                                              |
| `stepLabel`        | `string`                                       | `"Step"`       |                                              |
| `label`            | `string`                                       | —              | Name for the whole strip.                    |
| `disabled`         | `boolean`                                      | `false`        | A flag, not an attribute.                    |
| `className`        | `string`                                       | —              |                                              |
| `ref`              | `Ref<HTMLDivElement>`                          | —              |                                              |

### `StepperStep`

| Field         | Type        | Notes                                              |
| ------------- | ----------- | -------------------------------------------------- |
| `label`       | `ReactNode` | Announced, so plain text is the safe choice.       |
| `id`          | `string`    | React's key.                                       |
| `description` | `ReactNode` |                                                    |
| `optional`    | `boolean`   |                                                    |
| `disabled`    | `boolean`   | A step that cannot be entered.                     |
| `tone`        | `Tone`      | Advisory intent, e.g. `danger` for an error state. |
| `errorText`   | `string`    | `aria-describedby`-ed onto the step's header.      |

## `linear` makes the steps **behind** you buttons and the steps ahead text

This is the component's whole design, and it is easy to get backwards.

```tsx
<Stepper steps={STEPS} active={2} navigation="linear" />
```

```
[Account]  [Profile]  ③ Billing   Review
 button     button     div, current  div
```

Going **back** is allowed. A wizard you cannot return to in order to fix the address you typed two
steps ago is a wizard people abandon. Jumping **ahead** is not, because arriving there is the wizard's
decision rather than the user's.

`navigation="non-linear"` makes every step the user has not reached a button, forward ones included —
right when nothing before the current step has to be filled in first.

### The current step's header is always a `<div>`

Activating the current step would report a move that did not happen. So it is not a control, in either
mode.

Which brings up the bug this shape invites, and which the tests exist to prevent: **an implementation
that puts `aria-current` on the button emits it in exactly the case where there is no button.** In the
default mode the current step has no button, so the one thing the component communicates would vanish
precisely where it matters most. `aria-current` goes on whichever element the step is.

### Tab stops are exactly the reachable steps

Not "every step", not "one stop for the whole strip" — the steps a user can actually move to. `Tab`
reaches step 1, then step 2, then moves past the strip. That falls out of the `<div>`-for-unreachable
rule rather than needing a roving tabindex, and it is why there is no arrow-key handling: each step is
a genuine destination with its own name, not a cursor moving within one widget. The same reasoning as
`Pagination`.

### Unreachable steps are `<div>`, not disabled buttons

A disabled button is still announced as **"unavailable"**, which claims the step _cannot_ be entered —
true — while also telling the user it is a control, which is false. A `<div>` says neither, and `Tab`
skips it.

## The strip is an `<ol>`

The steps are an ordered sequence, and "list, 4 items" before each one is information — it is the
difference between "step 2 of 4" read as an isolated fragment and read as the second of four things.

## The status region

```html
<span role="status" aria-live="polite">Step 3 of 4</span>
```

Advancing through a wizard with no announcement is the experience of pressing next and hearing nothing
happen.

Always present when enabled, never conditionally mounted, for the reason `Snackbar` documents:
assistive technology observes changes inside a region it already knows about.

Composed through `formatMessage` with a `{total}` placeholder, because "Step 3 of 4" in English is not
"Schritt 3 von 4" in German.

The `role="status"` region does **not** carry the current step's label — the step's own header does,
through `aria-label="Step 3: Billing"`. A user pressing the header hears which step it is; a user
tabbing past hears where they are.

## Errors are described, not just coloured

```html
<button aria-label="Step 3: Billing" aria-describedby="…-error-2">
  …
  <span id="…-error-2">Card number is invalid</span>
</button>
```

A step in an error state that a screen reader cannot hear about is an error a screen reader user cannot
fix, which is the one failure a wizard cannot afford.

The ids are per-instance, from `useId()`. A **collided** id points `aria-describedby` at the _other_
stepper's error and announces the wrong step's failure — which is exactly the bug a shared counter
would produce on a page with two steppers.

An unreachable step's error is still rendered and still readable, in the markup and on screen. The step
cannot be entered, but the reason it is stuck is exactly what the user needs to know.

## The component never moves itself

A stepper that advances on its own is a wizard that has decided the user is finished, and "finished" is
the one judgement this component has no basis to make. `onStepChange` reports; `active` is fully
controlled.

Going **back** un-completes everything after the current step — the strip describes where the user is,
not what they have submitted.

## `labelPlacement`, and the connector never crossing the label

Three values, all logical:

| `labelPlacement` | Layout                  | Use when                           |
| ---------------- | ----------------------- | ---------------------------------- |
| `"block-start"`  | label above its marker  | A horizontal strip. The default.   |
| `"block-end"`    | label below its marker  | A strip read downward.             |
| `"inline-end"`   | label beside its marker | A narrow column; a vertical strip. |

**The default resolves per orientation**: `block-start` for horizontal, `inline-end` for vertical.
The same resolution `TabBar` uses for `activation` — a prop whose meaning flips with the orientation is
worse than one that resolves to the right thing.

### Why a horizontal strip cannot default to a label beside its marker

It is **geometry**, not taste. With the label on the inline side of its marker, the label sits
_between_ this marker and the next one:

```
(marker)──(label)────────(next marker)
```

A continuous line from marker to marker therefore has **no route that avoids the text**. Giving the
label a row of its own is what makes a horizontal strip able to carry a proper sequence line at all.

`inline-end` is still available, and its connector is confined to the **gap between** steps — a short
segment that joins each step to the next without touching a word. Choose it for a narrow column where a
label beside its marker is the only shape that fits, and accept the segmented line.

### The connector's vertical position is placement-specific

The line has to land on the **marker's centre**, and the marker is not always the item's first row:

| Placement                 | Marker's row | Connector's `inset-block-start` |
| ------------------------- | ------------ | ------------------------------- |
| `inline-end`, `block-end` | first        | `calc(marker / 2)`              |
| `block-start`             | **last**     | `calc(100% - marker / 2)`       |

One `marker/2` for all three is only right when the marker comes first — and with the label above it,
the line landed in the label's row. Both values are exact for any label height, which is why they are
expressed rather than tuned to one label.

`block-start` and `block-end` differ by one `order` declaration on the **text**, not on the marker: the
prop names the _label's_ position. The **DOM** order stays marker-then-text in all three, because that is
the order a screen reader reads and it stays the useful one whichever way the label is drawn.

## Reconciled design

| Decision         | Choice                            | Why                                                         |
| ---------------- | --------------------------------- | ----------------------------------------------------------- |
| `navigation`     | `linear`, backwards only          | A wizard you cannot go back in is a wizard people abandon.  |
| Current header   | always a `<div>`                  | Activating it reports a move that did not happen.           |
| `aria-current`   | on whichever element the step is  | Otherwise it vanishes in the default, button-free mode.     |
| Unreachable step | `<div>`, not `disabled`           | "Unavailable" also claims it is a control.                  |
| Tab stops        | exactly the reachable steps       | Falls out of the above; no roving tabindex needed.          |
| Markers          | entirely `aria-hidden`            | "A circle with a tick" says nothing about where you are.    |
| Strip            | `<ol>`                            | "4 items" is information.                                   |
| Position         | a live region, always present     | Pressing next and hearing nothing is the failure.           |
| Errors           | `aria-describedby`                | An unheard error cannot be fixed.                           |
| Error ids        | per-instance, from `useId()`      | A collided id announces the wrong step's failure.           |
| Self-advance     | never                             | "Finished" is not this component's judgement to make.       |
| `disabled`       | a flag, not an attribute          | A disabled attribute removes the wizard from the tab order. |
| Marker tone      | a ring, not a fill                | A red fill reads as "you are here".                         |
| Label level      | none — the label is not a heading | A heading per step is 4 headings in a screen reader's list. |
| Connector        | equal grid columns                | Flex-to-content columns make the connectors uneven.         |

## Keyboard

| Key     | Behaviour                                                        |
| ------- | ---------------------------------------------------------------- |
| `Tab`   | Reaches each reachable step in order, then moves past the strip. |
| `Space` | Activates the focused step. Native.                              |
| `Enter` | Activates the focused step. Native.                              |

There is **no arrow-key navigation and no roving tabindex**, for the reason `Pagination` gives: each
step is a genuine destination with its own accessible name, not a cursor within one widget. A user who
cannot see the strip should be able to tab along it and hear "Step 1: Account", "Step 2: Profile" to
find where they are.

## CSS contract

```
.uir-stepper            the root; data-orientation, data-navigation,
                        data-label-placement, data-disabled, data-has-content
.uir-stepper__strip     the <ol>
.uir-stepper__item      an <li>; draws the connector on :not(:first-child)
.uir-stepper__step      the header, a <div> or a <button>
.uir-stepper__marker    the circle; data-state, aria-hidden
.uir-stepper__number    the digit
.uir-stepper__tick      the completed mark, drawn from two borders
.uir-stepper__text      the label and description
.uir-stepper__label
.uir-stepper__description
.uir-stepper__optional  a dashed ring, aria-hidden
.uir-stepper__error     the described error text
.uir-stepper__content   rendered when showContent
.uir-stepper__status    the live region; visually hidden
```

Per step: `data-state` (`completed` / `current` / `upcoming`), `data-optional`, `data-tone`,
`data-actionable`.

Component-local tokens: `--uir-stepper-marker`, `--uir-stepper-gap`, `--uir-stepper-marker-fill`,
`--uir-stepper-marker-border`, `--uir-stepper-marker-text`, `--uir-stepper-marker-text-muted`,
`--uir-stepper-label`, `--uir-stepper-connector`.

The strip is a **grid with one equal column per step**, not a flex row sized to content. Equal columns
are what makes the connectors line up: a content-sized row gives each step a different width, so the
line between 1 and 2 is never the same length as the one between 4 and 5, and the strip visibly fails
to be a sequence.

The connector is a `::before` on every item but the first, positioned with `inset-inline-*` so it
mirrors in RTL with no second rule. `:not(:first-child)` rather than a class, because the DOM already
answers "which is first" and a class saying so would be a second source of truth.

`vertical` reuses the same grid with `grid-auto-flow: row`, so nothing about the markup changes
between orientations.

`text-wrap: balance` on the label rather than truncation: a stepper label that wraps to three ragged
lines makes the strip unreadable, and truncating it hides _which_ step it is.

## Accessibility

- An `<ol>`, so the sequence is announced as a sequence.
- `aria-current="step"` on the current step only — never `aria-selected` or `aria-pressed`.
- `aria-label="Step 3: Billing"` on actionable headers, from the visible label rather than
  `aria-current`, because the label is what the user is reading. A `ReactNode` has no string form and
  `String(node)` is `"[object Object]"`, a worse name than none, so a node label falls back to the
  number alone.
- `aria-describedby` onto `errorText` where there is one, with per-instance ids.
- A `role="status"` live region reading "Step 3 of 4", always present.
- Markers and the optional ring `aria-hidden`.
- Unreachable steps are not focusable, so `Tab` never lands on something inert.
- `disabled` removes every button rather than marking them unavailable, so a keyboard user still reads
  the whole wizard — the one thing a disabled form should never prevent.
- `forced-colors` restates completed and current markers as `Highlight` / `HighlightText` and the
  connector as `CanvasText`, because a custom accent fill is not a colour the system palette knows and
  a completed marker and an upcoming one would otherwise be indistinguishable — which is the one thing
  this component communicates. An errored marker switches to `LinkText` with a dashed ring rather than
  relying on hue.

## Gaps

- **A `title`.** Not implemented; the browser tooltip over a step strip is noise, and the strip already
  announces itself.
- **Step validation or gating.** `disabled` is a static flag. Nothing here inspects whether the
  _previous_ step is filled in — that is the consumer's state and the consumer's call, and the
  component reports rather than deciding.
- **A `next` / `previous` control pair.** Deliberately absent. Advancing is the wizard's primary action
  and it almost always has a label of its own ("Continue", "Place order"), which is content rather than
  chrome. A generic "Next" button in the strip would be the wrong place for it.
- **`aria-setsize` / `aria-posinset`.** An `<ol>` already gives a screen reader the position and the
  count, so the explicit ARIA attributes would say the same thing twice.
- **Branch / conditional steps.** A wizard whose steps depend on earlier answers needs its own model of
  which steps exist; this component takes a flat list and renders what it is given.
