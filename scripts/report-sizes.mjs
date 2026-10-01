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
let failures = 0;

for (const file of entries(DIST)) {
  const rel = relative(DIST, file).replace(/\\/g, "/");
  const raw = statSync(file).size;
  const gzip = gzipSize(file);

  // Shared chunks are dependencies of entries, not entries themselves.
  if (/^chunk-/.test(rel)) {
    rows.push({ entry: rel, raw, gzip, budget: null, note: "shared chunk" });
    continue;
  }

  const isRoot = !rel.includes("/");
  const budget = isRoot ? BUDGETS.index : BUDGETS["components/*"];
  const over = budget !== null && gzip / KIB > budget;
  if (over) failures += 1;

  rows.push({ entry: rel, raw, gzip, budget, note: over ? "OVER BUDGET" : "" });
}

rows.sort((a, b) => b.gzip - a.gzip);

const pad = (value, width) => String(value).padEnd(width);
console.log("");
console.log(`${pad("entry", 46)} ${pad("raw kB", 10)} ${pad("gzip kB", 10)} budget`);
console.log("-".repeat(80));
for (const row of rows) {
  console.log(
    `${pad(row.entry, 46)} ${pad(kib(row.raw), 10)} ${pad(kib(row.gzip), 10)} ${row.budget ?? "-"} ${
      row.note
    }`.trimEnd()
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
