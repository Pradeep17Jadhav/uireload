# Architecture

This document is the reasoning behind the repository's shape. Where a decision
looks arbitrary, the alternative and the reason for rejecting it are recorded.

The goal is a library that is **small, composable, predictable, accessible and
independently consumable**. Every decision below is judged against that, and
against one hard constraint: **a consumer must be able to add one component
without inheriting the others.**

---

## 1. Package and export architecture

### Decision

One npm package. Dual ESM + CJS. One entry point per component, declared
explicitly, plus the root barrel:

```ts
import { Button } from "uireload"; // convenience barrel
import { Button } from "uireload/components/button"; // primary path
import "uireload/styles.css"; // opt-in stylesheet
```

`scripts/sync-exports.mjs` generates the per-component entries from
`src/components/*`; `tests/package-structure.test.ts` fails if they drift.

### Why explicit subpaths instead of `"./components/*"`

A wildcard is the obvious choice and it was the first one. It was rejected for a
concrete reason: **an unmatched wildcard is a hard error for `publint` and
`attw`.** Declaring `"./components/*"` before the first component exists means CI
is red for a package that is otherwise correct. That teaches the team to ignore
the packaging check, which is worse than the bookkeeping the explicit map
requires.

The explicit map is also auditable: every published entry is a visible line in
`package.json` rather than a pattern that quietly starts matching.

`scripts/build-exports.mjs` holds the pure map construction and is unit tested. Its
first version returned each entry as a whole object that included the `.` key, so
adding the first component silently overwrote the root export. Both
`tests/package-structure.test.ts` and `scripts/build-exports.test.ts` cover that
regression.

### Why one package and not a monorepo

A monorepo (`@uireload/button`, `@uireload/dialog`, …) gives per-component
versioning, which is the honest answer if components ever need to release
independently. It was rejected because:

- Version-skew debugging is a real, permanent cost that a v1 design system should
  not take on speculatively.
- Cross-component utilities need a shared internal package, which is a third
  artifact to publish and version.
- Single-package tooling (tsup, tsconfig, ESLint, Vitest, Storybook) is
  dramatically simpler.

**Revisit when:** components start needing genuinely independent release
cadences, or the package gets large enough that publishing takes minutes. Both are
measurable, so this is a reversible decision rather than an ideological one.

### Why dual `types` per condition

```jsonc
"import":  { "types": "./dist/index.d.ts",  "default": "./dist/index.js" },
"require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
```

A single `.d.ts` makes `require()` consumers silently load ESM-shaped types.
`attw` fails the build when this regresses, and it reports across all four
resolution profiles (`node10`, `node16` from CJS, `node16` from ESM, `bundler`).

### `sideEffects: false`

Required for tree shaking to work at all. It is only safe because the package
never imports CSS for its side effects in JS and never registers a global handler
at module scope. `tests/conventions.test.ts` enforces the CSS half; the barrel
enforces the other half by containing only re-exports.

### Build ordering, and why it is not cosmetic

`npm run build` wipes `dist/` before building. tsup's `clean` option removes files but
leaves empty directories behind, so a renamed or deleted component leaves a ghost
directory that any tooling listing `dist/` reads as a published component. Found on
Windows during setup.

`npm run verify` builds **before** running tests, because some tests resolve the real
published artefacts. Running tests first would let them observe a stale `dist/`.

The CSS lint runs _inside_ `npm run build`, not only in `verify`. That was found the
hard way: with the lint only in `verify`, a bare `npm run build` cheerfully assembled a
stylesheet containing an unprefixed class. A gate nobody invokes on the path that
produces the artefact is not a gate.

---

## 2. Styling

### Decision

Plain CSS in a single opt-in stylesheet plus per-component CSS files. CSS custom
properties for theming. No CSS-in-JS, no runtime style injection, no `sx` prop.

```ts
import "uireload/styles.css";
```

### Why not CSS-in-JS

| Library                                  | Cost                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Emotion / styled-components              | ~13 kB runtime, a `StyleSheet` singleton, SSR setup, and a hydration ordering problem |
| vanilla-extract / `@vanilla-extract/css` | Excellent, but requires the consumer's bundler to run our plugin                      |
| Tailwind / UnoCSS on our side            | Ships a compiler dependency to consumers                                              |

