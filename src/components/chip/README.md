# Chip

A small, rounded label for a piece of metadata: a category, a count, a filter, a removable item.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop          | Type                                              | Default     | Notes                                    |
| ------------- | ------------------------------------------------- | ----------- | ---------------------------------------- |
| `children`    | `ReactNode`                                       | —           | The label.                               |
| `intent`      | `"none" \| "button" \| "remove"`                  | `"none"`    | Decides the rendered element. See below. |
| `tone`        | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"` | A wash, not a solid fill.                |
| `size`        | `"sm" \| "md" \| "lg"`                            | `"md"`      |                                          |
| `variant`     | `"filled" \| "outlined"`                          | `"filled"`  |                                          |
| `icon`        | `ReactNode`                                       | —           | Decorative; `aria-hidden`.               |
| `removeLabel` | `string`                                          | built       | The remove button's accessible name.     |
| `onRemove`    | `() => void`                                      | —           | Required for the cross to render.        |
| `disabled`    | `boolean`                                         | `false`     | Native `disabled` where interactive.     |
| `buttonLabel` | `string`                                          | —           | Accessible name for rich button content. |
| `className`   | `string`                                          | —           | Merged onto the root.                    |
| `ref`         | `Ref<HTMLElement>`                                | —           | The button, when there is one.           |

## `intent` is the whole component

The single decision that determines what the chip _is_, and it decides which element is rendered:

| `intent`   | Element                             | Focusable          | Notes                                            |
| ---------- | ----------------------------------- | ------------------ | ------------------------------------------------ |
| `"none"`   | `<span>`                            | No                 | A static label. No role, no name, no tab stop.   |
| `"button"` | `<button type="button">`            | Yes                | Activatable. `type` is not optional — see below. |
| `"remove"` | `<span>` + a real `<button>` inside | One, on the button | Only the trailing control is interactive.        |

The element choice **is** the accessibility work here. Nothing is reimplemented: role, name, focus
and keyboard are the platform's for whatever element gets rendered.

A single boolean would have been wrong for `remove`. A chip that is both activatable and removable
has two separate tab stops and two separate accessible names, and collapsing that to one boolean is
how nested-interactive controls get shipped — which is why the third state exists rather than a
`deletable` flag alongside `clickable`.

`type="button"` is not optional on the button variant: a chip inside a form that defaulted to
`submit` would submit the form, which is never what activating a chip means.

## `onRemove` reports; it does not remove

The chip stays on screen after `onRemove` fires. A list is the consumer's state, and a component that
deleted its own row without telling the caller would leave the model and the view disagreeing — and
leave no way to undo. See the `RemovableList` story for the pattern.

No remove control renders at all without `onRemove`: a cross that does nothing is worse than no
cross, because it looks like an affordance and is not one.

## The remove button's name

A bare "Remove" announces as "Remove button", which says nothing about _what_ is being removed — and
in a list of six that is six identical buttons. The default therefore composes the chip's own text
with the word:

```
<Chip intent="remove" onRemove={…}>Weekly</Chip>
// announces as: "Weekly Remove, button"
```

`removeLabel` overrides it for the case where the consumer has better wording. When the label is
arbitrary content rather than text there is no name to compose with, so the word stands alone — which
is recorded rather than guessed around.

`aria-label` is used rather than a visually hidden span because the name has to include the chip's
text, which is _outside_ the button. `aria-label` is the only way to supply a name that is not in the
subtree.

## A wash, not a solid fill

Every tone resolves to a **wash** of the tone with the tone's own dark text, rather than the tone at
full strength. A chip is a small object seen in a group; a saturated fill per chip turns a row of
filters into a colour chart. The wash keeps the text at full contrast while still reading as the tone.

`variant="outlined"` uses the surface with a border of `--uir-chip-text` — the same colour as the
label beside it, not the raw tone. A border lighter than the label next to it is a shape a low-vision
user can see and a label they cannot read.

## Reconciled design

| Decision        | Choice                                  | Why                                                                            |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| `intent`        | three states, not two booleans          | A chip that is both activatable and removable has two tab stops and two names. |
| Element         | span / button / span-with-button        | The element choice is the role, name and keyboard work.                        |
| `type`          | `"button"` always on the button variant | A chip inside a form must not submit it.                                       |
| Removal         | reported, never performed               | The list is the consumer's state.                                              |
| Remove name     | composed from the chip's text           | "Remove" alone says nothing about what is removed.                             |
| Colour          | a wash, with the tone's dark text       | A row of saturated fills is a colour chart.                                    |
| Outlined border | the text colour, not the tone           | The border must carry the same contrast as the label.                          |
| Label           | truncated, never wrapped                | A two-line chip reads as a different component.                                |
| Emphasis        | none beyond `variant`                   | A chip is not a command.                                                       |
| Icon            | `aria-hidden`                           | The text is the name; announcing both says it twice.                           |

## Keyboard

| Key     | Behaviour                                               |
| ------- | ------------------------------------------------------- |
| `Tab`   | Reaches an activatable chip or the remove control.      |
| `Space` | Activates a button chip, or the remove control. Native. |
| `Enter` | Activates a button chip, or the remove control. Native. |

A static chip has no keyboard interaction at all, by design.

## CSS contract

```
.uir-chip                 the root; data-intent, data-tone, data-size, data-variant, data-disabled
.uir-chip__icon           the decorative leading icon; aria-hidden
.uir-chip__label          the text; truncated with an ellipsis
.uir-chip__remove         the real <button> for intent="remove"; carries the aria-label
.uir-chip__remove-glyph   the cross, drawn from two rotated borders
```

Component-local tokens: `--uir-chip-height`, `--uir-chip-pad-inline`, `--uir-chip-gap`,
`--uir-chip-fill`, `--uir-chip-text`, `--uir-chip-ring`, `--uir-chip-hover`, `--uir-chip-active`.

`data-intent="button"` gates the hover rule. Hovering a static label that does nothing tells the
user it is clickable, which it is not — so only a chip that does something changes on hover.

## Accessibility

- The rendered element carries the role, the name and the keyboard behaviour. Nothing is faked with
  `role` attributes on a div.
- A static chip has no role and no tab stop, which is correct for a label and avoids putting a stop on
  every item in a list.
- A button chip is always `type="button"`, so it cannot submit a form by accident.
- The remove control is a real `<button>` with an `aria-label`, and it is a sibling of the chip
  content rather than a descendant of a button.
- Exactly one tab stop in a `remove` chip.
- The icon and the cross are `aria-hidden`; the label and the button name carry the meaning.
- Disabled uses `opacity` with `pointer-events` intact, so a tooltip can still explain why. The native
  `disabled` attribute still applies, so it leaves the tab order.
- `forced-colors` is handled: a light wash fill is very likely to vanish into the page, so the fill
  goes to `Canvas` and the border becomes the system text colour.

## Gaps

- **Per-chip DOM attributes.** The whole chip is one element; there is no slot system for a trailing
  avatar or a nested button. A chip with genuinely mixed content should be composed by the consumer
  rather than growing a props API for it.
- **An avatar.** Some designs lead a chip with a small image. That is an `icon` with an `<img>` in it,
  which works but carries no sizing contract of its own.
- **Overflow.** A chip group that runs out of room is a layout problem for the consumer. Nothing here
  collapses into an overflow menu, which would be a different component with its own keyboard
  contract.
- **Keyboard-removable chips from the list.** The remove control is reachable by Tab, but a list of
  removable chips gives no shortcut to step through them. That is a list-level concern — roving focus
  across a list — and is recorded rather than half-built here.
