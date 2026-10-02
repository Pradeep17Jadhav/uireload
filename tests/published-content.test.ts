/**
 * Published content must not name the reference libraries.
 *
 * What ships is `files: ["dist", "README.md", "LICENSE", "CHANGELOG.md"]`, and `dist` is not a
 * neutral rendering of the source:
 *
 * - The JSDoc on `*.types.ts` becomes the published `.d.ts`, so it is API documentation.
 * - `dist/index.css` carries the CSS comments through verbatim, into a file a consumer reads.
 * - Every `.js.map` / `.cjs.map` embeds `sourcesContent`, which is the **entire original
 *   TypeScript source** including every comment. A comment stripped from the source but left in a
 *   map is still published.
 *
 * Naming a third-party library in a shipped artefact also implies a relationship that does not
 * exist: that these components are a port of, or compatible with, that project. They are not. The
 * provenance lives in `docs/references.md`, which is not published; the shipped code keeps the
 * reasoning and drops the attribution.
 *
 * This reads `dist/` rather than the source on purpose. The source is the thing being fixed, and a
 * test over the source would pass while a stale build still shipped the old comments.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

/**
 * Matched case-insensitively, and each alternative is specific enough not to fire on ordinary
 * prose. `Material` on its own is deliberately absent: the word describes a design idiom that
 * legitimate comments may discuss, so only the two library names and their package scopes are
 * banned.
 */
const REFERENCE_LIBRARY =
  /\bui5\b|\bmui\b|Fiori|@mui\/|@ui5\/|_ui5_|mui\/material-ui|referenceUILibraries|\bsap[A-Z_]/;

/** Every file the package would publish, or `[]` when there is no build yet. */
function publishedFiles(): string[] {
  const files: string[] = [];

  for (const entry of ["README.md", "LICENSE", "CHANGELOG.md"]) {
    const path = join(ROOT, entry);
    if (existsSync(path)) files.push(path);
  }

  const dist = join(ROOT, "dist");
  if (!existsSync(dist)) return files;

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else files.push(path);
    }
  };
  walk(dist);

  return files;
}

const HAS_BUILD = existsSync(join(ROOT, "dist"));

describe("published content", () => {
  it("names no reference library in any shipped file", () => {
    const offenders: string[] = [];

    for (const file of publishedFiles()) {
      const relative = file.slice(ROOT.length + 1).replace(/\\/g, "/");
      const text = readFileSync(file, "utf8");

      text.split(/\r?\n/).forEach((line, index) => {
        if (REFERENCE_LIBRARY.test(line)) {
          offenders.push(`${relative}:${index + 1}: ${line.trim().slice(0, 100)}`);
        }
      });
    }

    expect(
      offenders,
      offenders.length > 0
        ? `${offenders.length} published mention(s). Run \`npm run build\` after fixing the source.`
        : ""
    ).toEqual([]);
  });

  it("publishes no source map carrying original source", () => {
    /*
     * A softer, structural version of the same rule, and the one that catches a class the text
     * match cannot: a source map whose `sourcesContent` is the *whole* file. Even with the comments
     * rewritten, that is the library's full internal reasoning published verbatim, so it is worth
     * asserting deliberately rather than by accident.
     *
     * Asserted as "every `sourcesContent` entry is free of the libraries", which is the requirement,
     * rather than "sources are excluded", which would be a policy this package has not adopted.
     */
    if (!HAS_BUILD) return;

    const offenders: string[] = [];

    for (const file of publishedFiles()) {
      if (!file.endsWith(".map")) continue;

      const map = JSON.parse(readFileSync(file, "utf8")) as { sourcesContent?: (string | null)[] };
      for (const source of map.sourcesContent ?? []) {
        if (source !== null && REFERENCE_LIBRARY.test(source)) {
          offenders.push(file.slice(ROOT.length + 1).replace(/\\/g, "/"));
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps the package's files list to the built output and three documents", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      files: string[];
    };

    // The assertion that makes the rest of this file meaningful: if `src` or `docs` were ever added
    // to `files`, the source-level comments would publish even though `dist` is clean.
    expect(manifest.files).toEqual(["dist", "README.md", "LICENSE", "CHANGELOG.md"]);
  });

  it("keeps `docs/references.md` out of the package", () => {
    const path = join(ROOT, "docs", "references.md");

    expect(existsSync(path), "docs/references.md should hold the provenance record").toBe(true);
    expect(statSync(path).isFile()).toBe(true);
  });
});

describe("source that feeds the published output", () => {
  const SOURCE_DIRS = ["src"];

  it("names no reference library in source that is compiled or bundled", () => {
    /*
     * `*.test.tsx` and `*.stories.tsx` are included here too. They are not published on their own,
     * but they are read alongside the implementation, and a comment that cites a library in one file
     * and not the next two is worse than one that never cites any.
     */
    const offenders: string[] = [];

    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(path);
          continue;
        }
        if (!/\.(ts|tsx|css)$/.test(entry.name)) continue;

        readFileSync(path, "utf8")
          .split(/\r?\n/)
          .forEach((line, index) => {
            if (REFERENCE_LIBRARY.test(line)) {
              offenders.push(
                `${path.slice(ROOT.length + 1)}:${index + 1}: ${line.trim().slice(0, 90)}`
              );
            }
          });
      }
    };

    for (const dir of SOURCE_DIRS) walk(join(ROOT, dir));

    expect(
      offenders,
      `${offenders.length} source mention(s). Provenance belongs in docs/references.md.`
    ).toEqual([]);
  });

  it("still documents why, in AGENTS.md and docs/references.md", () => {
    /*
     * The other half of the rule. Stripping attributions must not become stripping reasoning, and it
     * must not quietly delete the provenance either — these two files are where it all went.
     */
    const references = readFileSync(join(ROOT, "docs", "references.md"), "utf8");

    expect(references).toMatch(/@ui5\//);
    expect(references).toMatch(/@mui\//);

    // Every component must appear in the record, or its provenance was dropped rather than moved.
    for (const dir of readdirSync(join(ROOT, "src/components"), { withFileTypes: true })) {
      if (!dir.isDirectory() || dir.name === "_template") continue;
      expect(references, `${dir.name} is missing from docs/references.md`).toContain(dir.name);
    }
  });
});
