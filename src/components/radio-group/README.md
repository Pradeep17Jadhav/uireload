# RadioGroup

"Choose exactly one" from a small set.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop            | Type                                              | Default      | Notes                                    |
| --------------- | ------------------------------------------------- | ------------ | ---------------------------------------- |
| `label`         | `ReactNode`                                       | —            | Visible `<legend>`. Needs an `id`.       |
| `options`       | `readonly RadioOption[]`                          | —            | Required.                                |
| `value`         | `string \| null`                                  | —            | Controlled. `null` means nothing chosen. |
| `defaultValue`  | `string \| null`                                  | `null`       | Uncontrolled, read at mount only.        |
| `onValueChange` | `(value: string \| null) => void`                 | —            | Reports `null` when cleared.             |
| `labelId`       | `string`                                          | —            | Names the group when `label` is absent.  |
| `orientation`   | `"horizontal" \| "vertical"`                      | `"vertical"` | Also selects the arrow axis.             |
| `size`          | `"sm" \| "md" \| "lg"`                            | `"md"`       | Applied to every option.                 |
| `tone`          | `"neutral" \| "accent" \| "positive" \| "danger"` | `"neutral"`  | Selected dot only.                       |
| `disabled`      | `boolean`                                         | `false`      | Native attribute on every option.        |
| `required`      | `boolean`                                         | `false`      | Native `required` on every option.       |
| `clearable`     | `boolean`                                         | `false`      | See below — opt-in on purpose.           |
| `name`          | `string`                                          | derived      | Form submission. Defaults from `id`.     |
| `helperText`    | `ReactNode`                                       | —            | Announced via `aria-describedby`.        |
| `className`     | `string`                                          | —            | Merged onto the root.                    |
| `ref`           | `Ref<HTMLFieldSetElement>`                        | —            | The `<fieldset>`.                        |

### `RadioOption`

| Field       | Type        | Notes                                           |
| ----------- | ----------- | ----------------------------------------------- |
| `value`     | `string`    | Required and stable.                            |
| `label`     | `ReactNode` | What the user reads.                            |
| `disabled`  | `boolean`   | Skipped by arrows, `Home` and `End`.            |
| `textValue` | `string`    | Required when `label` holds elements or images. |
| `children`  | `ReactNode` | Secondary line inside the row.                  |

## An `options` prop, not children

The deliberate divergence from every reference implementation, and the one worth arguing for.

Children-based groups — `<RadioGroup><Radio value="a" /></RadioGroup>` — have to read each child's
props to discover its value. That works right up until a child is wrapped in a component, a
fragment, a conditional, or a `.map()` that returns an array: `React.Children` then sees a wrapper
where it expected an option, and the group has to detect that at runtime and log an error.
`ToggleButtonGroup` in this library does exactly that, and the runtime error is a real cost paid by
every consumer.

A typed array has no such failure mode — an option cannot be malformed, because an option is
whatever the array contains. It also keeps this a one-component folder rather than a pair, and it
means `options` can be `.filter()`ed or `.map()`ed from a source of truth without the result
needing to be flattened first.

The cost is real and is stated here: an option cannot be given arbitrary DOM attributes (a
`data-testid`, a `title`, a `ref`) because it is a value, not an element. For a group whose options
are all alike — which is what a radio group is — that is not a loss. When it becomes one, the gap
is recorded below rather than worked around.

## The keyboard contract is the component

Everything else here is a styled `<input type="radio">`. What is not free is:

- **One tab stop.** `tabIndex` is `0` on the selected option, or on the first selectable one when
  nothing is selected, and `-1` on every other. Tab enters the group once and leaves on the next
  press. All options being tabbable would make a three-option group cost four Tab presses.
- **Arrows move selection and focus together.** The two cannot be separated: moving focus without
  moving selection leaves the user looking at an option that is not the answer, and moving selection
  without moving focus leaves focus behind on the old answer.
- **Arrows wrap.** A radio group is a closed cycle, so stepping past the last option has to arrive
  somewhere. `Home` and `End` are the non-wrapping escape hatch, and both are implemented.
- **Disabled options are skipped** by the arrows _and_ by `Home`/`End`, which is what makes a group
  usable with a keyboard rather than merely visible.
- **Tab is not trapped.** The arrows move within the group; Tab moves on.

`orientation` selects the axis the API advertises and the layout, but **both arrow axes are always
accepted**. A vertical group that ignored Left/Right would be right on a desktop and wrong for
anyone arrowing through a list; the cost of accepting both is that a horizontal group also answers
Up/Down, which moves between rows in a settings list and is what they meant anyway.

### Arrows step from focus, not from the selection

With nothing selected, focus sits on the tab stop while the selection is nowhere. Stepping from the
selection would compute `(-1 + 1) % 3 === 0` and re-select the option the user is already standing
on, so the first ArrowDown would appear to do nothing. Anchoring to the tab stop instead makes the
first press move exactly one option, which is what the key was pressed for.

## `clearable` and the event that carries it

A radio that is already checked fires **no** `change` event when clicked — the platform treats
"activate the thing that is on" as a no-op. So `onChange` alone can never empty a group, and a
`clearable` implemented on it would be a prop that silently does nothing.

