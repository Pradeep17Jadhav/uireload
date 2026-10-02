# TabBar

`role="tablist"` over real `<button role="tab">` elements, with the APG tabs keyboard contract on top.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop                | Type                                                     | Default          | Notes                          |
| ------------------- | -------------------------------------------------------- | ---------------- | ------------------------------ |
| `label`             | `string`                                                 | —                | Accessible name for the bar.   |
| `items`             | `readonly TabItem[]`                                     | —                | Required.                      |
| `value`             | `string`                                                 | —                | Controlled. Not `null`.        |
| `defaultValue`      | `string`                                                 | first selectable | Uncontrolled, mount only.      |
| `onValueChange`     | `(value: string) => void`                                | —                |                                |
| `lazy`              | `boolean`                                                | `false`          | Unmount the unselected panels. |
| `orientation`       | `"horizontal" \| "vertical"`                             | `"horizontal"`   | Also selects the arrow axis.   |
| `indicatorPosition` | `"auto" \| "block-end" \| "block-start" \| "inline-end"` | `"auto"`         |                                |
| `scrollable`        | `boolean`                                                | `true`           |                                |
| `activation`        | `"automatic" \| "automatic-activation" \| "manual"`      | `"automatic"`    | See below.                     |
| `disabled`          | `boolean`                                                | `false`          |                                |
| `className`         | `string`                                                 | —                |                                |
| `ref`               | `Ref<HTMLDivElement>`                                    | —                | The `tablist`.                 |

### `TabItem`

| Field       | Type        | Notes                                     |
| ----------- | ----------- | ----------------------------------------- |
| `value`     | `string`    | Required, stable, unique.                 |
| `label`     | `ReactNode` | What the user reads.                      |
| `disabled`  | `boolean`   | Rendered, visible, skipped by the arrows. |
| `badge`     | `ReactNode` | Inside the tab's name.                    |
| `tone`      | `Tone`      | Per tab, not per bar.                     |
| `textValue` | `string`    | When `label` is not plain text.           |
| `panel`     | `ReactNode` | The panel this tab reveals.               |

## Manual activation is the default

Arrow keys move **focus**. Enter or Space moves **selection**.

This is the component's most consequential decision and the one the APG is explicit about.
Automatic activation — selection following focus — means arrowing past four tabs fires four requests,
and on a tab set that is not wrapped in a router it destroys the form data on the tab the user left.

`activation="automatic"` resolves per orientation, which is the one place it deviates from a flat
default:

| Orientation  | `automatic` means | Why                                                            |
| ------------ | ----------------- | -------------------------------------------------------------- |
| `horizontal` | manual            | A strip is a row of things you press, so Enter/Space activate. |
| `vertical`   | automatic         | A vertical strip is a listbox, so the arrows do.               |

Set either explicitly when a design insists. `automatic-activation` forces automatic on a horizontal
bar; `manual` forces manual on a vertical one.

## Focus and selection are two pieces of state

Under manual activation they genuinely differ: arrowing across the strip moves focus and leaves the
selection where it was. One derived value cannot express that, so `focused` is separate state.

That is also why the arrows step from **focus**, not from the selection. They coincide under automatic
activation and diverge under manual; stepping from the selection would compute `(-1 + 1) % 3 === 0`
when nothing is focused and land the user back on the tab they are standing on, so the first arrow
press would appear to do nothing.

Focus follows a selection made from _outside_ — a deep link, a reset button — so a controlled bar whose
`value` moves does not leave a keyboard user standing on a tab that is no longer selected.

## The roving tabindex

Exactly one tab is tabbable, so Tab enters the strip once and leaves on the next press. Every tab
being tabbable would make a five-tab strip cost six Tab presses to cross.

The panel is a tab stop of its own, per the APG: a panel with no tab stop is a panel whose overflow is
unreachable from the keyboard. So crossing a tab bar is two Tab presses — one to the strip, one past
the panel — and that is correct rather than an oversight.

## Panels: hidden, not unmounted

By default every panel is mounted and the unselected ones carry `hidden`. Unmounting is what
`lazy` opts into — it is cheaper — and it is opt-in because it costs find-in-page: a user searching the
page for text they can see in another tab cannot find it if that tab was never rendered.

Each panel is associated in **both** directions: `aria-controls` from the tab, `aria-labelledby` back
at it. Passing `panel` as a prop rather than a render prop is what lets the component own that
association, which is the part that is easy to get wrong by hand.

## A tab without a panel

An item with no `panel` renders as a tab and nothing else. That case has real requirements this
component cannot satisfy alone:

- the consumer renders their own panel, and must give it `role="tabpanel"`, `aria-labelledby` pointing
  at the tab's `id`, and `tabIndex={0}`;
- the tab gets **no** `aria-controls`, because an `aria-controls` pointing at an id that does not
  exist is an invalid ARIA value and axe reports it as critical. The tab's `id` is in the DOM, so the
  consumer's panel can point back at it with `aria-labelledby`.

