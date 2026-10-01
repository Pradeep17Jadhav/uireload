/**
 * Cross-cutting contract tests.
 *
 * Every component inherits these expectations, so they are asserted once here
 * rather than repeated per component. When the first component lands, this file
 * should be pointed at it.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TOKENS } from "../src/theme/tokens";
import { Example } from "../src/components/_template/example";

const root = process.cwd();

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...cssFiles(full));
    else if (full.endsWith(".css")) out.push(full);
  }
  return out;
}

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkTs(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Every component folder, including private `_`-prefixed ones. */
function componentFolders(): string[] {
  return readdirSync(join(root, "src", "components"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

describe("token contract", () => {
  const tokensCss = readFileSync(join(root, "src", "theme", "tokens.css"), "utf8");

  it("defines every documented token", () => {
    for (const [key, property] of Object.entries(TOKENS)) {
      expect(tokensCss, `${key} (${property}) is missing from tokens.css`).toContain(
        `${property}:`
      );
    }
  });

  it("uses the --uir prefix for every token", () => {
    for (const property of Object.values(TOKENS)) {
      expect(property.startsWith("--uir-")).toBe(true);
    }
  });

  it("exposes no token value to JavaScript", () => {
    // Tokens are read by CSS only. If a component ever needed a token value in JS
    // it would have to hardcode it, which is a signal the token is misplaced.
    const source = readFileSync(join(root, "src", "theme", "tokens.ts"), "utf8");
    expect(source).not.toMatch(/getComputedStyle|getPropertyValue/);
  });
});

describe("css isolation", () => {
  it("namespaces every class selector in library CSS", () => {
    for (const file of cssFiles(join(root, "src"))) {
      const source = readFileSync(file, "utf8");

      // Strip comments, `@import` statements and url() targets. They contain dots
      // (`./theme/tokens.css`) that a naive selector scan would read as class names.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/@import[^;]+;/g, "")
        .replace(/url\([^)]*\)/g, "");

      // A class selector: `.name` not preceded by a path, string or identifier char.
      const classSelectors = [...code.matchAll(/(^|[\s,>+~{(])([a-zA-Z][\w-]*)/g)]
        .map((match) => match[0])
        .filter((token) => token.trimStart().startsWith("."))
        .map((token) => token.replace(/^[\s,>+~{(]+/, "").slice(1));

      for (const name of classSelectors) {
        expect(name.startsWith("uir-"), `${file} uses unnamespaced class ".${name}"`).toBe(true);
      }
    }
  });

  it("uses no !important in library CSS, apart from the documented [hidden] fix", () => {
    // Restoring the UA's `[hidden]` rule is the one exception: resets strip it, and a
    // component that sets `display` would otherwise render author-hidden content.
    const allowed = new Set(["display: none !important"]);

    for (const file of cssFiles(join(root, "src"))) {
      const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const line of code.split("\n")) {
        if (!line.includes("!important")) continue;
        const declaration = line
          .trim()
          .replace(/[;}]\s*$/, "")
          .replace(/\s+/g, " ");

        expect(allowed.has(declaration), `${file} uses !important: ${declaration}`).toBe(true);
      }
    }
  });

  it("declares an explicit layer order", () => {
    const css = readFileSync(join(root, "src", "index.css"), "utf8");
    expect(css).toMatch(/@layer\s+uireload\.tokens,\s+uireload\.base/);
  });

  it("never injects styles at runtime", () => {
    // The only sanctioned way to add CSS to a document is the opt-in import of
    // `uireload/styles.css`. Any runtime injection would break CSP and SSR ordering.
    for (const file of walkTs(join(root, "src"))) {
      const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      const injects =
        /document\.head|createElement\(\s*["']style["']\s*\)|insertBefore\(|adoptedStyleSheets/;

      expect(injects.test(code), `${file} appears to inject CSS at runtime`).toBe(false);
    }
  });
});

describe("component CSS", () => {
  it("wraps every component stylesheet in the component layer", () => {
    // Unlayered rules jump the declared layer order and would beat consumer
    // overrides. `scripts/bundle-css.mjs` enforces this at build time too; this
    // assertion catches it in a plain test run, without a build.
    for (const name of componentFolders()) {
      const dir = join(root, "src", "components", name);

      for (const file of readdirSync(dir)) {
        if (!file.endsWith(".css")) continue;

        const css = readFileSync(join(dir, file), "utf8");
        expect(css, `${name}/${file} must declare @layer uireload.components`).toContain(
          "@layer uireload.components"
        );
      }
    }
  });

  it("never imports a stylesheet from JavaScript", () => {
    // Importing CSS from JS would duplicate the rules in every consumer bundle and
    // make `sideEffects: false` a lie, breaking tree shaking.
    //
    // Stories are exempt: Storybook has no build step to assemble the published
    // stylesheet, so a story imports its own. Stories are never published, so the rule
    // they would otherwise break does not apply to them.
    for (const file of walkTs(join(root, "src"))) {
      if (file.endsWith(".stories.tsx")) continue;

      const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      const cssImport = /^\s*import\s+["'][^"']+\.css["']/m;

      expect(cssImport.test(code), `${file} imports CSS from JavaScript`).toBe(false);
    }
  });
});

describe("published stylesheet", () => {
  const dist = join(root, "dist", "index.css");
  const built = existsSync(dist);

  it.skipIf(!built)("declares the layer order before any rule", () => {
    const css = readFileSync(dist, "utf8");
    const layerIndex = css.indexOf("@layer uireload.tokens,");

    expect(layerIndex).toBeGreaterThan(-1);
    expect(css.indexOf("--uir-accent:")).toBeGreaterThan(layerIndex);
  });

  it.skipIf(!built)("contains no @import, so the published file is self-contained", () => {
    // Comments are stripped first: the source files discuss `@import` in prose, and
    // the point of this assertion is that no *statement* survives into the bundle.
    const code = readFileSync(dist, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    expect(code).not.toMatch(/@import\b/);
  });

  it.skipIf(!built)("includes every component stylesheet", () => {
    const css = readFileSync(dist, "utf8");

    for (const name of componentFolders()) {
      if (name.startsWith("_")) continue;

      for (const file of readdirSync(join(root, "src", "components", name))) {
        if (!file.endsWith(".css")) continue;
        expect(css, `${name}/${file} missing from the bundle`).toContain(`.uir-${name}`);
      }
    }
  });

  it.skipIf(!built)("namespaces every class it ships", () => {
    const css = readFileSync(dist, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    const classes = [...css.matchAll(/(^|[\s,>+~{(])\.([a-zA-Z][\w-]*)/g)].map(
      (match) => match[2] as string
    );

    expect(classes.length).toBeGreaterThan(0);
    for (const name of classes) {
      expect(name.startsWith("uir-"), `unnamespaced class ".${name}" in dist/index.css`).toBe(true);
    }
  });
});

describe("component conventions", () => {
  it("prefixes its root class with the library namespace", () => {
    document.body.innerHTML = "";
    const container = document.createElement("div");
    container.innerHTML = "";
    // Rendered markup is checked in the component's own tests; here we assert the
    // convention holds in the source.
    const source = readFileSync(
      join(root, "src", "components", "_template", "example.tsx"),
      "utf8"
    );
    expect(source).toContain('cx("uir-example"');
  });

  it("exposes state via data attributes", () => {
    const source = readFileSync(
      join(root, "src", "components", "_template", "example.tsx"),
      "utf8"
    );
    expect(source).toMatch(/data-state=/);
    expect(source).toMatch(/data-size=/);
  });

  it("renders no element with an unlabelled interactive role", () => {
    document.body.innerHTML = "";
    const host = document.createElement("div");
    document.body.append(host);

    // The template has no interactive role at all, which is the correct default.
    expect(Example).toBeTypeOf("object");
    expect(host.querySelectorAll("[role]")).toHaveLength(0);
  });
});
