# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`Divider`, `Skeleton`, `Avatar`, `Alert`.** Four components with no shared theme
  beyond the token contract.
  - **`Divider`** renders identically whether or not it is in the accessibility
    tree, so `decorative` is an explicit prop: `role="presentation"` rather than
    `aria-hidden`, which does not stop an announcement when focus lands inside. A
    string `label` is written to `aria-label` too, because `role="separator"` is a
    **structure** role and structure roles are not named from their contents — the
    text inside the rule looks like its name and is not one.
  - **`Skeleton`** announces almost nothing: a `role="status"` region named
    `"Loading"`, and every bar `aria-hidden`. A screen reader describing four grey
    rectangles has told the user nothing, and reading it four times delays the
    announcement that matters. `lines={0}` renders one bar rather than nothing,
    because an empty placeholder is the layout shift the component exists to
    prevent.
  - **`Avatar`** falls back to its initials when the image fails — a revoked avatar
    URL is normal, not exceptional, and a broken-image glyph is worse than letters.
    The image and the initials are alternatives, never both: rendering both
    announces "Ada Lovelace, AL". `initialsFrom` is exported so a consumer derives
    them the same way, and the component takes `initials` rather than a `name`
    because splitting a display name is a guess it would get wrong for every name
    that is not "First Last".
  - **`Alert`** derives both `role` and `aria-live` from `tone`, so `tone="danger"`
    becomes `role="alert"` without a second prop — the one tone that means "this
    will cost you" is the only one that justifies interrupting a screen reader.
    Both remain overridable, and a contradictory pair warns in development. The
    alert never dismisses itself: `onDismiss` reports and stays.
- **`Tooltip`.** A focusable `<span>` trigger, portalled and positioned by the
  shared overlay algorithm. `delay={400}` on hover and **no delay on focus**,
  because a keyboard user has arrived deliberately and there is no
  accidentally-passed-over case to guard against; `hideDelay={200}` so moving the
  pointer onto the tooltip to read it does not dismiss it. `describe` chooses
  between `aria-describedby` and `aria-label`, because a description supplements a
  name and cannot replace a missing one — the difference between an icon button
  that is announced and one that is not. The surface is always in the DOM and
  `hidden` when closed, since a description that appears with its element is never
  observed.
- **`Drawer`.** `modal` defaults to **`false`**, which is the component's most
  consequential decision: modal is a focus trap and a scroll lock, and a
  navigation drawer that traps focus is worse than one that does not, because the
  user cannot reach the item they opened it to change. A non-modal drawer still
  takes focus on open — otherwise `Tab` never gets inside and the drawer is
  unreachable — and does not trap. `placement` is logical, not `left` / `right`.
  `onClose(reason)` is the request and `onDismiss(reason)` is the fact, matching
  `Dialog`, `Popover` and `Snackbar`.
- **`Pagination`.** A named `<nav>` of real buttons. `aria-current="page"`, never
  `aria-pressed`: the current page is a position, not a toggle. First and last are
  always one click away, the gaps are `aria-hidden` because announcing "ellipsis"
  announces a piece of CSS, and a `role="status"` region announces "Page 3 of 12"
  — which is the part neither reference API has, and the fix for a screen reader
  user pressing a page number and being told nothing.
- **`Stepper`.** `linear` by default, and the default decides which steps exist as
  **buttons**: the steps behind the current one are activatable, because a wizard
  you cannot go back in is a wizard people abandon, and the steps ahead are plain
  text. Unreachable steps are `<div>`s rather than disabled buttons — a disabled
  control is announced as "unavailable", which also claims it is a control. The
  current step's header is therefore never a button, so `aria-current="step"` is
  written to whichever element the step is; putting it on the button alone would
  make the one thing the component communicates vanish in its default mode.
  `errorText` is `aria-describedby`-ed onto the header, with per-instance ids so two
  steppers on a page cannot announce each other's failures.

### Changed

