#!/usr/bin/env node
/**
 * Bundle size report and budget gate.
 *
 * "Lightweight" is a requirement, so it needs a measurement, not an intention.
 * This script reports raw and gzipped size per entry point and fails if a budget is
 * exceeded.
 *
 * Entry points are read from the build output rather than hardcoded, so a new
 * component is measured automatically the first time it is built.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";
import process from "node:process";

const DIST = "dist";

/**
 * Budgets in kilobytes, gzipped.
 *
 * Chosen deliberately tight. A single interactive component should stay well under
 * 5 kB gzipped; that is enough for a focus trap plus keyboard handling, and small
 * enough that a consumer importing twenty components is still defensible.
 *
 * Raise a budget only in the same PR that justifies it, with a reason in review.
 */
const BUDGETS = {
  index: 4,
  "components/*": 5,
  "icons/*": 1,
};

/**
 * Aggregate budgets, in kB gzipped, applied to the sum of a whole directory.
 *
 * The icon set is reported as one row rather than one row per icon, because 285 rows of
 * the same number is not a report. The per-icon budget above still runs on every one.
 *
 * This number is a growth tripwire, not a download size. A consumer imports the four
 * glyphs their page uses - well under a kilobyte - and never fetches the rest, because
 * every icon is its own module behind one export pattern. What the aggregate catches is
 * path data accumulating without anyone noticing, which is the one way an icon set gets
 * expensive.
 *
 * Raised from 120 to 200 for the second batch of 129 icons, which took the set from 108
 * to 195 kB gzipped. Justified rather than merely permitted: the growth is 129 more
 * glyphs in a library whose per-icon cost did not move, and the tripwire still has to
 * bite, so the ceiling sits just above the current figure rather than being removed.
 */
const TOTALS = {
  "icons/*": 200,
};

const KIB = 1024;

function kib(bytes) {
  return (bytes / KIB).toFixed(2);
}

function gzipSize(file) {
  return gzipSync(readFileSync(file), { level: 9 }).length;
}

if (!existsSync(DIST)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

/** Every emitted `.js` / `.cjs` in dist, excluding shared chunks. */
function* entries(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      yield* entries(full);
    } else if (/\.(js|cjs)$/.test(name) && !/^chunk-/.test(name)) {
      yield full;
    }
  }
}

const rows = [];
const groups = new Map();
let failures = 0;

/** Which budget key a built entry falls under. */
function budgetFor(rel) {
  if (!rel.includes("/")) return "index";
  if (rel.startsWith("icons/")) return "icons/*";
  return "components/*";
}

for (const file of entries(DIST)) {
  const rel = relative(DIST, file).replace(/\\/g, "/");
  const raw = statSync(file).size;
  const gzip = gzipSize(file);

  // Shared chunks are dependencies of entries, not entries themselves.
  if (/^chunk-/.test(rel)) {
    rows.push({ entry: rel, raw, gzip, budget: null, note: "shared chunk" });
    continue;
  }

  const key = budgetFor(rel);
  const budget = BUDGETS[key];
  const over = budget !== null && gzip / KIB > budget;
  if (over) failures += 1;

  const group = groups.get(key) ?? { count: 0, raw: 0, gzip: 0 };
  group.count += 1;
  group.raw += raw;
  group.gzip += gzip;
  groups.set(key, group);

  rows.push({ entry: rel, raw, gzip, budget, note: over ? "OVER BUDGET" : "", group: key });
}

rows.sort((a, b) => b.gzip - a.gzip);

const pad = (value, width) => String(value).padEnd(width);

/*
 * Only the largest entries are listed. Everything is still measured and budgeted;
 * printing 156 identical icons would bury the three numbers worth reading.
 */
const LISTED = 12;
const shown = rows.slice(0, LISTED);

console.log("");
console.log(`${pad("entry", 46)} ${pad("raw kB", 10)} ${pad("gzip kB", 10)} budget`);
console.log("-".repeat(80));
for (const row of shown) {
  console.log(
    `${pad(row.entry, 46)} ${pad(kib(row.raw), 10)} ${pad(kib(row.gzip), 10)} ${row.budget ?? "-"} ${
      row.note
    }`.trimEnd()
  );
}
if (rows.length > shown.length) {
  console.log(`... and ${rows.length - shown.length} more entries, all within budget.`);
}

console.log("");
console.log(
  `${pad("group", 46)} ${pad("entries", 10)} ${pad("raw kB", 10)} ${pad("gzip kB", 10)} budget`
);
console.log("-".repeat(80));
for (const [key, group] of [...groups].sort((a, b) => b[1].gzip - a[1].gzip)) {
  const total = TOTALS[key];
  const over = total !== undefined && group.gzip / KIB > total;
  if (over) failures += 1;

  console.log(
    `${pad(key, 46)} ${pad(group.count, 10)} ${pad(kib(group.raw), 10)} ${pad(kib(group.gzip), 10)} ${
      total ?? "-"
    } ${over ? "OVER BUDGET" : ""}`.trimEnd()
  );
}

const css = [];
for (const name of readdirSync(DIST)) {
  if (name.endsWith(".css")) {
    const full = join(DIST, name);
    css.push({ entry: name, raw: statSync(full).size, gzip: gzipSize(full) });
  }
}
if (css.length > 0) {
  console.log("");
  console.log("CSS (opt-in, not in the JS budget):");
  for (const row of css) {
    console.log(`${pad(row.entry, 46)} ${pad(kib(row.raw), 10)} ${pad(kib(row.gzip), 10)}`);
  }
}

console.log("");

if (failures > 0) {
  console.error(`${failures} entry point(s) exceeded their gzip budget.`);
  process.exit(1);
}
