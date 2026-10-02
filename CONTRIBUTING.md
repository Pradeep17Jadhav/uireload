# Contributing

## Setup

```bash
npm install
npm run verify
```

`verify` runs everything CI runs. Run it before opening a pull request; running it
piece by piece is slower than fixing what it reports.

## Adding a component

```bash
cp -r src/components/_template src/components/thing
# rename every `example` occurrence to `thing`
npm run sync:exports
npm run storybook
```

Then work through the definition of done in `src/components/README.md`.

`npm run sync:exports` adds the `"./components/thing"` entry to `package.json`.
Forgetting it fails `npm run check:pkg` and
`tests/package-structure.test.ts`; that is intentional.

## The conventions that are enforced

These are checked in CI, not left to review:

| Rule                                             | Enforced by                          |
| ------------------------------------------------ | ------------------------------------ |
| No runtime dependencies                          | `tests/package-structure.test.ts`    |
| `sideEffects: false`                             | `tests/package-structure.test.ts`    |
| One export entry per component                   | `scripts/sync-exports.mjs --check`   |
| `types` before `default`, separate ESM/CJS types | `publint`, `attw`                    |
| CSS class names prefixed `uir-`                  | `npm run lint:css` (runs in `build`) |
| Logical CSS properties only                      | `npm run lint:css` (runs in `build`) |
| No asymmetric `box-shadow` x-offsets             | `npm run lint:css` (runs in `build`) |
| No `!important` (one documented exception)       | `tests/conventions.test.ts`          |
| Every token in `TOKENS` defined in CSS           | `tests/conventions.test.ts`          |
| No runtime style injection                       | `tests/conventions.test.ts`          |
| No CSS imported from JavaScript                  | `tests/conventions.test.ts`          |
| Component CSS in `@layer uireload.components`    | `scripts/bundle-css.mjs`             |
| No cross-component imports                       | `tests/package-structure.test.ts`    |
| `src/internal` not exported publicly             | `tests/package-structure.test.ts`    |
| No DOM access during render                      | `tests/ssr.test.tsx`                 |
| Subpaths resolve from ESM, CJS, node16, bundler  | `tests/published-package.test.ts`    |
| Export map generator is correct                  | `scripts/build-exports.test.ts`      |
| CSS lint rules are correct                       | `scripts/css-rules.test.ts`          |
| Bundle size budget                               | `npm run size`                       |
| Every message key namespaced and documented      | `src/i18n/catalog.test.ts`           |

## Adding a component

The four shipped components (`button`, `icon-button`, `toggle-button`,
`toggle-button-group`) are the reference implementations. Read
`docs/foundations.md` first — it is the consistency contract they all implement, and
the token layer in `src/theme/tokens.css` is what makes it structural rather than
aspirational.

## Adding a component

The four shipped components (`button`, `icon-button`, `toggle-button`,
`toggle-button-group`) are the reference implementations. Read
`docs/foundations.md` first: it is the consistency contract they all implement, and
the `--uir-control-*` token layer is what makes it structural rather than aspirational.

## Releasing

Publishing is driven by a git tag, never by a push to `main`. A tag is the only
artefact that records "this exact commit is 0.1.0"; a push can land after the version
was chosen and publish the wrong code. `npm versions` are also immutable, so a
mistake cannot be fixed by publishing again.

```bash
npm version 0.1.0 --no-git-tag-version   # edits package.json only
# edit CHANGELOG.md: move [Unreleased] under a dated [0.1.0] heading
git commit -am "release 0.1.0"
git tag v0.1.0
git push origin main --follow-tags
```

`.github/workflows/release.yml` then runs `release:check` (which is `verify`),
asserts the tag matches `package.json` via `scripts/check-tag.mjs`, and publishes with
`--provenance`.

Two requirements that are not optional:

- **Provenance needs CI.** `publishConfig.provenance` is set, and npm only mints
  Sigstore attestations from GitHub Actions or GitLab CI on a cloud-hosted runner. A
  local `npm publish` will not produce provenance. This is why the workflow exists
  rather than a documented local command.
- **`repository` in `package.json` must match where you publish from**, case-sensitive.
  npm verifies the two match before it will attest to a build.

Setup, once: create an npm automation token (not a personal token) and add it as the
`NPM_TOKEN` repository secret. The workflow declares no GitHub environment, so that is
the only credential required. Trusted publishing via OIDC removes the token entirely if
you would rather not keep one.

To gate the upload behind reviewers later, add `environment: npm` to the `publish` job
and create the environment. GitHub fails a job whose environment does not exist, which
is why it is absent rather than present and broken.

`package.json` version and the `CHANGELOG.md` heading are the only two things that
have to agree. Nothing derives the version from git tags.

## Adding a runtime dependency

The answer is no. If a feature genuinely needs one, it needs an ADR in
`docs/architecture.md` explaining the size cost against the "lightweight"
requirement. A dependency added in a component PR will be rejected.

## Adding a dependency at all

Dev dependencies are fine when they buy real leverage. Two precedents worth
copying:

- `publint` and `attw` because packaging correctness is invisible until it is not.
- `scripts/check-css.mjs` because RTL regressions are invisible in review.

## Storybook

Stories are colocated with components and must import through the published
specifier (`uireload/components/<name>`). If a story can only be written via a
relative import, the export map is wrong and Storybook is where you find out.

Use the toolbar to check `dir="rtl"`, dark, high-contrast and compact density. The
a11y addon is set to `test: "error"`, so violations fail rather than warn.

## Definition of done

A component is done when:

1. `npm run verify` passes.
2. Tests cover rendering, keyboard interaction, controlled and uncontrolled state,
   and `dir="rtl"`.
3. Storybook stories cover each state that matters, including dark and
   high-contrast.
4. `README.md` documents props, keyboard support, and the CSS contract.
5. `axe` reports zero violations.
6. No new runtime dependency.
7. Under its size budget.