- `BASE_MESSAGES` gains `common.page`, `common.previousPage`, `common.nextPage`,
  `common.firstPage`, `common.lastPage`, `common.step` and `common.of` (the last
  with a `{total}` placeholder, so "Page 3 of 12" is not concatenated — the word
  order is the translator's to choose).

## [0.3.0] - 2026-10-02

### Added

- **`Textbox`, `Select`, `Switch`, `Popover`, `Dialog`.** Five components, completing
  the form-control and overlay set. Every one renders the platform's control where
  one exists — a real `<input type="radio">` per radio option, a real
  `<input type="range">` per slider thumb, a real `<label for>` — so role, name,
  state, form participation and keyboard behaviour are reimplemented nowhere.
- **`Checkbox`, `RadioGroup`.** The remaining two binary and single-choice controls.
  Both draw their box and dot in CSS over a transparent input that covers the whole
  row, so there is one focusable element rather than a focusable box and a clickable
  label that have to be kept in agreement. `RadioGroup` takes an `options` array
  rather than children: a children-based group has to read each child's props to
  find its value, which silently misbehaves the moment a child is wrapped in a
  component or a fragment.
- **`Slider`.** One thumb or a range, from `value` length rather than a separate
  `thumbs` prop, because a second source of truth for one fact is a prop every
  consumer has to keep in step. Arrows, `Home` and `End` are left to the platform
  — handling them here as well would move the thumb twice per press — and the
  component adds only what a native range input lacks: `PageUp`/`PageDown`, `+`/`-`
  and `Escape`, plus the neighbour clamp that stops two thumbs crossing, since a
  range whose minimum is above its maximum renders fine and lies to everyone who
  submits it.
- **`Chip`.** Three `intent` states rather than two booleans. A chip that is both
  activatable and removable has two tab stops and two accessible names, which is
  why the third state exists rather than a `clickable` flag alongside a
  `deletable` one. `onRemove` reports and the chip stays — the list is the
  consumer's state.
- **`Text`.** Body prose and six heading levels. `variant="h2"` renders an `<h2>`:
  the visual size and the document outline are one prop, so they cannot drift
  apart, which is the failure a large-font `<div>` produces and the one a
  screenshot cannot show. `as` is the escape hatch for when the automatic element is
  wrong.
- **`Link`.** A real `<a>`, with `href` optional — an `<a>` with no `href` has no
  link role and no tab stop, which is the honest state for a link a router has not
  resolved, and is why `rel` is warned about rather than defaulted for
  `target="_blank"`.
- **`Tile`.** `interactive` and `href` decide the rendered element, because "the
  whole card is clickable" is a real interaction and a `<div>` with a `tabIndex`
  and a `keydown` handler only gets close to it. `flat` is the default elevation:
  a page of raised cards reads as a page of popups.
- **`TabBar`.** `role="tablist"` over real `<button role="tab">` elements with
  manual activation by default — arrows move focus, `Enter` or `Space` moves
  selection — because arrowing past four tabs under automatic activation fires four
  requests, and on a tab set not wrapped in a router destroys the form data on the
  tab the user left. Panels are hidden rather than unmounted unless `lazy` is set,
  so find-in-page still finds text in a tab you are not looking at.
- **`Snackbar`.** The timer pauses on hover **and** on focus, resuming with the
  time that was left rather than a fresh duration, and the close reason
  (`timeout` / `dismiss` / `escape`) is reported so a consumer can tell a timed-out
  message from a dismissed one. The live region exists from the first render and a
  closed snackbar is `visibility: hidden` rather than unmounted: a region created
  at the same moment as its text is frequently not announced at all.
- **`docs/foundations.md` §6, "Body text and headings".** The type scale,
  specified: heading sizes are literals because a heading scale is a fixed
  relationship between six sizes, while body text reads tokens because it genuinely
  varies by colour scheme.
- `axe` coverage for all ten, in `tests/accessibility.test.tsx`.

### Changed

- `tests/setup.ts` gained two jsdom shims, both documented in place. A range input
  has no keyboard behaviour in jsdom, where every browser steps the value and fires
  `change` — so `Slider`'s keyboard tests could not be written at all. And
  `setSelectionRange` throws for any non-text-entry input, which killed every
  `Home`/`End` test before it reached an assertion.

### Fixed

- **`RadioGroup`'s first arrow press did nothing.** With nothing selected, stepping
  from the selection computes `(-1 + 1) % 3 === 0` and re-selects the option the
  user is already standing on. Arrows step from focus instead.
- **`RadioGroup`'s `clearable` silently did nothing.** A radio that is already
  checked fires no `change` event, so a clear implemented on `change` can never
  empty a group. It is carried by `click`.
- **`Slider` never committed a keyboard change.** `onValueCommit` is now keyed on
  whether a pointer button is down, not on remembering a keypress — the platform
  fires `change` identically for a drag and an arrow press, and a keypress-based
  approach depends on handler ordering that is not guaranteed.
- **`Link` swallowed `target` and `rel`.** Both were destructured for a development
  warning and never re-applied, so the link rendered looking right and opened in
  the same tab whatever the consumer asked for.
- **`Link`'s disabled state left the tab order.** The comment argued that an
  `<a>` without an `href` stays focusable. It does not: the platform gives it no
  tab stop and no link role. The `href` is kept and the navigation stopped with
  `preventDefault`.
- **`TabBar` dropped the badge from its own accessible name.** An `aria-label`
  derived from a plain-text label *replaces* the content, so `textValue` is now the
  only source and a plain-text label derives its name from the platform.
- **`Chip` was shorter than the target-size floor.** It scaled
  `--uir-control-height-sm` by `0.875`; a chip *is* a pointer target when
  activatable, so it now sits on the 24px minimum like every other control.
- **`TabBar` emitted an invalid `aria-controls`.** A tab with no panel pointed at
  an id that did not exist, which `axe` reports as critical. It is now omitted,
  and a consumer rendering their own panel associates it from the tab's `id`.
- `tests/published-package.test.ts` scaled its timeout to the component count. It
  spawns one `node` process per component per module format, and the default 5s was
  enough for nine components and not for fourteen — a failure that read as "your
  package is too slow" about a test simply doing more subprocess work.

### Not implemented

- **A separate `Title` component.** Recorded in `text/README.md` rather than
  answered with a thin alias. `Text` already renders real heading elements whose
  level is their rank, so `Title` would add a name and no behaviour.

## [0.2.0] - 2026-10-02

### Added

- **`docs/references.md`.** The provenance record for every component: which
  file and symbol behind each non-obvious API choice, and which behaviour was
  copied, renamed, narrowed or rejected. Agent-only, and not published.
- `tests/published-content.test.ts`, which fails the build when anything shipped
  names a reference library. It reads `dist/` rather than the source, because a
  source-level check would pass while a stale build still published the old
  comments, and it covers the `sourcesContent` of every source map, which embeds
  the entire original TypeScript.
- `tests/markdown.test.ts`, covering table well-formedness and other structural
  rules a prose file can violate silently.
- `npm run release:patch | release:minor | release:major`. One command per bump
  type: bump the version, release the `[Unreleased]` body under a dated heading,
  run `verify`, commit, tag, and push. The push is what publishes, because npm
  only mints provenance attestations from a supported CI provider.

### Changed

- **Provenance moved out of the shipped code.** Every published `.d.ts`,
  `dist/index.css` comment and source map is now free of third-party library
  names. The reasoning stays and is stated in terms of the widget, the ARIA
  pattern, WCAG or platform behaviour; only the attribution moved to
  `docs/references.md`. Naming another library in a shipped artefact also
  implied a port or compatibility relationship that does not exist.
- `docs/foundations.md` and the component `README.md` files rewritten to match,
  dropping the per-file citation lists that the provenance record now holds.

### Fixed

- **The template's story was published as a real component.** `index.json` listed
  `template-example--*` in the Storybook sidebar, so a screenshot sweep would pick
  up scaffolding. Negated `stories` globs were tried in two forms and neither
  excluded anything, so the template's story file is now
  `example.stories.template.tsx`, which the glob cannot match at all.
- **Comments left dangling by the de-attribution pass.** A line reduced to bare
  punctuation by a row-level replacement; caught by inspection, not by any tool.

## [0.1.0] - 2026-10-02

First release. Infrastructure plus the first four components.

### Added

- **Design foundations.** `docs/foundations.md` plus a `--uir-control-*` token layer and
  `src/foundations.ts`. Sizes, the emphasis ladder, the tone set, the six control
  states, shape, typography and truncation are specified once so components are
  consistent by construction rather than by review.
- **`Button`, `IconButton`, `ToggleButton`, `ToggleButtonGroup`.** The first four
  components.
- `VARIANTS` (`ghost` / `outline` / `solid`) and `TONES`
  (`neutral` / `accent` / `positive` / `danger`) split emphasis from intent, so a
  control never has to invent a `variant="danger"` that quietly means both louder
  and destructive.
- `ToggleButtonGroup` renders `role="radiogroup"` with roving tabindex and
  selection-follows-focus in single mode, and `role="group"` with individually
  tabbable pressed buttons in multiple mode.
- `useRovingFocus` gained `itemSelector` and `onNavigate`, so selection can follow
  focus without the focus helper assuming it.
- axe-core as a dev dependency, with `tests/accessibility.test.tsx` asserting zero
  violations per component in every colour scheme.
- `tests/theme-tokens.test.ts` asserts the dark palette declared for
  `data-uir-scheme` and for `prefers-color-scheme` cannot drift apart.

- Build pipeline: dual ESM/CJS output, per-component entry points, generated type
  declarations, published CSS as a stable artifact.
- Export map with explicit per-component subpaths, generated by
  `scripts/sync-exports.mjs` and verified by `publint` and `attw`.
- Theming contract: CSS custom properties, `light` / `dark` / `high-contrast`
  schemes, density presets, reduced-motion and forced-colors handling.
- i18n contract: namespaced message catalog, placeholder interpolation with literal
  brace escaping, per-key fallback so partial catalogs stay valid.
- Internal primitives: `useControllableState`, `useRovingFocus`, `useFocusTrap`,
  `composeHandlers`, `composeRefs`, `useDirection`, `useMediaQuery`,
  `useIsomorphicLayoutEffect`.
- RTL enforcement: `scripts/check-css.mjs` fails the build on unnamespaced class
  selectors, physical direction properties, and asymmetric `box-shadow` x-offsets.
- Bundle size budgets via `scripts/report-sizes.mjs`.
- Storybook with RTL, color-scheme and density toolbars, and the a11y addon
  configured to fail on violations.
- Testing infrastructure: Vitest, Testing Library, SSR and hydration tests,
  architecture tests covering packaging and CSS conventions.
- Component authoring template at `src/components/_template`.
- CI across Node 20 and 22 on Linux and Windows, plus dependency audit and a
  publish dry run.

### Fixed

- **`ghost` and `outline` labels were invisible** for the `accent`, `positive` and
  `danger` tones. Each tone set one foreground, which is correct for `solid` but painted
  an on-fill colour onto the page background. Tones now supply a role set with separate
  fill and unfilled foregrounds.
- **A neutral `solid` button looked identical to a neutral `outline` button.** It filled
  with `--uir-surface-raised`, which is white in the light scheme. The neutral tone has a
  surface ramp of its own now.
- **`--uir-success` and `--uir-danger` failed WCAG SC 1.4.3** at 3.30:1 and 4.24:1 as
  labels, and `--uir-border-strong` failed SC 1.4.11 at 2.56:1. Both semantic ramps are one
  step darker than a conventional 600/400 scale. `tests/contrast.test.ts` measures every
  tone x variant x scheme pair and fails below the threshold.
- **`selectionMode`, `value`, `defaultValue` and `onValueChange` leaked to the DOM** on
  `ToggleButtonGroup` as `selectionmode="single"` and friends, because they were read as
  `props.x` rather than destructured out of the rest props.
- **A `ToggleButtonGroup` child that is a component or fragment silently collapsed** to a
  single valueless, label-less button. It now logs a development error naming the problem.
- **Storybook rendered composited components unstyled.** Each story imported only its own
  stylesheet, so `ToggleButtonGroup` showed three default grey buttons. The preview now
  imports the assembled `dist/index.css`, which is what a consumer loads.
- **Pinning `data-uir-scheme="light"` on a subtree did nothing**, because the auto-dark
  rule lives on `:root:not([data-uir-scheme])`. The pin is now declared alongside `:root`,
  and `docs/theming.md` states where the attribute has to go.

- The CSS linter could not strip multi-line block comments, because it worked
  line by line. A comment that opened and closed on different lines had its prose
  parsed as CSS. `stripBlockComments` now runs over the whole file with line numbers
  preserved.

### Known limitations

Documented in [`docs/architecture.md`](./docs/architecture.md#known-limitations):
no component-level CSS splitting, heuristic `box-shadow` linting, no automated
screen-reader testing, and coverage thresholds still at their infrastructure-era
values.
