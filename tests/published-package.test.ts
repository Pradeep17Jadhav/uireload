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

/** A component name is not always a valid JS identifier. */
function identifier(name: string): string {
  return name.replace(/-/g, "_");
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
    for (const name of builtComponents()) {
      const specifier = `uireload/components/${name}`;
      expect(resolve(specifier, "esm"), `${specifier} (esm)`).toBe(true);
      expect(resolve(specifier, "cjs"), `${specifier} (cjs)`).toBe(true);
    }
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
      it("type-checks imports written against the package specifiers", () => {
        const components = builtComponents();
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
            "",
            `const accent: string = TOKENS.accent;`,
            `const text: string = formatMessage("{n} left", { n: 1 });`,
            ...components.map(
              (name) =>
                `const keys_${identifier(name)}: string[] = Object.keys(${identifier(name)});`
            ),
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
      });
    }
  );
});
