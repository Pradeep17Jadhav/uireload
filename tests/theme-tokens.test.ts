/**
 * Theme drift tests.
 *
 * `src/theme/tokens.css` necessarily declares the dark palette twice: once for
 * `data-uir-scheme="dark"` and once inside a `prefers-color-scheme` query for when
 * the consumer has pinned nothing. Plain CSS offers no way to share those
 * declarations, so the duplication is real and the only defence is a test.
 *
 * This failed for real during the Button work: the interaction-colour tokens were
 * added to the attribute block and missed in the media query, which would have
 * shipped a dark mode with no hover states.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CONTROL_TOKENS } from "../src/foundations";

const root = process.cwd();
const rawTokensCss = readFileSync(join(root, "src", "theme", "tokens.css"), "utf8");

/**
 * Comments are removed before any selector search.
 *
 * The file's own documentation quotes these selectors verbatim while explaining when
 * each one applies, and a naive `indexOf` finds the comment and then pairs it with the
 * wrong `{`. Comments are not CSS.
 */
const tokensCss = rawTokensCss.replace(/\/\*[\s\S]*?\*\//g, "");

/** Custom property declarations inside the block whose header contains `header`. */
function declarationsInBlock(header: string): Map<string, string> {
  const start = tokensCss.indexOf(header);
  expect(start, `no block matching ${header}`).toBeGreaterThan(-1);

  const open = tokensCss.indexOf("{", start);
  let depth = 0;
  let end = open;

  for (let index = open; index < tokensCss.length; index += 1) {
    if (tokensCss[index] === "{") depth += 1;
    if (tokensCss[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }

  const body = tokensCss.slice(open + 1, end);
  const found = new Map<string, string>();

  for (const match of body.matchAll(/(--uir-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    const property = match[1] as string;
    const value = (match[2] as string).trim();

    // `color-scheme` is not a token and is intentionally asymmetric.
    if (property.startsWith("--uir-") && !found.has(property)) {
      found.set(property, value);
    }
  }

  return found;
}

const pinnedDark = declarationsInBlock('[data-uir-scheme="dark"]');
const autoDark = declarationsInBlock(":root:not([data-uir-scheme])");

describe("dark palette", () => {
  it("declares the same tokens whether dark is pinned or inferred", () => {
    const pinned = [...pinnedDark.keys()].sort();
    // `color-scheme` is not a `--uir-*` token, so the parser above skips it already.
    const inferred = [...autoDark.keys()].sort();

    expect(inferred).toEqual(pinned);
  });

  it("gives both blocks the same values", () => {
    for (const [property, value] of pinnedDark) {
      expect(autoDark.get(property), `${property} differs between dark blocks`).toBe(value);
    }
  });

  it("is not empty, so the comparison above is meaningful", () => {
    expect(pinnedDark.size).toBeGreaterThan(10);
  });
});

describe("control tokens", () => {
  it("defines every token the foundations module names", () => {
    for (const [name, property] of Object.entries(CONTROL_TOKENS)) {
      expect(
        new RegExp(`${property}\\s*:`).test(tokensCss),
        `${name} (${property}) is named in foundations.ts but missing from tokens.css`
      ).toBe(true);
    }
  });

  it("sets every size group for all three sizes", () => {
    // Icon tokens are `--uir-icon-size-*` rather than `--uir-control-icon-size-*`:
    // an icon is not necessarily inside a control.
    const groups = ["height", "pad-inline", "pad-block", "font-size", "icon-size"] as const;

    for (const group of groups) {
      for (const size of ["sm", "md", "lg"] as const) {
        const prefix = group === "icon-size" ? "--uir-" : "--uir-control-";
        expect(tokensCss, `${prefix}${group}-${size}`).toContain(`${prefix}${group}-${size}:`);
      }
    }
  });
  it("keeps every control height at or above the WCAG 2.5.8 minimum", () => {
    // 24px = 1.5rem. Guarded numerically so shrinking a token cannot silently
    // regress every control's target size at once.
    const heights = [...tokensCss.matchAll(/--uir-control-height-(sm|md|lg):\s*([\d.]+)rem/g)];

    expect(heights).toHaveLength(3);
    for (const [, size, value] of heights) {
      expect(Number.parseFloat(value as string), `height-${size}`).toBeGreaterThanOrEqual(1.5);
    }
  });
});

describe("scheme pinning", () => {
  it("declares the light palette for :root and for an explicit light pin", () => {
    // Light is the base palette, so there is no standalone
    // `[data-uir-scheme="light"]` rule. Without it in the `:root` selector list, pinning
    // `light` on an element does nothing at all.
    const base = tokensCss.slice(0, tokensCss.indexOf('[data-uir-scheme="dark"]'));
    expect(base).toMatch(/^:root,\s*\[data-uir-scheme="light"\]\s*\{/m);
  });

  it("keeps the auto-dark rule at the root so a root pin can override it", () => {
    // The constraint that makes the Storybook harness set the attribute on `<html>`:
    // auto-dark is decided on `:root`, so a pin on a descendant arrives too late.
    expect(tokensCss).toContain(":root:not([data-uir-scheme])");
  });
});
