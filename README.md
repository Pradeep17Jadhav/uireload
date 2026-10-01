# uireload

Small, composable, accessible React primitives.

**Status: architecture only.** This repository contains the build, test, theming,
i18n, RTL and packaging foundations for a component library. It contains **no UI
components yet** — that is deliberate, and it is the current state of the project.
The first component can be added without any architectural restructuring; see
[Contributing](./CONTRIBUTING.md).

---

## Design goals

- **Lightweight.** No runtime dependencies, zero CSS-in-JS, measured bundle budgets.
- **Independently consumable.** `uireload/components/<name>` per component; the
  barrel is a convenience, not a requirement.
- **Consumer-controlled theming.** CSS custom properties. No provider, no context.
- **CSS isolation.** `uir-`-prefixed classes inside `@layer`, so the library is safe
  to drop into any existing build setup.
- **Accessible by construction.** WAI-ARIA APG is the specification, not
  inspiration. Shared focus primitives, not per-component improvisation.
- **SSR safe.** No DOM access during render. Hydration mismatches are a test
  failure, not a production surprise.
- **RTL and i18n ready.** Logical CSS properties enforced by a lint rule;
  per-instance message catalogs with per-key fallback.
- **Predictable.** Every component follows the same conventions: controlled and
  uncontrolled state, `data-*` for visual state, consumer handlers first.

See [`docs/architecture.md`](./docs/architecture.md) for the reasoning, the
alternatives that were rejected, and the known limitations.

## Install

```bash
npm install uireload
```

`react` is a peer dependency (`>=18.2 <20`). `react-dom` is an optional peer.

## Usage

```ts
// One component, smallest possible import.
import { Button } from "uireload/components/button";

// The barrel works too and tree-shakes the same way.
import { Button, Dialog } from "uireload";
```

```ts
// One stylesheet, imported once at your application root.
import "uireload/styles.css";
```

Components are not implemented yet. The imports above are the intended API and are
wired through the build, the export map and the type declarations.

## Theming

Override CSS custom properties at any scope you choose. No provider to mount.

```css
:root {
  --uir-accent: #2563eb;
  --uir-radius: 0.375rem;
}

[data-theme="brandy"] {
  --uir-accent: #7c3aed;
  --uir-radius: 0;
}
```

The full token list is in [`src/theme/tokens.css`](./src/theme/tokens.css) and is
mirrored as a typed contract in `src/theme/tokens.ts`.

## Repository layout

```
src/
  index.ts             public API barrel (re-exports only)
  types.ts             shared public prop types
  index.css            base + utility layers, assembled into styles.css
  theme/               token contract and defaults
  i18n/                message catalog and interpolation
  internal/            private utilities: focus, state, refs, events, RTL
  components/
    _template/         authoring template, excluded from the build
tests/
  conventions.test.ts        CSS and token architecture
  package-structure.test.ts  packaging architecture
  published-package.test.ts  real Node + TypeScript resolution of the built package
  ssr.test.tsx               server rendering and hydration
.storybook/            Storybook config, with RTL and scheme toolbars
docs/                  architecture, theming, i18n, RTL, accessibility, testing, roadmap
scripts/
  build-exports.mjs        pure export-map construction (unit tested)
  sync-exports.mjs         regenerates package.json exports from src/components
  bundle-css.mjs           assembles the published stylesheet
  check-css.mjs            build gate: namespaced classes, logical properties
  css-rules.mjs            the rules themselves (unit tested)
  report-sizes.mjs         bundle size report and budget gate
```

## Documentation

- [`docs/architecture.md`](./docs/architecture.md) — every decision, the alternatives
  rejected, and the known limitations
- [`docs/theming.md`](./docs/theming.md) — tokens, schemes, density, layers
- [`docs/i18n.md`](./docs/i18n.md) — message contract and placeholders
- [`docs/rtl.md`](./docs/rtl.md) — logical properties, direction, testing
- [`docs/accessibility.md`](./docs/accessibility.md) — focus primitives, keyboard,
  component requirements
- [`docs/testing.md`](./docs/testing.md) — what to test and what is enforced
- [`docs/roadmap.md`](./docs/roadmap.md) — what is deferred, and on what trigger

## Development

```bash
npm install
npm run verify     # format, lint, CSS lint, typecheck, build, tests, size, packaging
npm run storybook  # stories with RTL / dark / high-contrast / density toolbars
npm test           # vitest
```

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) first. To add the first component, copy
`src/components/_template`.

## License

MIT