The deciding factor is **CSS isolation**. A consumer who already uses Tailwind,
CSS modules or a design system must be able to drop UIReload in without a plugin
or a style-attribute collision. Plain CSS files work everywhere, including inside
existing build pipelines.

The trade-off, stated plainly: no automatic dark mode, no per-prop style overrides,
and component CSS ships even if the component is never imported. The mitigation is
`sideEffects: false` plus a ~3 kB gzipped stylesheet.

### Why opt-in rather than auto-injected

Automatic injection is friendlier for the first 5 minutes and a liability forever:
it breaks CSP without `unsafe-inline`, forces a decision about injection order, and
makes SSR output depend on import order in a bundler. One explicit import at the
application root is a better long-term trade.

### Why the stylesheet is assembled by our own script

This one was discovered by building it, not by reasoning about it.

tsup's `copy` loader renames a component stylesheet to a content-hashed file
(`widget-BHSVXUOB.css`) at the output root and flattens the directory structure. That
is fine for an application, where the bundler resolves the import, but it makes the
file **unreachable from the published stylesheet**: a consumer importing
`uireload/styles.css` would have got tokens and base styles with none of the component
rules, and every component would have rendered unstyled.

Silently shipping unstyled components is not an acceptable failure mode, so
`scripts/bundle-css.mjs` assembles `dist/index.css` itself:

1. The `@layer` order declaration, first, or it would not order anything.
2. `src/theme/tokens.css`.
3. `src/index.css` (base and utilities).
4. Every `src/components/<name>/*.css`, in sorted order.

No `@import` survives into the output, so the published file is self-contained with no
runtime resolution step.

Two rules follow from this and are enforced:

- **Component CSS must wrap its rules in `@layer uireload.components`.** Unlayered
  rules jump the declared layer order and would beat consumer overrides. The bundler
  fails the build rather than emitting them.
- **A component's TypeScript must not import its own stylesheet.** That would make
  `sideEffects: false` untrue and duplicate the rules in every consumer bundle.
  `tests/conventions.test.ts` asserts it.

### Why not CSS Modules

Considered and rejected. This was tested against our actual build, not reasoned about
abstractly, and the result was decisive.

**tsup has no CSS Modules support.** A `.module.css` entry builds to an empty
namespace:

```js
// probe.module.css
var probe_default = {}; // no class names
var x = probe_default.root; // undefined
```

Forcing `loader: { ".module.css": "local-css" }` produces identical output: the option
is accepted and ignored. Vitest _does_ resolve the same file correctly
(`{ root: "_root_5fc83c" }`), so the failure mode is green tests and a broken package,
with no error anywhere. Supporting it would mean a new build dependency, which
`tests/package-structure.test.ts` exists to forbid.

**Beyond the build, hashed names break the published theming contract.** The whole
escape hatch is that a consumer can write `.uir-dialog__title { … }` or
`[data-state="open"]`. Under CSS Modules the first string does not exist in our shipped
CSS, and only `data-*` survives — that is, the isolation is redundant with what we
already have.

**What we get instead**, all machine-checked by `scripts/check-css.mjs` at build time:

| Guarantee                     | Mechanism                         |
| ----------------------------- | --------------------------------- |
| No collision with host styles | `uir-` prefix on every class      |
| Predictable override order    | `@layer`                          |
| A stable styling surface      | `data-*` state attributes         |
| No direction-dependent CSS    | Logical properties, lint-enforced |

The one variant that would work is hashed internals plus exported stable part names
(`data-uir-part="root"`). It needs the same new build dependency, moves the override
story from CSS to markup, and makes the published stylesheet un-inspectable. Rejected.

### CSS isolation mechanics

1. **Namespace.** Every class is `uir-<component>__<part>`. Enforced at build time by
   `scripts/check-css.mjs`, not only in tests: `verify` builds before it tests, so a
   test-only check would let a leak reach `dist/index.css` first.
2. **Layers.** Library rules live in `@layer uireload.*` with an explicitly
   declared order. Consumers can join the layer stack and win without specificity
   games.
