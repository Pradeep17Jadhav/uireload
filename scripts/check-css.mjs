#!/usr/bin/env node
/**
 * Build-time CSS lint.
 *
 * ## Why this exists instead of relying on tests
 *
 * Two classes of CSS mistake are invisible to unit tests and to review:
 *
 * - **RTL regressions.** Physical CSS (`margin-left`, `left: 0`) looks correct in an
 *   LTR test and only breaks once someone runs the app in Arabic. Storybook cannot
 *   catch it in CI.
 * - **Namespace leaks.** An unprefixed class can collide with the host application.
 *   This was previously only asserted in `tests/conventions.test.ts`, which runs
 *   *after* `npm run build`. A `uir-`-prefix leak could reach `dist/index.css` before
 *   anything failed.
 *
 * So: both are build gates. Tests still assert the same rules, because the tests are
 * the more readable specification; this script is what stops a bad commit.
 *
 * ## Scope
 *
 * Only CSS under `src`, and only rules we can enforce mechanically. Judgement calls
 * (is this shadow *really* asymmetric in a way that matters?) stay with review, and
 * every finding can be suppressed inline.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import process from "node:process";

import { CLASS_PREFIX, DISABLE_MARKER, checkCss } from "./css-rules.mjs";

const SRC = "src";

/** @returns {Generator<string>} */
function* cssFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      yield* cssFiles(full);
    } else if (extname(full) === ".css") {
      yield full;
    }
  }
}

/** @type {import("./css-rules.mjs").CssViolation[]} */
const violations = [];
let checked = 0;

for (const file of cssFiles(SRC)) {
  const rel = relative(process.cwd(), file).replace(/\\/g, "/");
  checked += 1;
  violations.push(...checkCss(readFileSync(file, "utf8"), rel));
}

if (violations.length > 0) {
  console.error(`\nCSS lint failed (${violations.length} issue(s) in ${checked} file(s)):\n`);

  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}`);
    console.error(`    ${violation.message}`);
    console.error(`    ${violation.text}\n`);
  }

  console.error(
    `Two rules are enforced: class selectors must start with \`${CLASS_PREFIX}\`, and\n` +
      `direction-dependent CSS must use logical properties.\n` +
      `Add \`${DISABLE_MARKER}\` on the offending line if a violation is intentional.\n`
  );
  process.exit(1);
}

console.log(
  `CSS lint passed: ${checked} file(s), no unnamespaced classes, no physical direction properties.`
);
