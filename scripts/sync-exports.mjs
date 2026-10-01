#!/usr/bin/env node
/**
 * Regenerate the per-component `exports` entries in package.json.
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
 * Idempotent, and safe to run in CI with `--check` (exit 1 if out of date).
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { buildExports, buildTypesVersions } from "./build-exports.mjs";

const ROOT = process.cwd();
const PKG_PATH = join(ROOT, "package.json");
const COMPONENTS_DIR = join(ROOT, "src", "components");

/** Component folder names, sorted, excluding private `_`-prefixed folders. */
export function componentNames(dir = COMPONENTS_DIR) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

function render() {
  const raw = readFileSync(PKG_PATH, "utf8");
  const pkg = JSON.parse(raw);

  const names = componentNames();
  pkg.exports = buildExports(names);
  pkg.typesVersions = buildTypesVersions(names);

  return `${JSON.stringify(pkg, null, 2)}\n`;
}

const check = process.argv.includes("--check");
const next = render();

if (check) {
  const current = readFileSync(PKG_PATH, "utf8");
  if (current !== next) {
    console.error(
      "package.json exports are out of date with src/components.\n" +
        "Run `npm run sync:exports` and commit the result."
    );
    process.exit(1);
  }
  console.log("package.json exports match src/components.");
} else {
  writeFileSync(PKG_PATH, next, "utf8");
  const count = componentNames().length;
  console.log(
    count === 0
      ? "Synced exports (no components yet)."
      : `Synced exports for ${count} component(s).`
  );
}
