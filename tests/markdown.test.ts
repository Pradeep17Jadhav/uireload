/**
 * Markdown table integrity.
 *
 * A row-level edit can leave a header and its separator describing a different number of columns
 * than the rows below. Most renderers still draw a table, so the result looks plausible and reads
 * wrong: the extra columns are silently dropped and the last real column appears empty.
 *
 * Found twice while de-attributing the component READMEs — once by leaving a stale `MUI` / `UI5`
 * header above rows that no longer had those columns, and once pre-existing, where two Props
 * tables declared three columns in the header and used four.
 *
 * GFM permits a row with *fewer* cells than the header; empty cells are inserted. A row with
 * *more* is the defect, so that is what this fails on. Escaped `\|` appears inside union types and
 * is not a delimiter.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

/** Documentation that ships, or is one hop from shipping. */
function markdownFiles(): string[] {
  const files: string[] = [];

  for (const entry of ["README.md", "CHANGELOG.md", "CONTRIBUTING.md", "AGENTS.md"]) {
    try {
      readFileSync(join(ROOT, entry), "utf8");
      files.push(join(ROOT, entry));
    } catch {
      // Absent is fine; this is a sweep, not a manifest.
    }
  }

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".md")) files.push(path);
    }
  };

  walk(join(ROOT, "src/components"));
  walk(join(ROOT, "docs"));

  return files;
}

const delimiters = (line: string): number => (line.replace(/\\\|/g, "").match(/\|/g) ?? []).length;

describe("markdown tables", () => {
  it("has no row with more cells than its header declares", () => {
    const offenders: string[] = [];

    for (const file of markdownFiles()) {
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      const relative = file.slice(ROOT.length + 1).replace(/\\/g, "/");

      let block: { n: number; line: string; count: number }[] = [];

      const flush = (endLine: number): void => {
        // Header, separator and at least one body row.
        if (block.length >= 3) {
          const declared = block[0]?.count ?? 0;
          for (const row of block) {
            if (row.count > declared) {
              offenders.push(
                `${relative}:${row.n} — ${row.count} cells, header declares ${declared}`
              );
            }
          }
        }
        block = [];
        void endLine;
      };

      lines.forEach((line, index) => {
        if (/^\s*\|.*\|\s*$/.test(line)) {
          block.push({ n: index + 1, line, count: delimiters(line) });
        } else {
          flush(index);
        }
      });
      flush(lines.length);
    }

    expect(offenders).toEqual([]);
  });

  it("starts every table block with a header and a separator", () => {
    /*
     * The complementary invariant, and the one that catches a header orphaned by a row-level edit:
     * in a maximal block of consecutive table rows, row 2 must be the separator.
     *
     * Blocks of one row are ignored, because a lone pipe-delimited line is often prose that happens
     * to start and end with a pipe rather than a table.
     */
    const offenders: string[] = [];

    for (const file of markdownFiles()) {
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      const relative = file.slice(ROOT.length + 1).replace(/\\/g, "/");

      let block: number[] = [];

      const flush = (): void => {
        if (block.length >= 2) {
          const second = lines[(block[1] as number) - 1] ?? "";
          if (!/^\s*\|[\s:|-]+\|\s*$/.test(second)) {
            offenders.push(`${relative}:${block[0] as number}`);
          }
        }
        block = [];
      };

      lines.forEach((line, index) => {
        if (/^\s*\|.*\|\s*$/.test(line)) block.push(index + 1);
        else flush();
      });
      flush();
    }

    expect(offenders).toEqual([]);
  });
});
