/**
 * The public export map is the library's most load-bearing piece of
 * infrastructure, and the easiest thing to break silently. `publint` catches
 * malformed entries; this suite catches the ones it cannot, such as a component
 * added to `src/components/` with no matching subpath export, or a public module
 * that leaks an import of `src/internal`.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import * as publicApi from "../src/index";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  name: string;
  sideEffects: boolean | string[];
  exports: Record<string, unknown>;
  files: string[];
  peerDependencies: Record<string, string>;
  dependencies?: Record<string, string>;
};

/** One conditional export entry, with `types` ordered before `default`. */
interface ExportEntry {
  import: { types: string; default: string };
  require: { types: string; default: string };
}

/** Conditional entries only, skipping string entries such as `"./styles.css"`. */
function exportEntries(): [string, ExportEntry][] {
  return Object.entries(pkg.exports).filter(
    (entry): entry is [string, ExportEntry] => typeof entry[1] !== "string"
  );
}

function componentDirs(): string[] {
  const dir = join(root, "src", "components");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("package manifest", () => {
  it("declares no runtime dependencies", () => {
    // The whole "lightweight" claim depends on this staying true. Anything shipped
    // to consumers must be a peer dependency or nothing.
    expect(pkg.dependencies ?? {}).toEqual({});
  });

  it("keeps react as a peer dependency", () => {
    expect(pkg.peerDependencies).toHaveProperty("react");
    expect(pkg.dependencies ?? {}).not.toHaveProperty("react");
  });

  it("declares sideEffects: false so bundlers can tree-shake", () => {
    // Our CSS is copied as separate files and never imported for its side effects
    // by JS, so the whole package is side-effect free.
    expect(pkg.sideEffects).toBe(false);
  });

  it("exposes the root entry with separate ESM and CJS types", () => {
    const root_ = pkg.exports["."] as ExportEntry;

    expect(root_.import.types).toMatch(/\.d\.ts$/);
    expect(root_.import.default).toMatch(/\.js$/);
    // `require` consumers need `.d.cts`; a single `.d.ts` makes them silently load
    // ESM-shaped types. attw fails the build if this regresses.
    expect(root_.require.types).toMatch(/\.d\.cts$/);
    expect(root_.require.default).toMatch(/\.cjs$/);
  });

  it("exposes the stylesheet subpaths", () => {
    expect(pkg.exports["./styles.css"]).toBe("./dist/index.css");
    expect(pkg.exports["./tokens.css"]).toBe("./dist/theme/tokens.css");
  });

  it("allows package.json access for tooling", () => {
    expect(pkg.exports["./package.json"]).toBe("./package.json");
  });

  it("orders `types` before `default` in every condition", () => {
    for (const [key, entry] of exportEntries()) {
      for (const condition of ["import", "require"] as const) {
        const nested = entry[condition];
        expect(Object.keys(nested), `${key}.${condition}`).toEqual(["types", "default"]);
      }
    }
  });

  it("publishes only dist, not sources or configs", () => {
    for (const pattern of pkg.files) {
      expect(pattern).not.toMatch(/^src|^\.storybook|tests|tsup|vitest/);
    }
  });
});

describe("component packaging", () => {
  it("has no components yet", () => {
    // Documents the current state. When the first component lands this fails and
    // forces a deliberate update, which is exactly when the convention needs to be
    // re-confirmed.
    expect(componentDirs()).toEqual([]);
  });

  it("declares one explicit subpath per component", () => {
    // Explicit entries rather than an "./components/*" wildcard: an unmatched
    // wildcard is a hard error for publint and attw, which would mean a red build
    // for a package that is actually fine. `npm run sync:exports` keeps this map
    // honest as components land.
    const subpaths = Object.keys(pkg.exports).filter((key) => key.startsWith("./components/"));

    expect(subpaths).toEqual(componentDirs().map((name) => `./components/${name}`));
  });

  it("never exposes a wildcard subpath", () => {
    for (const key of Object.keys(pkg.exports)) {
      expect(key.includes("*"), `${key} is a wildcard export`).toBe(false);
    }
  });

  it("points each component subpath at a matching build output path", () => {
    for (const [key, entry] of exportEntries()) {
      if (!key.startsWith("./components/")) continue;

      const name = key.replace("./components/", "");
      expect(entry.import.types).toBe(`./dist/components/${name}/index.d.ts`);
      expect(entry.import.default).toBe(`./dist/components/${name}/index.js`);
    }
  });

  it("excludes underscore-prefixed folders from the export map", () => {
    // `_template` must never be publishable, even though it lives under
    // `src/components` and is type-checked, linted and tested.
    expect(componentDirs().every((name) => !name.startsWith("_"))).toBe(true);
    expect(pkg.exports["./components/_template"]).toBeUndefined();
  });
});

describe("public API surface", () => {
  it("exports nothing that does not exist in the source", () => {
    // Guards against a stale barrel after a rename or a move.
    for (const name of Object.keys(publicApi)) {
      expect(name).toMatch(/^[A-Z]|^[a-z][A-Za-z0-9]*$/);
    }
  });

  it("does not export any component", () => {
    const exported = Object.keys(publicApi);
    expect(exported).not.toContain("Example");
  });
});

describe("internal boundary", () => {
  const publicModules = [join(root, "src", "index.ts")];

  it("keeps `src/internal` out of the public entry point", () => {
    const source = readFileSync(publicModules[0] as string, "utf8");
    expect(source).not.toMatch(/from\s+"\.\/internal/);
    expect(source).not.toMatch(/from\s+"\.\.\/internal/);
  });

  it("does not re-export internal utilities from the public entry", () => {
    const source = readFileSync(publicModules[0] as string, "utf8");
    for (const utility of ["cx", "composeRefs", "useControllableState", "useFocusTrap"]) {
      expect(source).not.toContain(utility);
    }
  });

  it("has no module importing from a sibling component", () => {
    // Cross-component imports are how coupling starts. Shared logic belongs in
    // `src/internal`, shared visuals in the stylesheet.
    for (const file of walk(join(root, "src"))) {
      const source = readFileSync(file, "utf8");
      const match = /from\s+"(\.\.\/[^"]*components\/[^"]+)"/.exec(source);
      expect(match, `${file} imports from another component: ${match?.[1]}`).toBeNull();
    }
  });
});
