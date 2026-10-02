# Link

A real `<a>`. Everything a link _is_ is the platform's.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious
choice — is recorded in `docs/references.md`, which is not published.

## Props

| Prop        | Type                                              | Default    | Notes                              |
| ----------- | ------------------------------------------------- | ---------- | ---------------------------------- |
| `children`  | `ReactNode`                                       | —          |                                    |
| `href`      | `string`                                          | —          | Optional. Omitting it is a state.  |
| `target`    | `string`                                          | —          | Passed through.                    |
| `rel`       | `string`                                          | —          | Never defaulted. See below.        |
| `underline` | `"inline" \| "hover" \| "always" \| "none"`       | `"inline"` |                                    |
| `tone`      | `"neutral" \| "accent" \| "positive" \| "danger"` | `"accent"` |                                    |
| `size`      | `"sm" \| "md" \| "lg"`                            | `"md"`     |                                    |
| `external`  | `boolean`                                         | `false`    | Draws the leaves-this-page marker. |
| `endIcon`   | `ReactNode`                                       | —          | Decorative.                        |
| `disabled`  | `boolean`                                         | `false`    | Keeps the tab stop. See below.     |
| `className` | `string`                                          | —          |                                    |
| `ref`       | `Ref<HTMLAnchorElement>`                          | —          |                                    |

## `href` is optional, and that is a supported state

An `<a>` with no `href` has no link role and no tab stop. That is the honest state for a link whose
destination a router has not resolved, and it is why `href` is optional rather than required.

The alternative — requiring `href` — pushes every consumer into faking one with `href="#"` or
`href="javascript:void(0)"`, and both produce a link that is announced as a link, is focusable, and
goes nowhere.

## `rel` is not defaulted

`target="_blank"` without `rel="noopener"` gives the opened page a handle on this one through
`window.opener`.

`rel="noopener"` is a correctness fix, and adding it silently would be a decision made for the
consumer. `rel="noreferrer"` additionally strips the referrer, which some analytics depend on. So the
component **warns in development** and names the case, rather than choosing.

## Disabled keeps the tab stop

`<a>` has no `disabled` attribute, and the two ways to fake one both cost something:

- Removing `href` stops navigation — and the platform gives an `<a>` with no `href` **no tab stop
  either**. The link leaves the tab order entirely, so a keyboard user cannot reach it and cannot
  discover that it exists.
- Keeping `href` keeps it focusable and activable, and the click has to be stopped with
  `preventDefault()`.

The second is used. The `href` stays, `aria-disabled` says it is unavailable, and the component's own
handler prevents the navigation. The consumer's `onClick` still runs — it is called _after_
`preventDefault`, not suppressed. A handler that vanishes for a disabled control is a handler whose
absence nobody notices until they look for it in a log.

## `underline="hover"` underlines on focus too

Not optional. A link whose underline appears on hover but not on focus is a link a keyboard user cannot
see — which defeats the point of a focus ring drawn in the colour of the page.

The cost of this mode is real and is stated here: a keyboard user cannot see where the links are until
they reach them. Choose it deliberately. `inline` is the default for exactly that reason.

## Visited state is left to the platform

A browser's `:visited` styling cannot be overridden by a page for privacy reasons, and a design system
that tries either loses the affordance or ships a hack. This component's colour is the unvisited
colour; a browser that tracks history still marks visited links, and that is a feature rather than an
inconsistency to fix.

## Reconciled design

| Decision     | Choice                          | Why                                                                      |
| ------------ | ------------------------------- | ------------------------------------------------------------------------ |
| Element      | always `<a>`                    | Role, activation, context menu, middle-click are the platform's.         |
| `href`       | optional                        | A not-yet-routed link must not be announced as a link.                   |
| `rel`        | warned about, never defaulted   | `noreferrer` strips the referrer; that is not the component's decision.  |
| Default tone | `accent`                        | A link that does not look like a link is not a link.                     |
| `hover` mode | underlines on focus as well     | Otherwise a keyboard user cannot see it.                                 |
| Disabled     | keeps `href`, stops the click   | Removing the `href` would take the tab stop and the role with it.        |
| Visited      | left to the platform            | A page cannot override it, and trying loses the affordance.              |
| Underline    | `text-decoration`, not a border | A border skips descenders and is dropped where the text wraps.           |
| External     | a CSS arrow, `aria-hidden`      | `external` already says it; announcing the glyph repeats it.             |
| Focus ring   | tight offset                    | A link sits in a line of text; a control's padding punches a hole in it. |

## Keyboard

| Key     | Behaviour                                                     |
| ------- | ------------------------------------------------------------- |
| `Tab`   | Reaches the link. Native.                                     |
| `Enter` | Follows the link. Native.                                     |
| `Space` | Scrolls the page. Native — a link does not activate on Space. |

`Space` doing nothing is correct for an anchor, and is the difference between a link and a button.

## CSS contract

```
.uir-link               the root anchor; data-underline, data-tone, data-size,
                        data-external, data-disabled
.uir-link__end-icon     the decorative trailing adornment; aria-hidden
.uir-link__external     the leaves-this-page marker; aria-hidden
```

Component-local tokens: `--uir-link-font-size`, `--uir-link-font-weight`.

The root is `display: inline`, not `inline-flex`, so a link inside a sentence is a link inside a
sentence — `inline-flex` breaks the line box. The trade is that the external arrow's rotation would
rotate its box as well as its shape, so the glyph is drawn as a rotated _pseudo-element_ inside an
unrotated span.

Link weight is the body weight, not the control weight. A link is prose; setting it to the control
weight would make every link in a paragraph half a step heavier than the text around it.

## Accessibility

- A real `<a>`, so the role, the focus stop, the announced destination, the context menu and the
  middle-click are all the platform's.
- `target="_blank"` warns about `rel` in development rather than guessing.
- The external marker and any custom end icon are `aria-hidden`: the destination is already in the
  `href`, and announcing the glyph repeats it.
- The focus ring is drawn on the root, the only focusable element.
- `forced-colors` needs no special case — every rule uses `currentColor` or a token the theme
  redefines, and a `text-decoration` underline follows the text colour automatically. The focus ring is
  restated as `Highlight`.

## Gaps

- **A router integration.** `href` takes a string, so a consumer using a client-side router has to
  wire its own click handling. A `component` prop or a `to`-style API would tie the library to a
  router, which is a decision worth making per-project and not per-component.
- **`aria-current`.** Not set for a link pointing at the page you are on. It is a page-level fact and
  passable through the root props.
- **Truncation.** A very long URL used as link text wraps rather than truncating. Truncating a link
  hides the destination, which is the one thing the text is for; `Text`'s `noWrap` is the deliberate
  opt-out.
