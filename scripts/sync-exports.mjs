#!/usr/bin/env node
/**
 * Regenerate the per-component `exports` entries in package.json, and the icon
 * pattern that goes with them.
 *
 * Why explicit entries instead of an `"./components/*"` wildcard:
 *
 * - An unmatched wildcard is an error for `publint` and `attw`. Declaring it before
 *   the first component exists means CI is red for a package that is otherwise
 *   correct, which trains people to ignore the packaging check.
 * - An explicit map is auditable. Every published entry is a deliberate line in
 *   package.json rather than a pattern that silently starts matching.
 * - Consumers see the same specifier either way: `uireload/components/button`.
 *
 * The trade-off is bookkeeping, so this script does it and
 * `tests/package-structure.test.ts` asserts the committed file is in sync. Adding a
 * component then means: create the folder, run `npm run sync:exports`.
 *
 * `"./icons/*"` is the one pattern, for the reason set out in `build-exports.mjs`:
 * the icon set is large enough that the explicit list is unreadable and unbounded,
 * and `typesVersions` needs one line per icon regardless.
 *
 * Idempotent, and safe to run in CI with `--check` (exit 1 if out of date).
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { buildExports, buildTypesVersions } from "./build-exports.mjs";

const ROOT = process.cwd();
const PKG_PATH = join(ROOT, "package.json");
const COMPONENTS_DIR = join(ROOT, "src", "components");
const ICONS_DIR = join(ROOT, "src", "icons");

/** Component folder names, sorted, excluding private `_`-prefixed folders. */
export function componentNames(dir = COMPONENTS_DIR) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Icon module names, sorted, without the `.tsx` extension.
 *
 * `*.test.tsx` and `*.stories.tsx` live beside the icons they exercise and are not
 * icons; `_`-prefixed modules are shared machinery. All three are excluded, here and in
 * `tsup.config.ts`, because a published icon and a build entry are the same decision
 * made in two places.
 */
export function iconNames(dir = ICONS_DIR) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".tsx") &&
        !/\.(test|stories)\./.test(entry.name) &&
        !entry.name.startsWith("_")
    )
    .map((entry) => entry.name.slice(0, -".tsx".length))
    .sort();
}

function render() {
  const raw = readFileSync(PKG_PATH, "utf8");
  const pkg = JSON.parse(raw);

  const names = componentNames();
  const icons = iconNames();

  pkg.exports = buildExports(names, icons);
  pkg.typesVersions = buildTypesVersions(names, icons);

  return `${JSON.stringify(pkg, null, 2)}\n`;
}

const check = process.argv.includes("--check");
const next = render();

if (check) {
  const current = readFileSync(PKG_PATH, "utf8");
  if (current !== next) {
    console.error(
      "package.json exports are out of date with src/components and src/icons.\n" +
        "Run `npm run sync:exports` and commit the result."
    );
    process.exit(1);
  }
  console.log("package.json exports match src/components and src/icons.");
} else {
  writeFileSync(PKG_PATH, next, "utf8");
  console.log(
    `Synced exports for ${componentNames().length} component(s) and ${iconNames().length} icon(s).`
  );
}
