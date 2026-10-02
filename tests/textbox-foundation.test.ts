/**
 * Structural guards for the focus ring.
 *
 * These exist because of a real bug that every behavioural test missed: the ring was
 * drawn on the `<input>`, whose box *is* the text — `.uir-textbox__input` has `padding: 0`
 * — so on an `md` field it traced 181x26 inside a 207x40 control, with the ring's inner
 * edge 1px inside the value rather than around it. Only a rendered page could show that.
 *
 * jsdom has no layout and no cascade, so neither the ring's geometry nor its `:has()`
 * support can be asserted here. What can be asserted is the contract that decides both:
 * which element draws the ring, that the offset pushes it *outside* the control, and that
 * the input's own ring is suppressed only where that replacement actually applies.
 *
 * Appearance is still verified by eye in Storybook across all three schemes.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The stylesheet with comments removed.
 *
 * The comments name the very constructs these tests forbid — `outline: none`,
 * `:focus-visible`, `:focus-within` and the negative offset are all discussed at length
 * while explaining what they are for — so scanning the raw text would match the
 * explanation instead of the code. Comments are not CSS.
 *
 * Same failure mode as `tests/button-foundation.test.ts`, which hit it too.
 */
const css = readFileSync(join(process.cwd(), "src/components/textbox/textbox.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  ""
);

/** The declaration body of the rule whose selector contains `selector`. */
function ruleFor(selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `no rule matching ${selector}`).toBeGreaterThan(-1);

  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);

  return css.slice(open + 1, close);
}

const CONTROL_RING = ".uir-textbox__control:has(.uir-textbox__input:focus-visible)";

describe("where the ring is drawn", () => {
  it("draws it on the control, not on the input", () => {
    // The input's box is the line box, so a ring on it is a ring on the text. The control
    // is the element whose border box is the field, so that is where the ring belongs.
    expect(ruleFor(CONTROL_RING)).toMatch(
      /outline:\s*var\(--uir-focus-ring-width\) solid var\(--uir-textbox-ring\)/
    );
    expect(css).not.toMatch(/\.uir-textbox__input:focus-visible\s*\{\s*outline:\s*var\(/);
  });

  it("keys off :focus-visible inside :has(), never :focus-within", () => {
    /*
     * The whole reason for `:has()` over the more obvious `:focus-within`: a mouse click
     * satisfies `:focus-within` and would put a ring on the control, which
     * `docs/accessibility.md` rule 4 rules out. Verified in a browser on a mouse-clicked
     * button: `:has(button:focus-visible)` is false, `:has(button:focus-within)` is true.
     */
    expect(css).toContain(":has(.uir-textbox__input:focus-visible)");
    expect(css).not.toMatch(/uir-textbox__control:focus-within/);
    expect(css).not.toMatch(/uir-textbox__control:has\([^)]*:focus-within/);
  });

  it("offsets the ring outwards, so there is a gap between ring and border", () => {
    // A negative offset is what put the ring inside the border and against the text.
    // The library-wide positive offset is what `Button` and `Switch` already use, and is
    // what makes a field and a button in one row agree.
    const rule = ruleFor(CONTROL_RING);

    expect(rule).toMatch(/outline-offset:\s*var\(--uir-focus-ring-offset\)/);
    expect(rule).not.toMatch(/outline-offset:\s*calc\(-1/);
  });

  it("takes the ring colour from the tone's ring role", () => {
    // `--uir-textbox-ring` is the only role in the focus path, so `invalid` overriding
    // the tone (textbox.css) has to reach the ring as well as the border.
    expect(ruleFor(CONTROL_RING)).toContain("var(--uir-textbox-ring)");
    expect(css).toMatch(/--uir-textbox-ring:\s*var\(--uir-danger\)/);
  });

  it("uses Highlight in forced-colors mode, on the control", () => {
    expect(css).toMatch(/forced-colors: active[\s\S]*?outline-color:\s*Highlight/);
    expect(ruleFor(CONTROL_RING)).not.toMatch(/forced-colors/);
  });
});

describe("the suppressed input ring", () => {
  it("is gated on the same capability the replacement needs", () => {
    /*
     * The load-bearing detail. An engine that cannot parse `:has(:focus-visible)` drops
     * the rule that draws the control's ring, so without this gate it would also drop
     * the suppression and the field would have no focus indicator at all.
     */
    expect(css).toMatch(
      /@supports selector\(:has\(:focus-visible\)\)\s*\{\s*\.uir-textbox__input:focus-visible\s*\{\s*outline:\s*none/
    );
  });

  it("is the only outline suppression in the component", () => {
    // `outline: none` anywhere else would be a bare removal with no replacement, which is
    // the accessibility failure this library does not ship.
    const suppressions = [...css.matchAll(/outline:\s*none/g)];

    expect(suppressions).toHaveLength(1);
  });

  it("still focuses visibly: the gate cannot resolve to neither ring", () => {
    // Structural form of the guarantee: inside the gate the input's ring is off and the
    // control's ring selector exists; outside it the input keeps its base-layer outline.
    const gate = /@supports selector\(:has\(:focus-visible\)\)\s*\{([\s\S]*?)\n\s*\}/.exec(css);

    expect(gate?.[1]).toContain(".uir-textbox__input:focus-visible");
    expect(gate?.[1]).toContain("outline: none");
    // Nothing in this component re-declares the input's outline outside the gate.
    expect(css).not.toMatch(/\.uir-textbox__input:focus-visible\s*\{[^}]*outline:\s*var\(/);
  });
});

describe("focus stays keyboard-only", () => {
  it("never uses a bare :focus or :focus-within for the ring", () => {
    expect(css).not.toMatch(/\.uir-textbox__control:focus\s*[,{]/);
    expect(css).not.toMatch(/\.uir-textbox__input:focus\s*[,{]/);
  });
});