It is supported and recorded rather than worked around, because a render prop for the panel would make
the component responsible for the consumer's content.

## Disabled tabs stay rendered

A disabled tab is skipped by the arrows and by `Home` / `End`, and stays visible.

A strip with a _gap_ where a tab used to be has tabs whose positions move under the pointer. A strip
with the tab _missing_ lies about what the section contains.

## Reconciled design

| Decision           | Choice                                | Why                                                                        |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------------- |
| Activation         | manual by default on a horizontal bar | Arrowing past four tabs must not fire four requests.                       |
| `activation`       | resolved from orientation             | A vertical strip is a listbox; a horizontal one is a row of buttons.       |
| `value`            | `string`, never `null`                | A tablist with no selected tab has an association that means nothing.      |
| Focus / selection  | two pieces of state                   | They diverge under manual activation.                                      |
| Arrows step from   | focus                                 | Stepping from the selection lands back where the user already is.          |
| Tab stop           | roving, one per strip                 | Five tabbable tabs cost six Tab presses.                                   |
| Panel tab stop     | `tabIndex={0}`                        | A panel with no tab stop has unreachable overflow.                         |
| Panels             | hidden by default, `lazy` to unmount  | Unmounting costs find-in-page.                                             |
| Badge              | inside the tab's label                | A count a screen reader cannot announce is a count only sighted users see. |
| `aria-label`       | `textValue` only, never from a label  | An `aria-label` replaces content, which would drop the badge.              |
| `aria-orientation` | omitted when horizontal               | It is the default value; stating it is redundant on every bar.             |
| Tone               | per tab                               | A strip routinely mixes states — an errors tab beside a normal one.        |
| `onClick`          | passed through, not composed          | No internal click behaviour to compose with; composing double-fires.       |

## Keyboard

| Key                | Behaviour                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| `ArrowRight` / `↓` | Next selectable tab. Focus, and selection too under automatic activation. |
| `ArrowLeft` / `↑`  | Previous selectable tab. Wraps at both ends.                              |
| `Home`             | First selectable tab.                                                     |
| `End`              | Last selectable tab.                                                      |
| `Enter` / `Space`  | Selects the focused tab.                                                  |
| `Tab`              | Enters the strip at its one tab stop; the panel is the next stop.         |

## CSS contract

```
.uir-tab-bar           the root; data-orientation, data-scrollable, data-indicator,
                       data-tone, data-disabled
.uir-tab-bar__strip    role="tablist"; the scroll container
.uir-tab-bar__tab      role="tab"; data-selected, data-focused, data-tone
.uir-tab-bar__label    the tab's text; truncated
.uir-tab-bar__badge    the count, inside the label
.uir-tab-bar__panel    role="tabpanel"; hidden when not selected
```

Component-local tokens: `--uir-tab-pad-inline`, `--uir-tab-pad-block`, `--uir-tab-indicator-size`,
`--uir-tab-bar-border`, `--uir-tab-indicator`, `--uir-tab-text`, `--uir-tab-badge-fill`,
`--uir-tab-badge-text`.

The selection indicator is a `::after` on the tab rather than a separate element, so it is always
exactly as wide as the tab it marks and needs no measuring in JavaScript.

`data-focused` is styled as well as `:focus-visible`, because under manual activation the focused tab
is deliberately _not_ the selected one — and without a visible distinction the two look identical and
the keyboard appears to be doing nothing.

## Accessibility

- `role="tablist"` / `role="tab"` / `role="tabpanel"`, with the association in both directions.
- A roving tabindex, so the strip is one tab stop.
- A panel tab stop, so its overflow is reachable.
- `aria-orientation` stated only when it is not the default.
- The badge inside the tab's label, so it is part of the accessible name.
- `textValue` supplies the name when `label` is not plain text; `aria-label` is never derived from a
  plain-text label, because it would replace the content and drop the badge.
- Disabled uses the native attribute, so it leaves the tab order.
- `forced-colors`: the indicator is a `background-color` on a pseudo-element, which the system palette
  would replace with the same value on every tab — so `forced-color-adjust: none` plus `Highlight` puts
  it back. `Highlight` is what a selected item is in every one of these themes.

## Gaps

- **Overflow into a dropdown.** When a strip has more tabs than fit and scrolling is the wrong answer,
  that is a dropdown of tabs with its own keyboard contract. Recorded rather than half-built; the
  scroll container is what exists today.
- **Reordering tabs by drag.** The strip has no drag affordance and no live-region announcement for the
  move. That is a second, separate interaction on top of selection and is not implemented.
- **A router integration.** `value` is a string; wiring it to a route is the consumer's.
- **`aria-setsize` / `aria-posinset`.** Not stated, because every tab in this strip is present in the
  DOM. They matter only when some tabs are not — which is the overflow case above.
