/**
 * Integration check for the export map.
 *
 * Every other packaging check inspects files. This one resolves imports through
 * Node's real resolver and TypeScript's real resolver against the real artefacts,
 * which is the only way to be sure that `import { X } from "uireload/components/x"`
 * actually works for a consumer.
 *
 * The consumer project is a scratch directory inside the repo, with
 * `node_modules/uireload` pointing at the repo root. That exercises the `exports`
 * map exactly as an install would, while needing no network access: React and every
 * other dependency resolve by walking up to the repository's own `node_modules`.
 *
 * An `npm install` of a real tarball was tried first and rejected: it resolves peer
 * dependencies over the network, which makes the test slow and dependent on registry
 * availability for something that is purely about module resolution.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HAS_DIST = existsSync(join(ROOT, "dist", "index.js"));

/** Scratch consumer lives inside the repo so dependency resolution walks upwards. */
const CONSUMER = join(ROOT, ".consumer-test");

/** Component folders present in the build, excluding private ones. */
function builtComponents(): string[] {
  const dir = join(ROOT, "dist", "components");
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

/** Public icon modules present in the build, sorted, extension removed. */
function builtIcons(): string[] {
  const dir = join(ROOT, "dist", "icons");
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name.slice(0, -".js".length))
    .filter((name) => !name.startsWith("_") && !name.startsWith("chunk-"))
    .filter((name) => !/\.(test|stories)\./.test(name))
    .sort();
}

/*
 * `module` and `moduleResolution` must agree. TypeScript rejects the pair otherwise,
 * which is its way of saying the combination is meaningless rather than unusual.
 */
const TS_MODULES = {
  node16: "node16",
  bundler: "esnext",
  node10: "commonjs",
} as const;

/** Turn a module specifier into a flat, filesystem-safe filename. */
function slug(specifier: string): string {
  return specifier.replace(/[^a-z0-9]+/gi, "-");
}

/**
 * JavaScript's reserved words, which are invalid as identifiers even though they are perfectly
 * ordinary component folder names.
 *
 * Found by the first component whose name collided: `switch`, added as `src/components/switch`.
 * The generated probe did `import * as switch from "uireload/components/switch"` and every
 * `moduleResolution` mode failed with TS1359, which reads as a packaging problem and is not one.
 */
const RESERVED_WORDS = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

/**
 * Globals declared by the DOM lib that shadow an import name.
 *
 * A narrower cousin of `RESERVED_WORDS`, found by the first component whose name collided with one:
 * `text`, added as `src/components/text`. The generated probe did
 * `import * as text from "uireload/components/text"` and every `moduleResolution` mode failed with
 * TS2440 — "Import declaration conflicts with local declaration" — because `lib.dom.d.ts` declares a
 * global `function text()`. Again a probe artefact that reads as a packaging problem and is not one.
 *
 * Kept as a list rather than derived from `lib.dom.d.ts` at test time: the point of this function is
 * to make the probe valid, and a set that silently grew with the TypeScript version would make a
 * failure depend on which TS happens to be installed.
 */
const DOM_GLOBALS = new Set([
  "blur",
  "close",
  "find",
  "focus",
  "open",
  "print",
  "scroll",
  "stop",
  "text",
]);

/** A component name is not always a valid JS identifier. */
function identifier(name: string): string {
  const flat = name.replace(/-/g, "_");

  // Prefixed rather than suffixed, so `switch` reads as `component_switch` and not
  // `switch_component`, which could itself collide with a real component named
  // `switch-component`.
  return RESERVED_WORDS.has(flat) || DOM_GLOBALS.has(flat) ? `component_${flat}` : flat;
}

