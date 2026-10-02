/**
 * Target size.
 *
 * `docs/foundations.md` states the invariant this file enforces:
 *
 *   "All three heights are at least 1.5rem (24px), satisfying WCAG 2.2 SC 2.5.8 Target Size
 *    (Minimum)."
 *
 * and, on density: "`--uir-control-height-*` is not multiplied by [a density rhythm] ... because
 * shrinking a target size below 24px is an error."
 *
 * `Switch`'s `sm` tier broke it with `calc(var(--uir-control-height-sm) * 0.875)` — 21px, and
 * because the invisible `<input>` covers the whole control, a 22px interactive target. Nothing
 * caught it: `lint:css` checks class namespacing and physical properties, the unit tests run in
 * jsdom which does no layout, and the story looked plausible because a switch is mostly track.
 * Found by measuring the rendered stories in a browser.
 *
 * Asserted on the stylesheets rather than on layout, because jsdom cannot measure and a test that
 * needs a browser to fail is a test nobody runs.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const strip = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const COMPONENTS = readdirSync(join(ROOT, "src/components"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "_template")
  .map((entry) => entry.name);

const TOKENS_CSS = readFileSync(join(ROOT, "src/theme/tokens.css"), "utf8");

describe("the height tokens themselves", () => {
  it("keeps every control height at or above 24px", () => {
    const declared = [...TOKENS_CSS.matchAll(/--uir-control-height-(sm|md|lg):\s*([\d.]+)rem/g)];

    expect(declared.length, "no control heights found in tokens.css").toBe(3);

    for (const [, tier, value] of declared) {
      const px = Number(value) * 16;
      expect(
        px,
        `--uir-control-height-${tier} is ${px}px, below the 24px minimum`
      ).toBeGreaterThanOrEqual(24);
    }
  });

  it("keeps `sm` at exactly the 24px minimum the docs promise", () => {
    // Pinned rather than merely "at least", because foundations.md quotes `1.5rem` verbatim and a
    // silent change to either would make the documentation wrong.
    expect(TOKENS_CSS).toMatch(/--uir-control-height-sm:\s*1\.5rem;/);
  });
});

describe("no component shrinks a control height", () => {
  it("has no `calc()` that scales a control height below 1", () => {
    const offenders: string[] = [];

    for (const dir of COMPONENTS) {
      const css = strip(readFileSync(join(ROOT, "src/components", dir, `${dir}.css`), "utf8"));

      for (const match of css.matchAll(/--uir-control-height-(sm|md|lg)\)\s*\*\s*([\d.]+)/g)) {
        const [, tier, factor] = match;
        if (Number(factor) < 1) {
          offenders.push(`${dir}.css: --uir-control-height-${tier} * ${factor}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("gives every control that draws its own box a size from the height tokens", () => {
    /*
     * Weak by design: it cannot prove every element is the right size, only that each control's
     * stylesheet derives its box from `--uir-control-height-*` rather than from a literal. A literal
     * is how the Switch's 21px arrived, and a literal is what this looks for.
     *
     * `toggle-button` and `toggle-button-group` are absent on purpose: they compose `Button`, so their
     * box comes from `button.css`, and restating the token here would be a second definition of a size
     * they do not own.
     */
    const drawsItsOwnBox = ["button", "icon-button", "switch", "textbox", "select"];

    for (const dir of drawsItsOwnBox) {
      const css = strip(readFileSync(join(ROOT, "src/components", dir, `${dir}.css`), "utf8"));
      expect(css, `${dir}.css does not reference --uir-control-height-*`).toMatch(
        /--uir-control-height-(sm|md|lg)/
      );
    }
  });

  it("keeps Switch's sm tier at the full sm height", () => {
    /*
     * The regression, named. Asserted separately from the general rule because the general rule only
     * catches multiplicative shrinks; this also catches a literal height or a different token.
     */
    const css = strip(readFileSync(join(ROOT, "src/components/switch/switch.css"), "utf8"));
    const rule = css.match(/\.uir-switch\[data-size="sm"\]\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(rule).toMatch(/--uir-switch-track-height:\s*var\(--uir-control-height-sm\)/);
    expect(rule).not.toMatch(/\*/);
  });
});

describe("the documentation states what the code does", () => {
  it("documents the 24px minimum and the no-shrink rule", () => {
    const foundations = readFileSync(join(ROOT, "docs/foundations.md"), "utf8");

    expect(foundations).toMatch(/at least `1\.5rem` \(24px\)/);
    expect(foundations).toMatch(/SC 2\.5\.8 Target Size \(Minimum\)/);
  });
});
