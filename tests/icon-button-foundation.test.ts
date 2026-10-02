/**
 * Structural guards for the IconButton/Button relationship.
 *
 * These exist because of a real bug that no behavioural test could see: the icon was
 * handed to `Button` as `children`, so `Button` wrapped it in `.uir-button__label`, and
 * a label is a line box. The inline-flex icon sat on the text baseline with the
 * parent's font descent below it, which rendered every icon a few pixels high — 6px of
 * inset above and 10px below on an `md` control instead of 8px and 8px. jsdom has no
 * layout, so no assertion in the component tests could see it; only Storybook could.
 *
 * A second, independent bug lived in the same relationship: `.uir-icon-button
 * { padding-inline: 0 }` lost to `.uir-button[data-size] { padding-inline: … }` on
 * specificity, so the reset was silently dropped and the control rendered 46x36 rather
 * than the square 36x36 its README promises.
 *
 * What *can* be asserted is the shape of the contract that allowed both: which slot the
 * icon occupies, and whether the rule that resets the padding outranks the one it is
 * fighting. Appearance is still verified by eye in Storybook across all three schemes.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Both stylesheets with comments removed.
 *
 * The comments name the very constructs these tests forbid — `padding-inline: 0`, the
 * `.uir-button[data-size]` selector and `:empty` are all discussed at length while
 * explaining what they are for — so scanning the raw text would match the explanation
 * instead of the code. Comments are not CSS.
 *
 * Same failure mode as the multi-line comment bug in `scripts/css-rules.mjs`, and as
 * `tests/button-foundation.test.ts`, which hit it a second time in a different file.
 */
function stylesheet(component: "icon-button" | "button"): string {
  return readFileSync(
    join(process.cwd(), `src/components/${component}/${component}.css`),
    "utf8"
  ).replace(/\/\*[\s\S]*?\*\//g, "");
}

const iconButtonCss = stylesheet("icon-button");
const buttonCss = stylesheet("button");

/** The declaration body of the first rule whose selector list contains `selector`. */
function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `no rule matching ${selector}`).toBeGreaterThan(-1);

  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);

  return css.slice(open + 1, close);
}

/** The selectors of the rule whose selector list contains `selector`. */
function selectorsFor(css: string, selector: string): string[] {
  const start = css.indexOf(selector);
  expect(start, `no rule matching ${selector}`).toBeGreaterThan(-1);

  return css
    .slice(start, css.indexOf("{", start))
    .split(",")
    .map((part) => part.trim());
}

/**
 * Selector specificity as a class count, taking the highest in a selector list.
 *
 * Every selector in these two stylesheets is built only from classes and attribute
 * selectors, so `(id, class, type)` counting is exact here and needs no real cascade
 * implementation.
 */
function specificityOf(css: string, selector: string): number {
  return Math.max(
    ...selectorsFor(css, selector).map((part) => (part.match(/\.[\w-]+|\[[^\]]+\]/g) ?? []).length)
  );
}

describe("the icon slot", () => {
  it("collapses the label Button always renders", () => {
    // Button renders the label unconditionally so a control's width and accessible name
    // cannot change when a label is added. An icon button has no label, so the span has
    // to be collapsed or the button keeps a flex child it does not need.
    expect(iconButtonCss).toMatch(/\.uir-button__label:empty\s*\{[\s\S]*?display:\s*none/);
  });

  it("fills Button's icon slot rather than restating its size", () => {
    /*
     * Button already sizes `.uir-button__icon` from `--uir-icon-size-*` per `data-size`.
     * A second definition of the same number here would be one more thing that can drift
     * out of step with Button, which is the whole reason IconButton composes it.
     */
    expect(iconButtonCss).not.toMatch(/\.uir-icon-button__icon[^{]*\{[^}]*--uir-icon-size-/);

    const rule = ruleFor(iconButtonCss, ".uir-icon-button__icon {");
    expect(rule).toMatch(/block-size:\s*100%/);
    expect(rule).toMatch(/inline-size:\s*100%/);
  });

  it("sizes a consumer SVG off the slot", () => {
    expect(iconButtonCss).toMatch(/\.uir-icon-button__icon > svg\s*\{[^}]*block-size:\s*100%/);
  });
});

describe("the square box", () => {
  it("outranks Button's own inline padding", () => {
    const paddingRules = [
      ...buttonCss.matchAll(/\.uir-button\[data-size="[a-z]+"\]\s*\{[^}]*padding-inline/g),
    ];

    expect(paddingRules.length, "Button sizes its inline padding per data-size").toBeGreaterThan(0);

    const winner = specificityOf(iconButtonCss, ".uir-button.uir-icon-button[data-size]");
    const loser = specificityOf(buttonCss, '.uir-button[data-size="md"]');

    /*
     * The regression: `.uir-icon-button { padding-inline: 0 }` is one class, `Button`'s
     * padding rule is a class and an attribute, so the reset lost and was dropped. The
     * control then rendered 46x36 with the icon centred in the excess.
     */
    expect(winner).toBeGreaterThan(loser);
    expect(ruleFor(iconButtonCss, ".uir-button.uir-icon-button[data-size]")).toMatch(
      /padding-inline:\s*0/
    );
  });

  it("takes its square from the control height at every size", () => {
    for (const size of ["sm", "md", "lg"]) {
      const rule = ruleFor(iconButtonCss, `.uir-icon-button[data-size="${size}"]`);

      expect(rule, size).toMatch(
        new RegExp(`min-inline-size:\\s*var\\(--uir-control-height-${size}\\)`)
      );
    }
  });

  it("hardcodes no dimensions", () => {
    const offenders = iconButtonCss
      .split("\n")
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) =>
        /(^|[\s;])(block-size|inline-size|min-inline-size|padding-inline|padding-block|margin-inline|font-size)\s*:\s*[\d.]+(rem|px|em)\b/.test(
          line
        )
      );

    expect(offenders, `hardcoded dimensions: ${JSON.stringify(offenders)}`).toEqual([]);
  });
});
