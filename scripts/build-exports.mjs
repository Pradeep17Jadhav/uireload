/**
 * Pure export-map construction, separated from the CLI so it can be unit tested.
 *
 * `sync-exports.mjs` is the entry point; this module has no side effects.
 *
 * JSDoc types are used rather than TypeScript because this file is plain JavaScript:
 * it runs before the build, with no transpilation. They are still checked, because
 * the `*.test.ts` suite imports this module and therefore inherits these types.
 */

/**
 * A conditional export entry.
 *
 * @typedef {{ types: string, default: string }} Condition
 * @typedef {{ import: Condition, require: Condition }} ConditionalEntry
 * @typedef {Record<string, ConditionalEntry | string>} ExportsMap
 * @typedef {Record<string, string[]>} TypesVersionsMap
 */

/**
 * One conditional export entry, with `types` ordered before `default`.
 *
 * @param {string} importPath
 * @param {string} requirePath
 * @returns {ConditionalEntry}
 */
export function conditions(importPath, requirePath) {
  return {
    import: { types: importPath.replace(/\.js$/, ".d.ts"), default: importPath },
    require: { types: requirePath.replace(/\.cjs$/, ".d.cts"), default: requirePath },
  };
}

/**
 * Build the full `exports` object for a given component and icon list.
 *
 * Dual `types` per condition is required: TypeScript resolves the same package from
 * ESM and CJS graphs, and a single `.d.ts` makes `require()` consumers silently load
 * ESM-shaped types.
 *
 * Icons get one pattern entry rather than one entry each. That is a deliberate break
 * from the component rule, and the reason is arithmetic: the component rule exists
 * because an unmatched wildcard is a hard error for the packaging checks, and because
 * thirty lines are auditable. With 150-odd icons the auditable list is two thousand
 * lines of generated JSON nobody reads, growing forever, while the pattern is
 * guaranteed to match because the build emits a file for every module
 * `tests/package-structure.test.ts` enumerates. The inventory is still asserted -
 * just against `src/icons`, which is the thing that can actually drift.
 *
 * @param {string[]} names
 * @param {string[]} icons
 * @returns {ExportsMap}
 */
export function buildExports(names, icons = []) {
  const map = {
    ".": conditions("./dist/index.js", "./dist/index.cjs"),
    "./styles.css": "./dist/index.css",
    "./tokens.css": "./dist/theme/tokens.css",
    "./package.json": "./package.json",
    ...Object.fromEntries(
      names.map((name) => [
        `./components/${name}`,
        conditions(`./dist/components/${name}/index.js`, `./dist/components/${name}/index.cjs`),
      ])
    ),
  };

  /*
   * Omitted rather than declared empty when there are no icons: a `*` that matches
   * nothing is exactly the case the packaging checks reject.
   */
  if (icons.length > 0) {
    map["./icons/*"] = conditions("./dist/icons/*.js", "./dist/icons/*.cjs");
  }

  return map;
}

/**
 * `typesVersions` keeps legacy `moduleResolution: node` consumers working.
 *
 * The `*` catch-all is required: without it, a legacy consumer importing
 * `uireload/components/button` gets no types at all, because `typesVersions` replaces
 * the `types` field lookup entirely rather than falling back to it per module.
 *
 * Icons get one line each here even though `exports` uses a pattern, because
 * `typesVersions` cannot wildcard the path it maps *to*. There is no pattern
 * available on this side.
 *
 * @param {string[]} names
 * @param {string[]} icons
 * @returns {Record<string, TypesVersionsMap>}
 */
export function buildTypesVersions(names, icons = []) {
  /** @type {TypesVersionsMap} */
  const map = {
    "*": ["./dist/index.d.ts"],
  };

  for (const name of names) {
    map[`components/${name}`] = [`./dist/components/${name}/index.d.ts`];
  }

  for (const icon of icons) {
    map[`icons/${icon}`] = [`./dist/icons/${icon}.d.ts`];
  }

  map["styles.css"] = ["./dist/index.css"];
  map["tokens.css"] = ["./dist/theme/tokens.css"];

  return { "*": map };
}
