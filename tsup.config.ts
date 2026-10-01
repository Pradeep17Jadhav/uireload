import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsup";

const COMPONENTS_DIR = "src/components";

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
  const entries: string[] = [];

  let dirs: string[];
  try {
    dirs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name);
  } catch {
    // The components directory is optional until the first component lands.
    return entries;
  }

  for (const name of dirs.sort()) {
    // Only a folder with an `index.ts` is a publishable component. An in-progress
    // component without one is skipped rather than failing the build.
    if (!existsSync(join(COMPONENTS_DIR, name, "index.ts"))) continue;
    entries.push(`${COMPONENTS_DIR}/${name}/index.ts`);
  }

  return entries;
}

export default defineConfig({
  /*
   * Entry points:
   *   src/index.ts          the barrel
   *   src/theme/tokens.css  published standalone as `uireload/tokens.css`
   *   src/components/*      one per public component
   *
   * `src/index.css` is deliberately NOT an entry: the published stylesheet is assembled
   * by `scripts/bundle-css.mjs`, which owns layer order and includes every component
   * stylesheet. Letting tsup copy it here would produce a second, incomplete
   * `dist/index.css`, and the last writer would win.
   */
  entry: ["src/index.ts", "src/theme/tokens.css", ...componentEntries()],
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
