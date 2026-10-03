# Navbar

A `navigation` landmark holding the primary destinations of a page or application.

This is deliberately the least clever component in the library. It has no widget pattern, because none exists.

## Design notes

The provenance for this component — which reference implementation backed each non-obvious choice — is
recorded in `docs/references.md`, which is not published.

## Props

| Prop          | Type                              | Default        | Notes                                        |
| ------------- | --------------------------------- | -------------- | -------------------------------------------- |
| `items`       | `readonly NavbarItem[]`           | —              | Required.                                    |
| `label`       | `string`                          | `"Main"`       | The landmark's name.                         |
| `current`     | `string`                          | —              | Current item's id. Overrides `item.current`. |
| `onNavigate`  | `(id: string) => void`            | —              |                                              |
| `orientation` | `"horizontal" \| "vertical"`      | `"horizontal"` |                                              |
| `position`    | `"static" \| "sticky" \| "fixed"` | `"static"`     |                                              |
| `brand`       | `ReactNode`                       | —              | Before the items.                            |
| `actions`     | `ReactNode`                       | —              | After the items.                             |
| `size`        | `Size`                            | `"md"`         |                                              |
| `disabled`    | `boolean`                         | `false`        | All items.                                   |
| `className`   | `string`                          | —              |                                              |
| `ref`         | `Ref<HTMLElement>`                | —              |                                              |

`NavbarItem` is `{ id, label, href?, onSelect?, current?, disabled?, icon?, description? }`.

## The whole accessibility contract is three things

1. **A named landmark.** A `<nav>` with no accessible name is announced as "navigation" and nothing else, so
   a page with a primary and a secondary bar gives the user no way to tell them apart. `label` defaults to
   `"Main"`, which is right more often than not — but a page with two bars must pass a distinct name for each.
   `aria-label` is used rather than `aria-labelledby`, because a navigation bar has no visible heading of its
   own and the product name beside it names the _site_, not this list of destinations.

2. **`aria-current="page"`** on exactly one item, so "where am I?" is answerable without reading every link.
   `current` takes the id centrally, so a consumer holding one piece of state does not have to copy it into
   every item on every render. **Zero** current items is a legitimate state, not a bug — a navbar on a page
   that is not in the list. Marking one arbitrarily would be a lie.

3. **An honest element per item.** See below.

The items are a `<ul>`, because a navigation bar is a list of places and jumping it as a list is the fastest
route through it for a screen reader user.

## An honest element per item

| Item                  | Rendered as | Why                                                   |
| --------------------- | ----------- | ----------------------------------------------------- |
| `href`                | `<a href>`  | Navigates. Can be middle-clicked, copied and crawled. |
| no `href`, `onSelect` | `<button>`  | Performs an action. "Sign out" is not a link.         |
| neither               | `<span>`    | A section name that is not yet a page.                |

The third case matters: rendered as a link with no `href` it would be a focusable, activatable element that
does nothing; rendered as a button it would announce a control that performs no action.

## A disabled link keeps its `href`

```html
<a href="/billing" aria-disabled="true">Billing</a>
```

An `<a>` with **no** `href` has no implicit link role. Dropping it would take the entry out of the
accessibility tree entirely rather than marking it unavailable — a screen reader user would not hear that it
exists at all, and it would leave the tab sequence so a user walking the bar with `Tab` would silently skip
a visibly present entry.

So the destination stays and `aria-disabled` says "present but not now". Navigation is stopped with
`preventDefault()` in the handler, which is what a consumer vetoing a link has to do anyway.

This is the **opposite** of a disabled `<button>`, which uses the native `disabled` attribute and is removed
from the tab sequence. The difference is not an inconsistency: a button has an attribute that means this, and
a link does not.

## Keyboard

`Tab` and `Shift + Tab`, through the links in order. That is the entire contract.

There is deliberately **no arrow-key navigation**. The authoring practices define no widget pattern for
navigation, and adding Up/Down would turn a list of links into a toolbar — making `Tab` mean something
different on this component than on every other list of links on the page. A `role="menubar"` with Left/Right
and a roving tabindex is a different widget with a different contract; if that is what you want, build a
menubar.

## `position: "fixed"` removes the bar's space

`sticky` keeps its space in the flow; `fixed` does not, so whatever follows slides underneath it. Padding to
keep content clear is the consumer's to add — the bar cannot know what is below it, and guessing would add a
gap to every page that does not need one.

## CSS contract

```
.uir-navbar            the <nav>; data-orientation, data-position, data-size
.uir-navbar__brand     before the items
.uir-navbar__list      the <ul>
.uir-navbar__item      one <li>
.uir-navbar__link      the <a>, <button> or <span>; data-current, data-disabled
.uir-navbar__link--static  modifier for the inert entry
.uir-navbar__icon      leading adornment; aria-hidden
.uir-navbar__label     the label
.uir-navbar__description  secondary text; horizontal bars hide it
.uir-navbar__actions   after the items
```

Component-local tokens: `--uir-navbar-surface`, `--uir-navbar-border`, `--uir-navbar-text`,
`--uir-navbar-muted`, `--uir-navbar-accent`, `--uir-navbar-accent-wash`, `--uir-navbar-gap`,
`--uir-navbar-item-padding-block`, `--uir-navbar-item-padding-inline`, `--uir-navbar-font-size`,
`--uir-navbar-min-block`.

**The current item is a filled block plus a weight change, never a colour alone.** A subtle foreground tint is
the first thing a monochrome print and a high-contrast theme both discard, and "which page am I on" is the
single most important thing on the bar.

`description` is only rendered in a vertical bar — a horizontal one has no room for it — so the prop's effect
depends on `orientation`.

## Accessibility

- `<nav>` with an accessible name.
- `aria-current="page"` on the current item, and `data-current` alongside so CSS owns the styling.
- Links, buttons and inert text, chosen per item rather than uniformly.
- Icons are `aria-hidden`; `label` is the accessible name. Otherwise the two are announced as one string with
  an unexplained glyph in it.
- One focus rule for both `<a>` and `<button>`, using `:focus-visible` and `outline`.
- In forced colours the current item's wash becomes `Highlight`, because a translucent accent can resolve to
  nothing and would leave the current page marked by nothing at all.

## Gaps

- **A menubar.** `role="menubar"` is a different widget: `Tab` moves _into_ it and Left/Right move between its
  items. Not this component, and not a `variant` of it.
- **A responsive breakpoint.** `ShellBar` collapses into a menu below a width. Deciding where a bar becomes a
  drawer is a layout decision about the whole page, not about this component, and guessing a threshold would
  surprise consumers who have already solved it with CSS. Use `orientation` plus a `Menu` in `actions`.
- **Overflow.** No "more" affordance when the items do not fit. A caller who needs one composes a `Menu`; the
  truncation policy is theirs.
- **A secondary or breadcrumb variant.** A breadcrumb is an ordered path, not a set of destinations, and it
  belongs in a `<nav>` with its own label rather than as a mode of this one.
