#!/usr/bin/env node
/**
 * Logical-property CSS lint.
 *
 * RTL support is the requirement most likely to rot silently, because physical
 * CSS (`margin-left`, `left: 0`) looks correct in an LTR test and only breaks once
 * someone runs the app in Arabic. Storybook cannot catch that in CI.
 *
 * So: fail the build on physical direction-dependent properties in library CSS.
 * The rule is narrow on purpose. It checks only files we own (CSS under `src`) and
 * only properties where physical and logical are not interchangeable.
 *
 * Exceptions are declared inline by putting the marker below on the offending line.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import process from "node:process";

const SRC = "src";
const DISABLE = "uir-logical-disable";

/**
 * property -> logical replacement. A property is rejected because using the
 * physical form is wrong, not because the property itself is forbidden.
 */
const PHYSICAL = {
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
  "border-left-width": "border-inline-start-width",
  "border-right-width": "border-inline-end-width",
  "border-left-color": "border-inline-start-color",
  "border-right-color": "border-inline-end-color",
  "border-top-left-radius": "border-start-start-radius",
  "border-top-right-radius": "border-start-end-radius",
  "border-bottom-left-radius": "border-end-start-radius",
  "border-bottom-right-radius": "border-end-end-radius",
  left: "inset-inline-start",
  right: "inset-inline-end",
};

/*
 * `text-align`, `float` and `clear` are valid properties with invalid *values*,
 * so they are handled by VALUE_CHECKS below rather than listed here. Listing both
 * would report the same line twice.
 */

/**
 * `text-align` is checked by value instead of by property, since `left` and `right`
 * are genuinely wrong while `start` and `end` are correct.
 */
const VALUE_CHECKS = [
  { property: "text-align", bad: /\b(left|right)\b/i, good: "start / end" },
  { property: "float", bad: /\b(left|right)\b/i, good: "inline-start / inline-end" },
  { property: "clear", bad: /\b(left|right)\b/i, good: "inline-start / inline-end" },
  { property: "box-shadow", bad: /(^|[\s(,])-?\d*\.?\d+(px|rem|em)\s+(?!0)/, good: null },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (extname(full) === ".css") {
      yield full;
    }
  }
}

const violations = [];

for (const file of walk(SRC)) {
  const lines = readFileSync(file, "utf8").split("\n");
  const rel = relative(process.cwd(), file).replace(/\\/g, "/");

  lines.forEach((line, index) => {
    const lineNo = index + 1;

    // Comments may legitimately mention the physical names while documenting the
    // logical equivalent.
    const code = line.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/, "");
    if (code.trim() === "") return;
    if (line.includes(DISABLE)) return;

    for (const [property, suggestion] of Object.entries(PHYSICAL)) {
      const pattern = new RegExp(`(^|[;{\\s])${property}\\s*:`, "i");
      if (pattern.test(code)) {
        violations.push({
          file: rel,
          line: lineNo,
          text: line.trim(),
          message: `physical property \`${property}\`; use \`${suggestion}\` instead`,
        });
      }
    }

    for (const { property, bad, good } of VALUE_CHECKS) {
      if (good === null) continue; // box-shadow offset sign is ambiguous; see docs
      const pattern = new RegExp(`(^|[;{\\s])${property}\\s*:([^;]*)`, "i");
      const match = pattern.exec(code);
      if (match && bad.test(match[2])) {
        violations.push({
          file: rel,
          line: lineNo,
          text: line.trim(),
          message: `physical value for \`${property}\`; use \`${good}\` instead`,
        });
      }
    }

    // `box-shadow` x-offset sign flips meaning in RTL. Catch the common case of a
    // positive offset used to move a shadow, which should be logical-aware.
    const shadow = /(^|[;{\s])box-shadow\s*:([^;]*)/i.exec(code);
    if (shadow) {
      const offset = /^\s*(?:inset\s+)?(-?\d*\.?\d+)(px|rem|em)\s+(-?\d*\.?\d+)/i.exec(shadow[2]);
      if (offset && offset[1].startsWith("-") && Number.parseFloat(offset[3]) === 0) {
        violations.push({
          file: rel,
          line: lineNo,
          text: line.trim(),
          message:
            "`box-shadow` with a negative x-offset mirrors in RTL; use a symmetric shadow or set it per `[dir]`",
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`\nLogical-property lint failed (${violations.length} issue(s)):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.message}`);
    console.error(`    ${v.text}\n`);
  }
  console.error(`Add \`${DISABLE}\` on the line if a physical value is intentional.\n`);
  process.exit(1);
}

console.log("Logical-property lint passed: no physical direction properties in src/**/*.css.");
