import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsup";

const COMPONENTS_DIR = "src/components";
const ICONS_DIR = "src/icons";

/**
 * Every `src/components/<name>/index.ts` becomes its own public entry point so that
 * consumers can pull a single component without paying for the barrel file:
 *
 *   import { Button } from "uireload/components/button";
 *
 * Names starting with `_` are private scaffolding (templates, codegen fixtures)
 * and are intentionally excluded from the published surface.
 */
/*
 * Component entry paths are built with forward slashes rather than `path.join`.
 *
 * On Windows, `path.join` yields `src\components\widget\index.ts`, and tsup's entry
 * normalisation then drops it: the build reports three entries and silently emits
 * no component output at all. Forward slashes are valid on every platform esbuild
 * runs on, so one literal works everywhere.
 */
function componentEntries(): string[] {
  return (
    directoryNames(COMPONENTS_DIR)
      .map((name) => join(COMPONENTS_DIR, name, "index.ts"))
      /*
       * Only a folder with an `index.ts` is a publishable component. An in-progress
       * component without one is skipped rather than failing the build.
       */
      .filter((path) => existsSync(path))
      .map((path) => path.replace(/\\/g, "/"))
  );
}

/**
 * Every `src/icons/<Name>.tsx` is an entry point too, because the published import
 * path is one icon per module:
 *
 *   import AddFilled from "uireload/icons/AddFilled";
 *
 * There are a lot of these and each is a few hundred bytes, so the per-file cost is
 * the whole point rather than an accident.
 */
function iconEntries(): string[] {
  return (
    directoryNames(ICONS_DIR)
      /*
       * `*.test.tsx` and `*.stories.tsx` are colocated with the icons they exercise, and
       * neither is an icon. Building the test file alone emits two and a half megabytes
       * of source map into the published package, for no reason a consumer can use.
       */
      .filter((name) => name.endsWith(".tsx") && !/\.(test|stories)\./.test(name))
      .map((name) => `${ICONS_DIR}/${name.slice(0, -".tsx".length)}.tsx`)
  );
}

/**
 * Sorted basenames in a directory, skipping private `_`-prefixed names.
 *
 * Returns `[]` rather than throwing for a directory that is not there, so a checkout
 * with no icons still builds.
 */
function directoryNames(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith("_"))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export default defineConfig({
  /*
   * Entry points:
   *   src/index.ts          the barrel
   *   src/theme/tokens.css  published standalone as `uireload/tokens.css`
   *   src/components/*      one per public component
   *   src/icons/*           one per public icon
   *
   * `src/index.css` is deliberately NOT an entry: the published stylesheet is assembled
   * by `scripts/bundle-css.mjs`, which owns layer order and includes every component
   * stylesheet. Letting tsup copy it here would produce a second, incomplete
   * `dist/index.css`, and the last writer would win.
   */
  entry: ["src/index.ts", "src/theme/tokens.css", ...componentEntries(), ...iconEntries()],
  format: ["esm", "cjs"],
  target: "es2020",
  platform: "neutral",
  dts: true,
  sourcemap: true,
  clean: true,
  // ESM code splitting keeps shared internals (e.g. `internal/*`) in one chunk so
  // per-component imports stay small. CJS is intentionally unsplit.
  splitting: true,
  treeshake: true,
  minify: false,
  external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  loader: {
    ".css": "copy",
  },
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
