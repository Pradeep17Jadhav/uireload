/**
 * Source hygiene.
 *
 * Structural checks on the source tree that no compiler performs. Each one corresponds to a real
 * defect that reached the tree and was caught by inspection rather than by a tool.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

/** Every source file worth reading, excluding build output and dependencies. */
function sourceFiles(dir = ROOT, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    /*
     * `.consumer-test` is scratch: `published-package.test.ts` creates it and deletes it while
     * these files are being enumerated, so a walk that includes it reads a file that has just
     * been removed. It is generated, so there is nothing in it worth checking.
     */
    if (
      ["node_modules", "dist", ".git", "storybook-static", "coverage", ".consumer-test"].includes(
        entry.name
      )
    ) {
      continue;
    }

    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      sourceFiles(path, out);
    } else if (/\.(ts|tsx|css|md|mjs|cjs)$/.test(entry.name)) {
      out.push(path);
    }
  }

  return out;
}

const FILES = sourceFiles().map((path) => ({
  path: path.slice(ROOT.length + 1).replace(/\\/g, "/"),
  text: readFileSync(path, "utf8"),
}));

/** Strips comments, so commented-out markup does not count as live. */
const strip = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("encoding", () => {
  it("has no Unicode replacement characters anywhere in the tree", () => {
    /*
     * Found the hard way: a lossy encoding pass turned every em dash in the repository into
     * U+FFFD, including two inside a `console.error` message a developer would have read while
     * debugging. Nothing in the toolchain complains about U+FFFD — it is a valid code point — so
     * without this check the corruption is invisible until a human notices.
     */
    const offenders = FILES.filter((file) => file.text.includes("\uFFFD")).map((file) => file.path);

    expect(offenders).toEqual([]);
  });

  it("has no mojibake sequences from a mis-decoded read", () => {
    /*
     * Built from escapes rather than written literally, because the pattern itself contains the
     * sequences being searched for and would otherwise match this file.
     *
     * These are the UTF-8 bytes of a character re-read as Latin-1 and written back out.
     */
    const MOJIBAKE = /\u00e2\u20ac|\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]/;

    const offenders = FILES.filter((file) => MOJIBAKE.test(file.text)).map((file) => file.path);

    expect(offenders).toEqual([]);
  });

  it("writes every file as UTF-8 without a BOM", () => {
    const offenders = FILES.filter((file) => file.text.charCodeAt(0) === 0xfeff).map(
      (file) => file.path
    );

    // A BOM is invisible in a diff and breaks a shebang in `scripts/*.mjs`.
    expect(offenders).toEqual([]);
  });
});

describe("CSS data attributes", () => {
  const COMPONENT_DIRS = readdirSync(join(ROOT, "src/components"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_template")
    .map((entry) => entry.name);

  /** Each component's own emitted attributes, keyed by directory. */
  const EMITTED_BY_COMPONENT = new Map<string, Set<string>>(
    COMPONENT_DIRS.map((dir) => [
      dir,
      new Set(
        readdirSync(join(ROOT, "src/components", dir))
          .filter(
            (file) =>
              file.endsWith(".tsx") && !file.includes(".test.") && !file.includes(".stories.")
          )
          .flatMap((file) => {
            const source = strip(readFileSync(join(ROOT, "src/components", dir, file), "utf8"));

            return [
              /*
               * Both spellings matter. Most components write JSX (`data-size={size}`), but
               * `ToggleButtonGroup` builds its members through an overrides record
               * (`"data-grouped": ""`), and a scan that only matches the first form reports
               * `Button`'s seam rules as dead CSS when they very much are live.
               */
              ...source.matchAll(/data-([a-z0-9-]+)\s*=/g),
              ...source.matchAll(/["']data-([a-z0-9-]+)["']\s*:/g),
            ].map((match) => match[1] as string);
          })
      ),
    ])
  );

  /**
   * Every `data-*` attribute emitted anywhere in `src/components`.
   *
   * Deliberately *not* per component. A composed component styles its base's attributes —
   * `IconButton` renders a `Button` and so keys on `Button`'s `data-size`; `ToggleButtonGroup`
   * marks its members `data-grouped` for `Button`'s seam rules — and scoping the check per component
   * reports every one of those as dead. What has to hold is the weaker, and correct, claim that
   * nothing in the library styles an attribute that nothing in the library emits.
   */
  const EMITTED_ANYWHERE = new Set([...EMITTED_BY_COMPONENT.values()].flatMap((set) => [...set]));

  it("has no stylesheet rule keyed on an attribute nothing in the library emits", () => {
    const report: string[] = [];

    for (const dir of COMPONENT_DIRS) {
      const path = join(ROOT, "src/components", dir, `${dir}.css`);
      if (!existsSync(path)) continue;

      const css = strip(readFileSync(path, "utf8"));
      const dead = [...new Set([...css.matchAll(/data-([a-z0-9-]+)/g)].map((m) => m[1] as string))]
        .filter((attribute) => !EMITTED_ANYWHERE.has(attribute))
        .sort();

      if (dead.length > 0) report.push(`${dir}.css: ${dead.join(", ")}`);
    }

    expect(report).toEqual([]);
  });

  it("documents every styling data attribute a component emits", () => {
    /*
     * `data-uir-*` is the namespace for attributes a component reads back out of the DOM as part of
     * its own behaviour, and needs no documentation. A bare `data-*` is a styling hook, which is
     * legitimate — but it is also public surface, so it has to appear in the component's README.
     */
    const undocumented: string[] = [];

    for (const dir of COMPONENT_DIRS) {
      for (const attribute of EMITTED_BY_COMPONENT.get(dir) ?? []) {
        if (attribute.startsWith("uir-")) continue;

        const readme = FILES.find((file) => file.path === `src/components/${dir}/README.md`);
        if (readme === undefined || !readme.text.includes(`data-${attribute}`)) {
          undocumented.push(`${dir}: data-${attribute}`);
        }
      }
    }

    expect(undocumented.sort()).toEqual([]);
  });

  it("consumes every component-local token its stylesheet declares", () => {
    /*
     * The bug this exists to prevent: `Popover` declared `--uir-popover-border` in each of its four
     * `data-tone` blocks, and the surface's `border` rule read `--uir-border` directly. Every tone
     * therefore rendered identically and the prop had no visual effect whatsoever — a documented,
     * tested, entirely inert prop.
     *
     * A per-component local token that nothing reads is either a typo, an abandoned experiment, or
     * exactly that bug, and all three are invisible in review because the declaration looks
     * plausible. `docs/foundations.md` §11 step 7 scopes these tokens to the component that declares
     * them, so requiring each to be consumed within its own stylesheet is the whole contract.
     */
    const orphans: string[] = [];

    for (const dir of COMPONENT_DIRS) {
      const path = join(ROOT, "src/components", dir, `${dir}.css`);
      if (!existsSync(path)) continue;

      const css = strip(readFileSync(path, "utf8"));
      const declared = new Set(
        [...css.matchAll(/^\s*(--uir-[a-z0-9-]+)\s*:/gm)].map((match) => match[1] as string)
      );
      const consumed = new Set(
        [...css.matchAll(/var\(\s*(--uir-[a-z0-9-]+)/g)].map((match) => match[1] as string)
      );

      for (const token of declared) {
        if (!consumed.has(token)) orphans.push(`${dir}.css: ${token}`);
      }
    }

    expect(orphans.sort()).toEqual([]);
  });
});