3. **No `!important`.** With one documented exception: restoring the UA's
   `[hidden]` rule, which CSS resets routinely strip.
4. **State via `data-*`, not classes.** `data-state="open"` rather than
   `.uir-dialog--open`. Consumers can then target states without knowing our class
   naming scheme.

---

## 3. Theming

### Decision

CSS custom properties only. No provider, no context, no JavaScript that reads a
token.

```css
[data-theme="acme"] {
  --uir-accent: #0b6;
  --uir-radius: 2px;
}
```

### Why no `ThemeProvider`

This was the most contested decision, so here is the full argument.

The case _for_ a provider: it is the idiomatic React pattern, it can compute
derived colors in JS, and it gives a place to read a user's preference.

The case _against_, which won:

1. **No hydration surface.** A provider that reads `prefers-color-scheme` or
   `localStorage` must either render `null` on the server (flash of unstyled
   content) or guess (hydration mismatch). CSS `@media` has neither problem
   because the browser resolves it after hydration.
2. **No re-render storms.** Every theme change currently costs zero React renders.
   With a provider, every consumer of the context re-renders.
3. **Scoped overrides for free.** Custom properties inherit. A consumer can theme
   one dialog differently with one inline `style`, with no provider and no
   `sx`-style escape hatch to design an API around.
4. **One less thing to configure.** "Install and import one file" is a materially
   better first-run experience than "install, wrap your app, choose a provider
   import."

What we give up: derived colors computed in JS, and enforcement of a theme's
completeness. Both are recoverable. A malformed theme shows up immediately as
unstyled UI, which is a fast, obvious failure.

### What is enforced

`src/theme/tokens.ts` declares the token contract as a type, and
`tests/conventions.test.ts` asserts `tokens.css` defines every token. Renaming a
token is a breaking change and the test makes that visible.

`TOKENS` is exported publicly so tooling and consumers can reference token names
without duplicating string literals.

---

## 4. Internationalization

### Decision

No provider, no context, no translation-library dependency. Every component takes
an optional `messages` prop and falls back per key.

```tsx
<Dialog messages={{ "dialog.close": "Fermer" }} />
```

### Why per-instance `messages`

Same reasoning as theming, plus one more: **partial catalogs must be valid.** When
a minor release adds a new message, existing translations keep working and only
the new key needs translating. A context-based design usually means "replace the
whole dictionary", which turns every new string into a breaking change for
translators.

The cost is more typing at each call site. That is acceptable, and the
`MessageKey` type means the keys are checked.

### Message contract

- Keys are namespaced `<component>.<key>`. Renaming a namespace is breaking.
- Values are plain strings. A component may split a message into multiple text
  nodes for placeholders, which keeps each fragment translatable in isolation.
- `{name}` placeholders; `{{` and `}}` are literal braces.
- Unknown placeholders render verbatim rather than as `undefined`, so a missing
  value is an obvious bug in development instead of text a user sees.

---

## 5. Direction and RTL

### Decision

Direction is read from the DOM, never from context and never during render.

```ts
const direction = useDirection(rootRef); // resolves in a layout effect
```

Library CSS uses **logical properties only**. `npm run lint:css` fails the build
on `margin-left`, `left: 0`, `text-align: right`, and `box-shadow` declarations whose
net x-offset is non-zero.

### Why DOM-based direction

The `dir` attribute inherits through the document. Reading it means the library
works correctly in portals, shadow roots, and nested direction changes, with no
provider and no chance of the React tree and the DOM tree disagreeing. A
context-based implementation and a DOM-based one can only ever agree by luck.

### Why a lint rule rather than a review checklist

Physical CSS looks correct in an LTR test and only breaks once someone runs the
app in Arabic. Storybook cannot catch that in CI, and review reliably misses it.
A lint rule is the only enforcement that actually holds.

### The `box-shadow` case

A non-zero x-offset means "cast to one side", and that side flips in RTL. The lint
flags it and asks for a symmetric shadow.

It sums the x-offsets across a whole comma-separated list rather than looking only at
the first layer, because cancelling layers (`2px 0 …, -2px 0 …`) are the idiomatic way
to write a two-sided glow and would otherwise be a false positive.

