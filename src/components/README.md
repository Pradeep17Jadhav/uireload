# Component authoring

This directory holds one folder per public component. Nothing here is exported yet;
the repository is at the stage where the first component can be added with no
architectural restructuring.

## Layout

A component lives in `src/components/<kebab-name>/` and owns its styles, types,
tests, stories and documentation:

```
src/components/
  button/
    index.ts         # public surface: components + types, nothing else
    button.tsx       # implementation
    button.css       # component styles, wrapped in @layer uireload.components
    button.types.ts  # prop types, if they do not fit in index.ts
    button.test.tsx
    button.stories.tsx
    README.md
```

Rules:

- `index.ts` is the **only** public module. Internal helpers stay in sibling files
  and are never re-exported from `index.ts`. A consumer must never need a deep path
  like `uireload/components/button/button`.
- Directories starting with `_` are excluded from the build, the stylesheet bundle
  and the export map.
- One component per folder. Shared logic that ends up used by three or more
  components graduates to `src/internal/`; shared _visual_ patterns graduate to
  `src/theme/tokens.css` or `src/index.css`, not to a `styled-system` runtime.

## Stylesheets

Each component owns a `<name>.css` next to its implementation, with its rules wrapped
in `@layer uireload.components`.

`scripts/bundle-css.mjs` assembles every component stylesheet, plus tokens and base
styles, into a single published `dist/index.css` that consumers import as
`uireload/styles.css`.

**A component's TypeScript must not import its own stylesheet.** Two reasons:

1. Importing CSS from JavaScript makes `sideEffects: false` untrue, which silently
   breaks tree shaking for every consumer.
2. The rules would be duplicated in every consumer bundle instead of shipping once.

A story imports its own stylesheet (`import "./button.css"`), because Storybook has no
build step to assemble them.

A published component's **story and test import the component through the package
specifier**, not relatively:

```ts
import { Button } from "uireload/components/button";
```

`.storybook/main.ts` and `vitest.config.ts` alias those specifiers back to source, so
the dev loop stays fast. The point is that the documented import path is the one
actually exercised during development; a broken export map fails immediately instead of
at publish time.

`_template` is the one exception: it is not in the export map, so it imports relatively.
Change that line when you copy the folder.

## Public surface

Every component exports:

- The component, named in `PascalCase` and matching the folder in `kebab-case`.
- Its props type as `<Name>Props`.
- Nothing else. No internal state, no context, no unstyled variants.

## The template

`_template/` is a complete, working reference for a new component. Copy it:

```
cp -r src/components/_template src/components/thing
```

It is excluded from the build, the stylesheet bundle and the export map, but it is
type-checked, linted and tested in CI, so it cannot rot.

## Conventions

| Concern       | Convention                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Styling       | A single CSS file per component, plain CSS and custom properties, wrapped in `@layer uireload.components`.    |
| CSS imports   | Never imported from JavaScript. Asserted by `tests/conventions.test.ts`.                                      |
| Naming        | Classes are `uir-<component>`, `uir-<component>__<part>`, `uir-<component>--<variant>`. Never global.         |
| State styling | Visual state via `data-*` attributes (`data-open`, `data-disabled`, `data-highlighted`), not via class names. |
| Direction     | Logical properties only (`margin-inline-start`, `inset-inline-end`). Enforced by `npm run lint:css`.          |
| Refs          | Forwarded to the root element for single-element components. Document the element type.                       |
| Styling props | `className` and `style` on the root. No `sx`.                                                                 |
| Controlled    | Any open/closed or checked state accepts `value` + `defaultValue` + `onChange` via `useControllableState`.    |
| Handlers      | Consumer handler runs first; `preventDefault()` opts out of internal behaviour.                               |
| i18n          | All user-visible strings live in `src/i18n/base-messages.ts` under a `<component>.*` namespace.               |
| Accessibility | WAI-ARIA APG pattern is followed, keyboard support is complete, and tests assert roles and keyboard paths.    |
| SSR           | No DOM reads during render. Effects use `useIsomorphicLayoutEffect`.                                          |
| Exports       | Run `npm run sync:exports` after creating the folder.                                                         |

## Definition of done for a component

1. `npm run verify` passes: format, lint, CSS lint, typecheck, build, tests, size
   budget, package audit.
2. `npm run sync:exports` has been run and its output committed.
3. Tests cover rendering, keyboard interaction, controlled/uncontrolled state, and
   `dir="rtl"`.
4. A Storybook story exists per state that matters, including dark and
   high-contrast.
5. `README.md` documents props, keyboard support, and the CSS contract.
6. No new runtime dependency.
7. `axe` reports zero violations in the Storybook a11y addon.
8. The component's stylesheet is wrapped in `@layer uireload.components` and contains
   no physical direction properties.
