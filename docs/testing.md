# Testing

Vitest + Testing Library. Tests are colocated with the code they cover.

```bash
npm test              # run
npm run test:watch    # watch
npm run test:coverage # with thresholds
```

## Two kinds of test

### 1. Component tests

Colocated as `<name>.test.tsx` next to the component. They assert behaviour through
the DOM, using role- and name-based queries.

Required coverage for every component:

1. Rendering, including the accessible name.
2. The full keyboard path, per the WAI-ARIA APG pattern.
3. Controlled and uncontrolled state.
4. `dir="rtl"`.
5. Consumer `preventDefault()` opting out of internal behaviour.

Copy the shape from `src/components/_template/example.test.tsx`.

### 2. Architecture tests

`tests/conventions.test.ts` and `tests/package-structure.test.ts`. These encode
rules that are easy to violate and expensive to notice late:

| Assertion                              | Requirement it protects         |
| -------------------------------------- | ------------------------------- |
| No runtime dependencies                | "Lightweight"                   |
| `sideEffects: false`                   | Tree shaking                    |
| One export entry per component         | Independent consumption         |
| `types` before `default`, dual ESM/CJS | Correct types for CJS consumers |
| CSS classes prefixed `uir-`            | CSS isolation                   |
| Logical properties only                | RTL                             |
| No `!important` (one exception)        | Consumer CSS can always win     |
| No CSS imported from JavaScript        | Tree shaking                    |
| Component CSS in the component layer   | Predictable cascade             |
| Every token in `TOKENS` defined in CSS | Theming contract stability      |
| No runtime style injection             | CSP and SSR                     |
| No cross-component imports             | Architectural boundaries        |
| `src/internal` not publicly exported   | Internal API can change freely  |
| No DOM access during render            | SSR safety                      |

These are not meta-tests to be pruned. Each corresponds to a requirement in the
project brief, and several caught real defects during setup.

### 3. Published-package tests

`tests/published-package.test.ts` creates a scratch consumer project whose
`node_modules/uireload` points at the repository, then resolves imports through
Node's and TypeScript's real resolvers against the built artefacts: ESM, CommonJS,
`moduleResolution: node16`, and `bundler`. It also asserts that deep imports are
blocked and that internal utilities do not leak from the barrel.

These tests require a build. `npm run verify` builds before testing so they never see
a stale `dist/`.

An `npm install` of a packed tarball was the first approach and was rejected: it
resolves peer dependencies over the network, which makes the test slow and dependent
on registry availability for something that is purely about module resolution.

## Querying

Use role- and name-based queries. They assert what a user can perceive and fail
when the ARIA contract breaks.

```tsx
screen.getByRole("button", { name: "Save" });
screen.queryByRole("alert");
```

Avoid `getByTestId` except for cases with no accessible representation, and never
assert on class names for behaviour. Assert on `data-*` for state and on roles and
names for semantics.

## Direction

```tsx
renderWithProviders(<Button />, { dir: "rtl", scheme: "high-contrast" });
```

Imported as `import { renderWithProviders } from "uireload-test";`.

`dir` is applied to a real DOM node, not mocked in JavaScript. A mocked direction
would let a component pass RTL tests while still being broken for real RTL pages.

A published component's test imports the component through the package specifier
(`uireload/components/button`), which `vitest.config.ts` aliases back to source.
`_template` is the exception, since it is deliberately not in the export map.

## SSR and hydration

`tests/ssr.test.tsx` renders with `react-dom/server` and hydrates with
`react-dom/client`. React logs a warning on mismatch rather than throwing, so those
tests spy on `console.error` and assert on it. Without that spy the assertion is
vacuous.

`renderHook` flushes effects inside `act`, so it only observes the post-effect
value. To assert "first render returns the default", capture the value from inside
the hook callback:

```ts
const duringRender: boolean[] = [];
renderHook(() => {
  const matches = useMediaQuery(query, false);
  duringRender.push(matches);
  return matches;
});

expect(duringRender[0]).toBe(false);
```

This is not a workaround. It is the only way to observe the render-phase value, and
it is exactly the value a server render produces.

## Setup

`tests/setup.ts` provides:

- `expect.extend(jest-dom matchers)`. Called explicitly rather than via a bare
  `@testing-library/jest-dom` import, because that import only registers itself
  when a global `expect` exists, which is not the case under Vitest's module-scoped
  runner.
- `ResizeObserver`, `DOMRect` and `matchMedia` polyfills. jsdom's `matchMedia`
  returns `matches: false` for everything, which silently hides SSR and hydration
  bugs, so tests that need a specific value install their own stub via
  `stubMatchMedia`.
- A `requestAnimationFrame` shim.
- A `document.body` reset after each test, because leaked nodes cause false
  positives in role queries.

## Fixtures

Do not reach into `node_modules` for test fixtures, and do not pull in a fixture
library for one component. Put fixtures in the component's folder.

## Coverage

Thresholds start low (60–70%) because the library is currently infrastructure. Raise
them deliberately as components land rather than letting coverage drift down.

`src/index.ts` and the `_template` folder are excluded: the barrel is re-exports
only, and the template is covered by its own file-level tests.

## What is not automated

- Screen reader output (NVDA, JAWS, VoiceOver).
- Windows High Contrast Mode.
- Visual regression.

These are manual checks listed in [`accessibility.md`](./accessibility.md). Visual
regression was considered and deferred: snapshots of a design system produce churn
without catching the bugs that matter, and the Storybook toolbar plus
high-contrast tokens cover the cases snapshots are usually added for.