Remaining limitation: it is a heuristic. A deliberately asymmetric shadow that is
correct in both directions needs `/* uir-css-disable */` and a comment explaining
why. That is the correct trade — occasional justified suppressions beat silent
breakage, because a suppression is a reviewable line and a bug is not.

---

## 6. Accessibility

### Decision

The WAI-ARIA Authoring Practices is the specification, not inspiration. Focus
management lives in `src/internal/focus.ts` for every component, not
re-derived per component.

Provided primitives:

- **Roving tabindex** (`useRovingFocus`) for composite widgets. Exactly one member
  is a tab stop; arrow keys move focus and move the tab stop with it.
- **Focus trap** (`useFocusTrap`) for modal surfaces, using a scoped capture-phase
  `keydown` listener and an explicit restore.
- **Focus restoration** on deactivation, so closing a dialog returns focus to the
  control that opened it.
- **The template wires up a full keyboard path**, so the conventions are copied
  rather than re-invented.

### Notable rejections

- **Sentinel `<div tabindex="-1">` nodes** for focus trapping. They leak into the
  accessibility tree as unnamed focus stops and cause most "focus jumped somewhere
  odd" reports in component libraries.
- **Reading `tabindex="-1"` elements as group members.** The tabbable selector
  deliberately excludes them, which makes it useless for roving focus. Roving
  groups use their own marker attribute; `getRovingItems` exists for that reason
  and is tested against it.

### The rule that shapes everything else

> The consumer's handler runs first. If it calls `preventDefault()`, our internal
> behaviour is skipped.

Consumer-first is the only ordering where `preventDefault()` is a meaningful
opt-out. Running our handler first would mean the state had already changed by the
time the consumer could veto it.

---

## 7. SSR and hydration

### Rules

1. No `window`, `document` or `matchMedia` during render. Effects only.
2. Anything environment-dependent returns a stable default on the first render and
   syncs in an effect, so server and client markup match.
3. Effects that touch layout use `useIsomorphicLayoutEffect`.

`tests/ssr.test.tsx` renders with `react-dom/server` and asserts React logs no
hydration warnings. `renderHook` flushes effects inside `act`, so asserting
"first render returns the default" requires capturing the value from inside the
hook callback. Several tests are written that way, with a comment explaining why.

### Hydration is a tested property, not an aspiration

React logs a warning on mismatch instead of throwing. Those tests spy on
`console.error` and assert on it, because otherwise the assertion is vacuous.

---

## 8. Tree shaking and bundle size

`scripts/report-sizes.mjs` reports raw and gzipped size per entry point and fails
on a budget: 4 kB gzipped for the barrel, 5 kB per component.

"Lightweight" is a requirement, so it has a measurement. Chunks are excluded from
the entry-point listing and reported separately, since a shared chunk is a
dependency of entries rather than an entry.

---

## 9. Testing

Vitest + Testing Library, tests colocated with the code they cover.

`tests/conventions.test.ts` and `tests/package-structure.test.ts` are
architecture tests. They encode rules that are easy to violate and expensive to
notice late: no runtime dependencies, `sideEffects: false`, namespaced CSS, no
physical direction properties, every token defined, no cross-component imports,
no `src/internal` leaking into the public entry, no CSS imported from JavaScript.

`tests/published-package.test.ts` goes further: it creates a scratch consumer project
whose `node_modules/uireload` points at the repository, then resolves imports through
**Node's and TypeScript's real resolvers** against the built artefacts, from both ESM
and CommonJS, under `node16` and `bundler` module resolution. It asserts that deep
imports are blocked and that internal utilities do not leak from the barrel.

An `npm install` of a packed tarball was the first approach and was rejected: it
resolves peer dependencies over the network, which makes the test slow and dependent
on registry availability for something that is purely about module resolution. The
symlink approach needs no network and exercises the same `exports` map.

These are deliberately not "meta tests" to be pruned. Each corresponds to a
requirement in the brief, and several caught real defects during setup:
`sync-exports` overwriting the root entry, tsup dropping component entries on
Windows due to backslash paths, and the stylesheet not including component rules.

---

## 10. Component authoring

