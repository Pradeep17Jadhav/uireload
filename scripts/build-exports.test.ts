/**
 * Unit tests for the export-map generator.
 *
 * The generator mutates a file that is painful to review and easy to get subtly
 * wrong: an error there produces a published package that cannot be imported. These
 * tests were added after it overwrote the root `.` entry while adding the first
 * component, which is exactly the kind of bug that reaches npm if it is not tested.
 */

import { describe, expect, it } from "vitest";
import { buildExports, buildTypesVersions, conditions } from "./build-exports.mjs";

interface Condition {
  types: string;
  default: string;
}

interface ConditionalEntry {
  import: Condition;
  require: Condition;
}

/** Conditional export entry for a subpath, with an assertion if it is absent. */
function entry(exportsMap: Record<string, unknown>, subpath: string): ConditionalEntry {
  const value = exportsMap[subpath];
  expect(value, `${subpath} is missing`).toBeDefined();
  return value as ConditionalEntry;
}

/** The inner `typesVersions` map, narrowed away from `noUncheckedIndexedAccess`. */
function versions(names: string[]): Record<string, string[]> {
  const map = buildTypesVersions(names)["*"];
  expect(map, 'typesVersions must have a "*" branch').toBeDefined();
  return map as Record<string, string[]>;
}

describe("conditions", () => {
  it("orders types before default", () => {
    const entry = conditions("./dist/index.js", "./dist/index.cjs");

    expect(Object.keys(entry.import)).toEqual(["types", "default"]);
    expect(Object.keys(entry.require)).toEqual(["types", "default"]);
  });

  it("derives the ESM declaration name", () => {
    expect(conditions("./dist/a/index.js", "./dist/a/index.cjs").import.types).toBe(
      "./dist/a/index.d.ts"
    );
  });

  it("derives the CJS declaration name", () => {
    expect(conditions("./dist/a/index.js", "./dist/a/index.cjs").require.types).toBe(
      "./dist/a/index.d.cts"
    );
  });
});

describe("buildExports", () => {
  it("always includes the root, stylesheet and package.json entries", () => {
    const exportsMap = buildExports([]);

    expect(Object.keys(exportsMap)).toEqual([
      ".",
      "./styles.css",
      "./tokens.css",
      "./package.json",
    ]);
  });

  it("points the root at the barrel, not at a component", () => {
    const root = entry(buildExports(["button", "dialog"]), ".");

    expect(root.import.default).toBe("./dist/index.js");
    expect(root.require.default).toBe("./dist/index.cjs");
    expect(root.import.types).toBe("./dist/index.d.ts");
    expect(root.require.types).toBe("./dist/index.d.cts");
  });

  it("adds one subpath per component", () => {
    const subpaths = Object.keys(buildExports(["button", "dialog"])).filter((key) =>
      key.startsWith("./components/")
    );

    expect(subpaths).toEqual(["./components/button", "./components/dialog"]);
  });

  it("does not let a component overwrite the root entry", () => {
    // Regression: the first version built each entry by returning a whole object
    // that included a `.` key, so every component clobbered the previous one.
    const exportsMap = buildExports(["button"]);

    expect(entry(exportsMap, ".").import.default).toBe("./dist/index.js");
    expect(JSON.stringify(exportsMap["."])).not.toContain("components");
  });

  it("points each subpath at a matching build output path", () => {
    const exportsMap = buildExports(["button"]);
    const button = entry(exportsMap, "./components/button");

    expect(button.import.default).toBe("./dist/components/button/index.js");
    expect(button.require.default).toBe("./dist/components/button/index.cjs");
    expect(button.import.types).toBe("./dist/components/button/index.d.ts");
    expect(button.require.types).toBe("./dist/components/button/index.d.cts");
  });

  it("handles kebab-case component names", () => {
    const exportsMap = buildExports(["date-picker"]);

    expect(entry(exportsMap, "./components/date-picker").import.default).toBe(
      "./dist/components/date-picker/index.js"
    );
  });

  it("contains no wildcards", () => {
    for (const key of Object.keys(buildExports(["button"]))) {
      expect(key).not.toContain("*");
    }
  });

  it("is deterministic", () => {
    expect(buildExports(["button", "dialog"])).toEqual(buildExports(["button", "dialog"]));
  });
});

describe("buildTypesVersions", () => {
  it("includes a catch-all so bare imports still resolve", () => {
    // Without `*`, a legacy `moduleResolution: node` consumer importing
    // `uireload/components/button` gets no types at all, because `typesVersions`
    // replaces the `types` lookup rather than falling back to it per module.
    expect(versions([])["*"]).toEqual(["./dist/index.d.ts"]);
  });

  it("maps each component subpath", () => {
    const map = versions(["button", "dialog"]);

    expect(map["components/button"]).toEqual(["./dist/components/button/index.d.ts"]);
    expect(map["components/dialog"]).toEqual(["./dist/components/dialog/index.d.ts"]);
  });

  it("maps the stylesheet subpaths", () => {
    const map = versions([]);

    expect(map["styles.css"]).toEqual(["./dist/index.css"]);
    expect(map["tokens.css"]).toEqual(["./dist/theme/tokens.css"]);
  });

  it("keeps keys unique", () => {
    const map = versions(["styles.css"]);

    expect(Object.keys(map).filter((key) => key === "styles.css")).toHaveLength(1);
  });
});
