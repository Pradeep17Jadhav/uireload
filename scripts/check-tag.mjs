/**
 * Assert a release tag matches the version in package.json.
 *
 * A tag is the only place that records "this commit is version X". npm versions
 * are immutable, so a mismatch publishes a version number nobody intended and
 * cannot be fixed by publishing again: it needs `npm deprecate` or `unpublish`,
 * both of which are worse than not shipping. Checking here means the mistake is
 * caught before the upload rather than after.
 *
 * Usage: node scripts/check-tag.mjs v0.1.0
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const tag = process.argv[2];

if (!tag) {
  console.error("usage: node scripts/check-tag.mjs <tag>");
  process.exit(1);
}

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")
);

const expected = `v${pkg.version}`;

if (tag !== expected) {
  console.error(`Tag ${tag} does not match package.json version ${pkg.version}.`);
  console.error(`Either push ${expected}, or run \`npm version ${tag.slice(1)}\` and commit.`);
  process.exit(1);
}

console.log(`Tag ${tag} matches package.json version ${pkg.version}.`);
