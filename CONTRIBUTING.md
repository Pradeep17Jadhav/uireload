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
| Version bump and changelog rewrite are correct   | `scripts/release.test.ts`            |
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

One command, named for the part of the version that changes:

```bash
npm run release:patch     # 0.1.2 -> 0.1.3
npm run release:minor     # 0.1.2 -> 0.2.0
npm run release:major     # 0.1.2 -> 1.0.0
```

Each does the whole sequence: bump `package.json` and `package-lock.json` via
`npm version`, move the `[Unreleased]` body in `CHANGELOG.md` under a dated heading for
the new version and reopen `[Unreleased]` above it, run `verify`, commit, tag
`v<version>`, and push. Pushing the tag is what publishes.

```bash
npm run release:minor -- --dry-run     # print the plan, change nothing
npm run release:minor -- --no-push     # everything except the push
npm run release:minor -- --skip-verify # skip the local gate (CI re-runs it)
```

The bump kind is not cosmetic. Per `docs/roadmap.md`, adding a component or an optional
prop is a minor release, and changing or removing a prop, renaming a token or changing a
message namespace is a major one.

Write the `CHANGELOG.md` entries first. The command refuses to release an empty
`[Unreleased]`, because a release with nothing under it documents nothing.

Before the first release: an npm automation token (not a personal token) as the
`NPM_TOKEN` repository secret. The workflow declares no GitHub environment, so that is
the only credential. Trusted publishing via OIDC replaces the token if you would rather
not hold one.

### Why the command does not call `npm publish`

`publishConfig.provenance` is set, and npm only mints Sigstore attestations from GitHub
Actions or GitLab CI on a cloud-hosted runner. A local `npm publish` cannot produce
provenance, so it would either fail or silently ship an unattested package.
`.github/workflows/release.yml` publishes instead, after re-running `release:check` and
asserting the tag matches `package.json` via `scripts/check-tag.mjs`.

This also means `repository` in `package.json` must match where you publish from,
case-sensitive. npm verifies the two before it will attest to a build.

To gate the upload behind reviewers, add `environment: npm` to the `publish` job and
create the environment. GitHub fails a job whose environment does not exist, which is
why it is absent rather than present and broken.

### What the command refuses to do

npm versions are immutable. Once published, a version can only be deprecated or
unpublished, and both are worse than not shipping. So every check that can catch a
mistake runs before the tag is pushed:

| Refuses when                                   | Why                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| The working tree is dirty                      | The tag would describe a commit that is more than the release.                      |
| Not on `main`                                  | Releases are cut from one branch.                                                   |
| `v<version>` already exists                    | Re-pushing a moved tag publishes code that does not match the resolved version.     |
| The version is on the registry                 | The publish would fail and the changelog would claim a release that did not happen. |
| `[Unreleased]` is empty                        | Nothing to document.                                                                |
| The current version is documented but untagged | An earlier run stopped partway; it tells you the exact commands to finish.          |
| The version is not `MAJOR.MINOR.PATCH`         | A prerelease has its own rules, and a guess is not one of them.                     |

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