Detailed in `src/components/README.md`. The summary:

- One folder per component, owning its CSS, types, tests, stories and docs.
- `index.ts` is the only public module in a component folder.
- Copy `src/components/_template`. It is excluded from the build but type-checked,
  linted and tested, so it cannot rot.
- `useControllableState` for any open/closed or checked state.
- Folders starting with `_` are never published.

### Cross-component consistency

Consistency across components is **structural, not procedural**.
`docs/foundations.md` is the human-readable contract; two things enforce it:

| Mechanism                | What it holds                                                                    |
| ------------------------ | -------------------------------------------------------------------------------- |
| `src/foundations.ts`     | `Variant`, `Tone`, `Size`, `CONTROL_TOKENS` — the vocabulary, exported publicly. |
| `--uir-control-*` tokens | Every dimension, in `src/theme/tokens.css`. A hardcoded size is a test failure.  |

A new control therefore has no decisions left to make about its own size, emphasis,
intent or state colours. It writes a stylesheet against tokens that already exist, which
is why `Button`, `IconButton`, `ToggleButton` and `ToggleButtonGroup` agree without any of
them knowing about the others — three of the four compose `Button` and inherit its
behaviour outright.

Three axes are separated rather than conflated, which is the main divergence from both
reference libraries: **emphasis** (`variant`: `ghost` / `outline` / `solid`), **intent**
(`tone`: `neutral` / `accent` / `positive` / `danger`) and **size** (`sm` / `md` / `lg`).
One common shape folds intent into `color` and emphasis into `variant`; the other folds both
into a single `design` property.
Separating them is what makes `variant="solid" tone="danger"` expressible — a destructive
primary action — instead of needing a ninth design value.

### What the first four components changed in the foundations

Authoring them surfaced defects that no amount of review would have found, all of which
are now fixed and guarded by tests:

- A **multi-line CSS comment** was parsed as CSS by the linter, which worked line by line.
- **`--uir-success` and `--uir-border-strong` failed WCAG** while looking correct.
  Contrast is now measured in `tests/contrast.test.ts`, not reviewed.
- A **per-tone single foreground** made `ghost` and `outline` labels invisible.
- **Unknown props leaked to the DOM** on `ToggleButtonGroup`.
- **Storybook rendered composed components unstyled**, because stories imported only their
  own stylesheets. The preview now loads the assembled `dist/index.css`.

---

## Known limitations

Stated rather than hidden:

- **No component-level CSS splitting.** One stylesheet, ~3 kB gzipped. A consumer
  who imports one component still downloads all component CSS. Per-file CSS is a
  build change away if bundle data justifies it, and it would need the export map
  to gain per-component stylesheet entries.
- **`box-shadow` linting is heuristic** and may need an inline `uir-css-disable` for
  a deliberately asymmetric shadow.
- **`useDirection` does not observe a `dir` attribute added to an ancestor that
  previously had none.** We cannot watch an ancestor we do not yet know about.
  Setting `dir` on `<html>` or on an element that already has it, which is what
  real applications do, works correctly.
- **The `typesVersions` `*` fallback** covers legacy `moduleResolution: node`
  consumers. That resolution mode is on its way out; the map is a courtesy.
- **Coverage thresholds start low** (60–70%) because the library is currently
  infrastructure. Raise them deliberately as components land.
- **Per-subtree light and dark cannot coexist.** Auto dark mode is decided on
  `:root:not([data-uir-scheme])`, so a `light` pin below the root arrives after those
  values are inherited and cannot undo them. Plain CSS cannot express it. Pin the scheme on
  `<html>`; `docs/theming.md` has the table of what works where.
- **`ToggleButtonGroup` requires `ToggleButton` children directly.** It rebuilds each child
  to attach selection, which needs each child's `value` prop. A child that is a component
  or a fragment hides that prop, and the group logs a development error rather than
  failing silently. A context would remove the constraint; recorded in `docs/roadmap.md`.
- **The "no components yet" tripwire has been retired.** It fired on the day the first
  component landed, as designed, and was replaced with positive self-maintaining
  invariants: every component must be exported, re-exported from the barrel, and named to
  match its folder.