/** Run node in the scratch consumer, returning trimmed stdout. */
function runConsumer(file: string): string {
  try {
    return execFileSync(process.execPath, [file], {
      cwd: CONSUMER,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    throw new Error(`node ${file} failed:\n${(error as { stderr?: string }).stderr ?? ""}`);
  }
}

/**
 * Write a module to the scratch consumer and return what it printed.
 *
 * A throwaway module per resolution, rather than one module that prints several
 * values, so a failing assertion names the exact resolution that broke.
 */
function resolve(specifier: string, kind: "esm" | "cjs"): boolean {
  const extension = kind === "esm" ? "mjs" : "cjs";
  const file = join(CONSUMER, `probe-${kind}-${slug(specifier)}.${extension}`);

  const source =
    kind === "esm"
      ? `import * as mod from ${JSON.stringify(specifier)};\n` +
        `console.log(JSON.stringify(Object.keys(mod).length > 0));\n`
      : `const mod = require(${JSON.stringify(specifier)});\n` +
        `console.log(JSON.stringify(Object.keys(mod).length > 0));\n`;

  writeFileSync(file, source);
  return runConsumer(file) === "true";
}

/**
 * Resolve many specifiers in one process per format, and report which ones failed.
 *
 * The previous shape spawned a process per specifier, so checking every built component
 * and every built icon in both formats cost several hundred subprocesses. That is not a
 * slow test by design; it is a slow test by accident, and it fails as a *timeout*, which
 * reads as "your package is too slow" about a test that is simply doing more subprocess
 * work than it needs to.
 *
 * Every specifier still resolves through the real `exports` map; only the process count
 * changed. Failures are returned by name so the assertion message names what broke.
 */
function resolveAll(specifiers: string[], kind: "esm" | "cjs"): string[] {
  const extension = kind === "esm" ? "mjs" : "cjs";
  const file = join(CONSUMER, `probe-all-${kind}.${extension}`);

  // A static `import` cannot be guarded, so each specifier is imported dynamically and
  // reported by name on failure. The two probes differ only in the load expression:
  // `await import` needs top-level await, which `.mjs` has and `.cjs` does not, and
  // `require` is synchronous, so it does not. Neither file defers its `console.log`,
  // because an un-awaited async body would print before its own imports had settled.
  const load = kind === "esm" ? "await import" : "require";
  const probe = (specifier: string): string =>
    `try { const mod = ${load}(${JSON.stringify(specifier)});\n` +
    `if (Object.keys(mod).length === 0) throw new Error("no exports");\n` +
    `} catch { failed.push(${JSON.stringify(specifier)}); }`;

  writeFileSync(
    file,
    [
      "const failed = [];",
      ...specifiers.map(probe),
      "console.log(JSON.stringify(failed));",
      "",
    ].join("\n")
  );

  const output = runConsumer(file);
  return JSON.parse(output) as string[];
}

const describeIfBuilt = HAS_DIST ? describe : describe.skip;

describeIfBuilt("export map", () => {
  beforeAll(() => {
    rmSync(CONSUMER, { recursive: true, force: true });
    mkdirSync(join(CONSUMER, "node_modules"), { recursive: true });

    // Not `"type": "module"`: the CJS probes need a CommonJS parent, and the ESM
    // probes use explicit `.mjs` extensions. One package.json serves both.
    writeFileSync(
      join(CONSUMER, "package.json"),
      JSON.stringify({ name: "consumer-test", private: true, version: "0.0.0" }, null, 2)
    );

    // `junction` on Windows avoids needing elevated privileges; `dir` elsewhere.
    symlinkSync(
      ROOT,
      join(CONSUMER, "node_modules", "uireload"),
      process.platform === "win32" ? "junction" : "dir"
    );
  });

  afterAll(() => {
    rmSync(CONSUMER, { recursive: true, force: true });
  });

  it("resolves the root entry from ESM", () => {
    expect(resolve("uireload", "esm")).toBe(true);
  });

  it("resolves the root entry from CommonJS", () => {
    expect(resolve("uireload", "cjs")).toBe(true);
  });

  it("exposes the package.json subpath", () => {
    const file = join(CONSUMER, "probe-manifest.cjs");
    writeFileSync(file, `const pkg = require("uireload/package.json");\nconsole.log(pkg.name);\n`);

    expect(runConsumer(file)).toBe("uireload");
  });

  it("ships the assembled stylesheet as a subpath", () => {
    const cssPath = join(CONSUMER, "node_modules", "uireload", "dist", "index.css");
    expect(existsSync(cssPath)).toBe(true);
  });

  it("ships the tokens stylesheet as a subpath", () => {
    const cssPath = join(CONSUMER, "node_modules", "uireload", "dist", "theme", "tokens.css");
    expect(existsSync(cssPath)).toBe(true);
  });

  it("resolves every built component subpath from ESM and CommonJS", () => {
    const specifiers = builtComponents().map((name) => `uireload/components/${name}`);

    expect(resolveAll(specifiers, "esm"), "did not resolve from ESM").toEqual([]);
    expect(resolveAll(specifiers, "cjs"), "did not resolve from CommonJS").toEqual([]);
  });

  it("ships a declaration file for every built component", () => {
    for (const name of builtComponents()) {
      const base = join(CONSUMER, "node_modules", "uireload", "dist", "components", name, "index");
      expect(existsSync(`${base}.d.ts`), `${name} .d.ts`).toBe(true);
      expect(existsSync(`${base}.d.cts`), `${name} .d.cts`).toBe(true);
      expect(existsSync(`${base}.js`), `${name} .js`).toBe(true);
      expect(existsSync(`${base}.cjs`), `${name} .cjs`).toBe(true);
    }
  });

  it("blocks deep imports into a component's internals", () => {
    // The export map is the only module boundary. Without it, a consumer could reach
    // `uireload/components/<name>/<name>.js` and couple to an implementation detail
    // we have every right to change.
    //
    // With no components the probe is trivially `true`; it becomes meaningful the
    // moment the first component is built, which is exactly when it starts mattering.
    const components = builtComponents();

    const file = join(CONSUMER, "probe-deep.cjs");
    writeFileSync(
      file,
      [
        "let allBlocked = true;",
        ...components.map((name) => {
          const specifier = `uireload/components/${name}/${name}.js`;
          return `try {\n  require(${JSON.stringify(specifier)});\n  allBlocked = false;\n} catch {}`;
        }),
        "console.log(allBlocked);",
        "",
      ].join("\n")
    );

    expect(runConsumer(file)).toBe("true");
  });

  /*
   * Every icon, not a sample, and through the same probe as the components.
   *
   * The icon export is one wildcard rather than one entry per icon, so the only
   * way that is safe is if the pattern resolves for every built name. One static import
   * per icon would prove as much, but a link error does not say which of a hundred and
   * fifty specifiers was missing; the guarded probe collects the failures instead.
   */
  it.each(["esm", "cjs"] as const)("resolves every built icon from %s", (kind) => {
    const icons = builtIcons();
    expect(icons.length, "no icons were built").toBeGreaterThan(0);

    expect(
      resolveAll(
        icons.map((name) => `uireload/icons/${name}`),
        kind
      )
    ).toEqual([]);
  });

  it("ships a declaration file for every built icon", () => {
    for (const name of builtIcons()) {
      const base = join(CONSUMER, "node_modules", "uireload", "dist", "icons", name);

      expect(existsSync(`${base}.d.ts`), `${name}.d.ts`).toBe(true);
      expect(existsSync(`${base}.d.cts`), `${name}.d.cts`).toBe(true);
      expect(existsSync(`${base}.js`), `${name}.js`).toBe(true);
      expect(existsSync(`${base}.cjs`), `${name}.cjs`).toBe(true);
    }
  });

  it("does not expose the private icon factory", () => {
    // `_create-icon` is shared machinery. The entry list skips `_`-prefixed modules, so
    // there is no file to resolve; the assertion is that a consumer who guesses the name
    // gets a clean module-not-found rather than a published implementation detail.
    const icons = builtIcons();
    expect(icons).not.toContain("_create-icon");

    const file = join(CONSUMER, "probe-icon-internal.cjs");
    writeFileSync(
      file,
      [
        "try {",
        '  require("uireload/icons/_create-icon");',
        '  console.log("leaked");',
        "} catch {",
        '  console.log("blocked");',
        "}",
        "",
      ].join("\n")
    );

    expect(runConsumer(file)).toBe("blocked");
  });

  it("does not leak internal modules through the root entry", () => {
    const file = join(CONSUMER, "probe-internal.cjs");
    writeFileSync(
      file,
      [
        `const api = require("uireload");`,
        `const leaked = ["cx", "composeRefs", "useControllableState", "useFocusTrap"].filter(`,
        `  (name) => name in api`,
        `);`,
        `console.log(leaked.length);`,
        "",
      ].join("\n")
    );

    expect(runConsumer(file)).toBe("0");
  });

  /*
   * Type resolution is a separate resolver from module resolution, and the two fail
   * independently. `attw` covers the tarball shape; this covers the specifiers a
   * consumer actually writes, under every mode that matters: `node16` and `bundler`
   * resolve through `exports`, `node10` through `typesVersions`.
   */
  describe.each(["node16", "bundler", "node10"] as const)(
    "TypeScript with moduleResolution %s",
    (mode) => {
      it(
        "type-checks imports written against the package specifiers",
        /*
         * The default 5s budget is not enough, and it is worth being precise about why that is not this
         * test papering over a failure.
         *
         * The generated `consumer.tsx` imports *every* built icon as well as every component, once per
         * resolver, because the icon export is a wildcard and a wildcard is only trustworthy if it resolves
         * for all of them. That makes the cost of this test proportional to the size of the icon set, which
         * grew while this test was not being edited. At roughly 450 icons the `tsc` process needs 6-8s under
         * `node16` and `bundler`, and it was failing as a *timeout* — a failure that says "the package is
         * slow" about a test that is simply doing more work than its budget allowed.
         *
         * The assertions are untouched: any real type error still throws with `tsc`'s own output. Only the
         * time budget moved, and it is set generously so the next icon batch does not trip it either.
         */
        { timeout: 60_000 },
        () => {
          const components = builtComponents();
          /*
           * Every icon, not a sample. The icon export is one wildcard rather than one entry
           * per icon, and the only way that is safe is if the wildcard resolves for all of
           * them under all three resolvers - so the probe enumerates what was built.
           */
          const icons = builtIcons();
          const dir = join(CONSUMER, `ts-${mode}`);
          mkdirSync(dir, { recursive: true });

          writeFileSync(
            join(dir, "tsconfig.json"),
            JSON.stringify(
              {
                compilerOptions: {
                  module: TS_MODULES[mode],
                  moduleResolution: mode,
                  target: "es2022",
                  jsx: "react-jsx",
                  strict: true,
                  noEmit: true,
                  skipLibCheck: true,
                  types: [],
                },
                include: ["consumer.tsx"],
              },
              null,
              2
            )
          );

          // Generated from what was actually built, so this can never assert against a
          // component that does not exist.
          writeFileSync(
            join(dir, "consumer.tsx"),
            [
              `import { TOKENS, formatMessage } from "uireload";`,
              ...components.map(
                (name) => `import * as ${identifier(name)} from "uireload/components/${name}";`
              ),
              ...icons.map((name) => `import icon_${name} from "uireload/icons/${name}";`),
              "",
              `const accent: string = TOKENS.accent;`,
              `const text: string = formatMessage("{n} left", { n: 1 });`,
              ...components.map(
                (name) =>
                  `const keys_${identifier(name)}: string[] = Object.keys(${identifier(name)});`
              ),
              /*
               * Icons are called rather than rendered: the point is that the default export
               * is a component with a callable signature and a props type, under every
               * resolver. Rendering would additionally require a JSX runtime in the probe.
               */
              ...icons.map((name) => `const rendered_${name}: unknown = icon_${name}({});`),
              "",
              `export { accent, text };`,
              ...components.map((name) => `export { keys_${identifier(name)} };`),
              "",
            ].join("\n")
          );

          // Uses the repository's own TypeScript, so no network install is needed.
          const tsc = join(ROOT, "node_modules", "typescript", "bin", "tsc");
          expect(existsSync(tsc)).toBe(true);

          let output: string;
          try {
            output = execFileSync(process.execPath, [tsc, "-p", dir], {
              encoding: "utf8",
              stdio: ["ignore", "pipe", "pipe"],
            });
          } catch (error) {
            throw new Error(
              `tsc (${mode}) failed:\n${(error as { stdout?: string }).stdout ?? ""}${
                (error as { stderr?: string }).stderr ?? ""
              }`
            );
          }

          expect(output).toBe("");
        }
      );
    }
  );
});