The clear is therefore carried by `click`, guarded on the option being currently checked. That is
the only event that fires in both directions. `clearable` is opt-in rather than the default,
because making it the default would let a keyboard user empty a required field by pressing the
answer they already chose.

## Reconciled design

| Decision   | Choice                                   | Why                                                                                                                                                          |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Structure  | `<fieldset role="radiogroup">` of inputs | The fieldset supplies form semantics and a legend a div cannot; the role is stated explicitly for the announcement and the arrow-key expectation it implies. |
| Options    | typed array, not children                | No runtime validation, no wrapper-child failure mode. See above.                                                                                             |
| Selection  | `string \| null`                         | `null` is a real state before the user chooses, and for a required field it has to be representable.                                                         |
| Clear      | opt-in, on `click`                       | A radio that can be emptied by accident is not a radio.                                                                                                      |
| Tab stop   | derived, never stored                    | "Tab in at the current answer" holds by construction rather than by an effect that can drift.                                                                |
| Arrows     | both axes, always                        | See above.                                                                                                                                                   |
| Wrapping   | yes                                      | A closed cycle has no end to stop at.                                                                                                                        |
| Group name | `name` derived from `id`                 | Two groups on a page must not cross-select, and no call site should have to remember it.                                                                     |
| Intent     | `tone`, selected dot only                | A red ring around an unchosen option warns about something the user did not do.                                                                              |
| Mark       | inset `currentcolor` pseudo-element      | Scales, needs no request, and inherits the forced-colours text colour.                                                                                       |
| Emphasis   | none — no `variant`                      | The ladder describes how loud a _command_ is. A radio answers a question.                                                                                    |

## Keyboard

| Key               | Behaviour                                                        |
| ----------------- | ---------------------------------------------------------------- |
| `ArrowDown` / `→` | Next selectable option. Moves focus and selection together.      |
| `ArrowUp` / `←`   | Previous selectable option. Wraps at both ends.                  |
| `Home`            | First selectable option.                                         |
| `End`             | Last selectable option.                                          |
| `Space`           | Selects the focused option. Native — nothing is reimplemented.   |
| `Tab`             | Enters the group at its single tab stop; leaves on the next Tab. |

Both arrow axes are accepted regardless of `orientation` — see above.

## CSS contract

```
.uir-radio-group                       the <fieldset>; data-orientation, data-size, data-tone,
                                        data-disabled, data-required
.uir-radio-group__label                the real <legend>
.uir-radio-group__options              the flex row/column of options
.uir-radio-group__option               one row; data-checked, data-disabled
.uir-radio-group__input                the real input, stretched over the row and transparent
.uir-radio-group__dot                  the drawn ring; carries the mark via ::after
.uir-radio-group__option-label         real <label for>
.uir-radio-group__option-detail        secondary line inside a row
.uir-radio-group__helper               the announced description
```

Component-local tokens: `--uir-radio-dot`, `--uir-radio-mark`, `--uir-radio-border`,
`--uir-radio-fill`, `--uir-radio-on-fill`, `--uir-radio-ring`, `--uir-radio-hover`.

The dot is `aria-hidden`: the input's own checkedness states the value, and announcing both would
say the same thing twice.

The legend uses `float: inline-start` and the options container `clear: both` — the standard way to
get a legend to sit with the content in a way browsers agree on. Without the `clear`, a long helper
text can be pulled up beside the legend.

## Accessibility

- A real `<input type="radio">` per option, so role, state, form participation and `name`/`value`
  grouping are the platform's.
- A real `<legend>` rather than a div with `aria-label`: the legend is what a screen reader announces
  on entering the group.
- One focusable element per row — the input covers the whole row, so there is no focusable dot and
  clickable label that have to be kept in agreement, and the row is the hit target.
- `aria-orientation` states the layout, `aria-required` the requirement.
- `required` renders a visually hidden "Required" next to an `aria-hidden` asterisk. A CSS-generated
  asterisk cannot be announced at all.
- `helperText` is wired to `aria-describedby`, so the explanation is announced and not merely drawn.
- `textValue` supplies the accessible name when `label` holds elements or images, because the
  derived name of arbitrary content is often nothing useful.
- Disabled uses `opacity` with `pointer-events` intact, so a tooltip can still explain why.
- `forced-colors` is handled: the fill switches to `Highlight` / `HighlightText`, and the mark is
  `currentcolor` so it needs nothing.
- A development warning fires when there is no accessible name — a nameless radiogroup announces as
  "radio group" with no indication of what the choices are for.

## Gaps

- **Per-option DOM attributes.** An option is a value, not an element, so `data-testid`, `title` and
  `ref` per option are not available. If this proves to matter, the honest fix is a children-based
  variant with the runtime validation `ToggleButtonGroup` already does — not a half-node.
- **Validation messaging.** `required` gives the browser's own validation bubble. A library-level
  error message wired to `aria-invalid` is a form concern above this component and is not implemented.
- **`aria-invalid`.** Not stated on the fieldset when a consumer knows the group is invalid. There
  is no prop for it because the component cannot know; pass it through the root props.
