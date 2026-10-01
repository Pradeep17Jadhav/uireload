# Roadmap

This records intent and, more usefully, the conditions under which a decision should
be revisited. Everything here is deliberately conditional: a design system's
architecture should be re-examined when evidence contradicts it, not when a
quarter passes.

## Now: architecture only

The repository contains foundations and zero components. The first component can be
added with `cp -r src/components/_template src/components/<name>` plus
`npm run sync:exports`.

Two tests fail when the first component lands, on purpose:

- `tests/package-structure.test.ts` "has no components yet".
- The deep-import probe in `tests/published-package.test.ts` becomes meaningful.

That is a tripwire, not a bug: it forces a review of the packaging conventions at
exactly the moment they start mattering.

## Next: the first component

The choice is deliberately open. It should be picked for which infrastructure it
stresses, not for how easy it is:

| Candidate          | What it would prove                                                      |
| ------------------ | ------------------------------------------------------------------------ |
| `Button`           | The floor. If the foundations are wrong, they show up here first.        |
| `Dialog`           | Focus trap, focus restoration, scroll lock, portal SSR, escape handling. |
| `Select` (listbox) | Roving focus, typeahead, DOM-positioned popover, keyboard contract.      |
| `Tabs`             | Roving focus across a composite with roving orientation.                 |

A dialog is probably the highest-value first component: it exercises the most
infrastructure at once, and it is where focus bugs are most visible to users.

**Before the first component ships**, raise the coverage thresholds in
`vitest.config.ts`. They sit at infrastructure-era values and would otherwise become
the new floor.

## Deferred by design

Each of these has a trigger, not a date.

| Deferred                                                | Revisit when                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-component CSS                                       | Bundle data shows the stylesheet is a real cost for a consumer.                                                                                                                                                                                                                                                                                                                                           |
| Plural forms                                            | The first component that needs them. Use `Intl.PluralRules` then.                                                                                                                                                                                                                                                                                                                                         |
| i18n extraction tooling                                 | The key count makes manual extraction painful. `BASE_MESSAGES` means extraction is optional, not required.                                                                                                                                                                                                                                                                                                |
| Monorepo packages                                       | Components need independent release cadences, or publishing is slow enough to matter.                                                                                                                                                                                                                                                                                                                     |
| `aria-live` politeness                                  | The first component that announces state.                                                                                                                                                                                                                                                                                                                                                                 |
| Visual regression                                       | A specific class of regression is escaping review.                                                                                                                                                                                                                                                                                                                                                        |
| Automated AT testing                                    | A testing vendor or budget becomes available.                                                                                                                                                                                                                                                                                                                                                             |
| `href` / `asChild` on `Button`                          | A real consumer needs a link button; `asChild` is the right primitive and it is not written yet.                                                                                                                                                                                                                                                                                                          |
| Context instead of child cloning in `ToggleButtonGroup` | The group rebuilds each child, so it needs each child's `value` prop. A child that is a _component_ or a fragment hides it, and the group collapses to one empty button. It now logs an error, but the constraint is real. Revisit when a second group component needs the same behaviour: a context plus member registration removes the constraint, and the registration cost is amortised across both. |
| Per-subtree light and dark simultaneously               | Auto dark mode is decided on `:root`, so a `light` pin below the root cannot undo it. Plain CSS cannot express this. Revisit only if a real consumer needs it, and then likely with an explicit opt-out attribute rather than `:has()`.                                                                                                                                                                   |

## Explicitly out of scope

- **A theme provider.** The architecture is CSS custom properties. Adding one later
  would be a _new_ API, not a migration, and there is no component that needs it now.
- **CSS-in-JS.** See `architecture.md` for the reasoning.
- **A monorepo.** See `architecture.md` for the trigger conditions.
- **Shipping a styled `sx` prop.** It would make every component a styling API
  surface to maintain.

## Long-term API stability

- Tokens, message key namespaces, and the export map shape are the stable surface.
  Changes to any of them are breaking.
- Component internals are not. `src/internal` may change in any release.
- Adding a component is a minor release. Adding an optional prop is a minor release.
  Changing or removing a prop, renaming a token, or changing a message namespace is a
  major release.
- `src/components/README.md` holds the conventions that keep a hundred components
  consistent. When it needs changing, change it there first.
