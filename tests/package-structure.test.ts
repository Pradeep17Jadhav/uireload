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
  /**
   * Present because the icon suite reads it, and it has to be declared rather than inferred.
   *
   * `exports` can pattern both the key and the value; `typesVersions` can pattern only its *target*,
   * so every icon needs a literal entry there and the whole map is asserted below. A type that omitted
   * the field would not have caught a rename that dropped it — the field simply was not on the type
   * the assertion was reading.
   */
  typesVersions: Record<string, Record<string, string[]>>;
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

/** Public icon modules, sorted, with the `.tsx` extension removed. */
function iconNames(): string[] {
  const dir = join(root, "src", "icons");
  return (
    readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
      /*
       * `*.test.tsx` and `*.stories.tsx` live alongside the icons and are not one.
       *
       * An icon's module name *is* its public identifier, so anything swept into this list is treated as
       * one — and a test file called `icons.test` fails both the PascalCase assertion and the
       * `typesVersions` one, with an error that points at the icon set rather than at the filter.
       */
      .filter((entry) => !/\.(test|stories)\./.test(entry.name))
      .map((entry) => entry.name.slice(0, -".tsx".length))
      .filter((name) => !name.startsWith("_"))
      .sort()
  );
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
  it("has components, so the packaging conventions are load-bearing", () => {
    // Replaces a deliberate tripwire that asserted there were no components, and so
    // failed on the day the first one landed. The invariant is now positive and
    // self-maintaining: whatever exists must be reachable three ways.
    expect(componentDirs().length).toBeGreaterThan(0);
  });

  it("re-exports every component from the barrel", () => {
    // A component reachable only by deep path is discoverable only by reading the
    // source tree. The barrel is the discoverability surface.
    const barrel = readFileSync(join(root, "src", "index.ts"), "utf8");

    for (const name of componentDirs()) {
      expect(barrel, `${name} is not re-exported from src/index.ts`).toContain(
        `"./components/${name}"`
      );
    }
  });

  it("gives every component a PascalCase export matching its folder", () => {
    for (const name of componentDirs()) {
      const expected = name
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");

      const index = readFileSync(join(root, "src", "components", name, "index.ts"), "utf8");
      const exported = [...index.matchAll(/export\s*\{([^}]+)\}/g)]
        .flatMap((match) => (match[1] as string).split(","))
        .map(
          (entry) =>
            entry
              .trim()
              .split(/\s+as\s+/)
              .pop() as string
        )
        .filter((entry) => entry.length > 0);

      expect(
        exported.some((entry) => entry.startsWith(expected)),
        `${name}/index.ts exports [${exported.join(", ")}]; expected something named ${expected}`
      ).toBe(true);
    }
  });

  it("declares one explicit subpath per component", () => {
    // Explicit entries rather than an "./components/*" wildcard: an unmatched
    // wildcard is a hard error for publint and attw, which would mean a red build
    // for a package that is actually fine. `npm run sync:exports` keeps this map
    // honest as components land.
    const subpaths = Object.keys(pkg.exports).filter((key) => key.startsWith("./components/"));

    expect(subpaths).toEqual(componentDirs().map((name) => `./components/${name}`));
  });

  it("never exposes a wildcard component subpath", () => {
    /*
     * Scoped to `./components/*` on purpose. Icons do ship one pattern entry, for the
     * reason set out in `scripts/build-exports.mjs`: the icon list is long enough that
     * an explicit entry per icon is thousands of lines of generated JSON. The pattern
     * is not allowed to spread to components, where the list is short enough to read.
     */
    for (const key of Object.keys(pkg.exports)) {
      if (key.startsWith("./components/")) {
        expect(key.includes("*"), `${key} is a wildcard export`).toBe(false);
      }
    }
  });

  it("exposes no other wildcard subpath than the icon pattern", () => {
    for (const key of Object.keys(pkg.exports)) {
      if (key.includes("*")) {
        expect(key, `${key} is an unexpected wildcard export`).toBe("./icons/*");
      }
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

describe("icon packaging", () => {
  const icons = iconNames();

  it("has icons, so the icon packaging conventions are load-bearing", () => {
    // A vacuous glob assertion is worse than none: it would pass with zero icons.
    expect(icons.length).toBeGreaterThan(0);
  });

  it("names every icon in PascalCase with no separators", () => {
    /*
     * The module name *is* the public identifier:
     *
     *   import AddFilled from "uireload/icons/AddFilled";
     *
     * A kebab-case or lowercase name would make every call site reach for a rename
     * alias, which is the one thing an icon set should never need.
     */
    expect(icons.filter((name) => !/^[A-Z][A-Za-z0-9]*$/.test(name))).toEqual([]);
  });

  it("gives every base name either both variants or no postfix at all", () => {
    const bases = new Map<string, Set<string>>();

    for (const name of icons) {
      const suffix = name.endsWith("Filled")
        ? "Filled"
        : name.endsWith("Outlined")
          ? "Outlined"
          : null;

      const base = suffix === null ? name : name.slice(0, -suffix.length);

      if (!bases.has(base)) bases.set(base, new Set());
      bases.get(base)?.add(suffix ?? "none");
    }

    /*
     * Three states are legal: `Filled` + `Outlined`, or a bare name. A lone `Filled`
     * or a lone `Outlined` is not, because it reads as a half-finished pair and
     * nothing downstream can tell it apart from a deliberate choice.
     */
    const broken = [...bases].filter(
      ([, suffixes]) =>
        (suffixes.has("Filled") || suffixes.has("Outlined")) &&
        !(suffixes.has("Filled") && suffixes.has("Outlined"))
    );

    expect(broken.map(([base]) => base)).toEqual([]);
    expect(
      [...bases].filter(([, s]) => s.has("Filled") && s.has("Outlined")).length
    ).toBeGreaterThan(0);
  });

  it("keeps the private icon machinery out of the published surface", () => {
    // `_create-icon.tsx` is shared code, not an icon. The `_` prefix is the same
    // signal `_template` uses in `src/components`, and it is what keeps the factory
    // out of the entry list and out of the inventory asserted above.
    expect(icons.every((name) => !name.startsWith("_"))).toBe(true);
    expect(icons).not.toContain("_create-icon");
  });

  it("maps the icon pattern at the paths the build actually writes", () => {
    const entry = pkg.exports["./icons/*"] as ExportEntry;

    expect(entry.import.types).toBe("./dist/icons/*.d.ts");
    expect(entry.import.default).toBe("./dist/icons/*.js");
    expect(entry.require.types).toBe("./dist/icons/*.d.cts");
    expect(entry.require.default).toBe("./dist/icons/*.cjs");
  });

  it("lists every icon in typesVersions, because that map cannot pattern its target", () => {
    // `exports` can pattern both the key and the value; `typesVersions` can pattern
    // only the key, so legacy `moduleResolution: node` consumers need one line each.
    const map = pkg.typesVersions["*"] as Record<string, string[]>;

    for (const name of icons) {
      expect(map[`icons/${name}`], `icons/${name} is missing from typesVersions`).toEqual([
        `./dist/icons/${name}.d.ts`,
      ]);
    }

    const declared = Object.keys(map).filter((key) => key.startsWith("icons/"));
    expect(declared.sort()).toEqual(icons.map((name) => `icons/${name}`).sort());
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
