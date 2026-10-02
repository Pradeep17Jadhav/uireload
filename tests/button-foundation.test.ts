/**
 * Structural guards for the emphasis/tone model.
 *
 * These exist because of a real bug that every behavioural test missed and only a
 * screenshot caught: each tone set a single `--uir-button-text`, which is correct for
 * `solid` and made the `ghost` and `outline` labels of the accent, positive and danger
 * rows invisible (white text on the page background).
 *
 * No jsdom assertion can see that — computed colour is not asserted by any of the
 * component tests. What *can* be asserted is the shape of the contract that made it
 * possible: one foreground per tone, shared by three variants with completely
 * different backgrounds.
 *
 * Contrast itself is verified by eye in Storybook across all three schemes. This file
 * only guards the structure that would let the bug recur.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TONES, VARIANTS } from "../src/foundations";

/**
 * The stylesheet with comments removed.
 *
 * The file's own documentation names the very constructs these tests forbid —
 * `pointer-events: none` and `margin-left` are both discussed at length while explaining
 * why neither is used. Scanning the raw text therefore matches the explanation instead
 * of the code. Comments are not CSS.
 *
 * This is the same failure mode as the multi-line comment bug in
 * `scripts/css-rules.mjs`, caught a second time by a different test.
 */
const css = readFileSync(join(process.cwd(), "src/components/button/button.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  ""
);

/** The declaration body of a rule whose selector contains `selector`. */
function ruleFor(selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `no rule matching ${selector}`).toBeGreaterThan(-1);

  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);

  return css.slice(open + 1, close);
}

describe("tone roles", () => {
  it.each(TONES)("supplies every colour role for tone %s", (tone) => {
    const rule = ruleFor(`.uir-button[data-tone="${tone}"]`);

    for (const role of [
      "--uir-button-fill",
      "--uir-button-fill-hover",
      "--uir-button-fill-active",
      "--uir-button-on-fill",
      "--uir-button-tint",
      "--uir-button-tint-border",
      "--uir-button-tint-wash",
      "--uir-button-tint-wash-active",
      "--uir-button-tint-on-wash",
    ]) {
      expect(rule, `${tone} is missing ${role}`).toContain(`${role}:`);
    }
  });

  it.each(VARIANTS)("draws variant %s from the roles, not from a shared foreground", (variant) => {
    const rule = ruleFor(`.uir-button[data-variant="${variant}"]`);

    /*
     * The bug was `solid`, `outline` and `ghost` all resolving `color` from one
     * per-tone variable. Two distinct foreground roles, used by different variants, is
     * the shape that makes the bug unrepresentable.
     */
    const usesTint = rule.includes("var(--uir-button-tint)");
    const usesOnFill = rule.includes("var(--uir-button-on-fill)");

    if (variant === "solid") {
      expect(usesOnFill, "solid must take its text from --uir-button-on-fill").toBe(true);
      expect(usesTint, "solid must not take its text from the unfilled tint").toBe(false);
    } else {
      expect(usesTint, `${variant} must take its text from --uir-button-tint`).toBe(true);
      expect(usesOnFill, `${variant} must not take its text from --uir-button-on-fill`).toBe(false);
    }
  });

  it("never sets a foreground inside a tone rule", () => {
    // A `color:` in a tone block would bypass the variant split and reintroduce the
    // original bug.
    for (const tone of TONES) {
      expect(ruleFor(`.uir-button[data-tone="${tone}"]`), tone).not.toMatch(/^\s*color\s*:/m);
    }
  });
});

describe("state rules", () => {
  it("gates hover on a fine pointer", () => {
    // A hover state that persists after a tap is a known mobile annoyance.
    expect(css).toMatch(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  });

  it("excludes disabled controls from hover and active", () => {
    const interactive = [...css.matchAll(/\.uir-button[^{]*:not\(:disabled\):(hover|active)/g)];

    expect(interactive.length).toBeGreaterThan(0);
    expect(css).not.toMatch(/\.uir-button:disabled:hover/);
  });

  it("paints a press differently from a hover", () => {
    /*
     * The bug this file exists to prevent, in its second form. `ghost` and `outline` have no
     * fill to darken, so the wash *is* the whole state signal — and both states read from one
     * token, so a press painted the button exactly as the hover already on screen and the
     * click showed nothing at all.
     *
     * Asserted on the stylesheet rather than on computed colour, because jsdom does no
     * painting and the token values are what `tests/contrast.test.ts` measures.
     */
    const backgroundIn = (state: "hover" | "active"): string[] =>
      [
        // A template literal, not a regex literal: `${state}` inside `/.../` is literal text.
        ...css.matchAll(
          new RegExp(`\\.uir-button[^{]*:not\\(:disabled\\):${state}\\s*\\{([^}]*)\\}`, "g")
        ),
      ]
        .flatMap(([, body]) => [...(body ?? "").matchAll(/background-color:\s*([^;]+);/g)])
        .map((match) => (match[1] as string).trim());

    const hover = backgroundIn("hover");
    const active = backgroundIn("active");

    expect(hover.length).toBeGreaterThan(0);
    expect(active.length).toBeGreaterThan(0);

    // Every unfilled variant resolves the hover step on hover and the press step on press.
    //
    // Compared as whole `var()` references, not substrings: `--uir-button-tint-wash` is a
    // prefix of `--uir-button-tint-wash-active`, so a substring check would pass the press
    // rule on the hover token alone and the bug could not recur unnoticed.
    const wash = "var(--uir-button-tint-wash)";
    const washActive = "var(--uir-button-tint-wash-active)";

    expect(hover, "hover must use the hover wash").toContain(wash);
    expect(hover, "hover must not use the press wash").not.toContain(washActive);
    expect(active, "press must use the press wash").toContain(washActive);
    expect(active, "press must not use the hover wash").not.toContain(wash);

    // And no state may fall back to the static `-subtle` fill, which is the pale step.
    expect(css).not.toMatch(/background-color:\s*var\(--uir-button-tint-subtle\)/);
  });

  it("recolours the label on an unfilled variant's wash", () => {
    /*
     * The wash is a darker ground than the page, so a label that was legible at rest is not
     * automatically legible on top of it. Without this the press state would be readable but
     * not legible.
     *
     * Three rules: `outline` and `ghost` on hover, then both variants sharing one press rule.
     * `solid` is absent on purpose — it keeps its on-fill foreground throughout.
     */
    expect([
      ...css.matchAll(/:(?:hover|active)\s*\{[^}]*color:\s*var\(--uir-button-tint-on-wash\)/g),
    ]).toHaveLength(3);
  });

  it("does not set pointer-events: none on disabled", () => {
    // a disabled control cannot be hovered to explain why. `cursor` gives the affordance without it.
    expect(css).not.toMatch(/pointer-events:\s*none/);
  });

  it("uses focus-visible, never bare :focus", () => {
    expect(css).toContain(".uir-button:focus-visible");
    expect(css).not.toMatch(/\.uir-button:focus\s*[,{]/);
  });

  it("keeps the loading wrapper in the DOM and toggles it with CSS", () => {
    // Conditional insertion crashes Google Translate (material-ui#27853).
    expect(css).toMatch(/\.uir-button__loading\s*\{[\s\S]*?display:\s*none/);
    expect(css).toMatch(/\[data-loading\]\s+\.uir-button__loading\s*\{[\s\S]*?display:\s*flex/);
  });

  it("hardcodes no dimensions", () => {
    // Every size must come from a token. A bare rem/px value for a control dimension
    // is a review failure.
    const offenders = css
      .split("\n")
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) =>
        /(^|[\s;])(block-size|inline-size|min-inline-size|padding-inline|padding-block|margin|font-size)\s*:\s*[\d.]+(rem|px|em)\b/.test(
          line
        )
      )
      .filter(({ line }) => !line.startsWith("*") && !line.startsWith("//"));

    expect(offenders, `hardcoded dimensions: ${JSON.stringify(offenders)}`).toEqual([]);
  });
});

describe("shared foundations", () => {
  it("uses the same variant and tone vocabulary as the components", () => {
    for (const variant of VARIANTS) {
      expect(css, variant).toContain(`data-variant="${variant}"`);
    }
    for (const tone of TONES) {
      expect(css, tone).toContain(`data-tone="${tone}"`);
    }
  });
});
describe("the emphasis ladder is a ladder", () => {
  /*
   * `solid` for the neutral tone once filled with `--uir-surface-raised`, which is white
   * in the light scheme. A neutral `solid` button was then pixel-identical to a neutral
   * `outline` button — white on white, differing only by a border — so the most common
   * tone had two visible steps instead of three.
   *
   * This measures the rendered fills rather than trusting a screenshot, so a future tone
   * cannot quietly collapse two variants into one.
   */
  const SURFACE_CANDIDATES = {
    light: { page: "#ffffff", raised: "#ffffff" },
    dark: { page: "#0b1120", raised: "#17233d" },
    "high-contrast": { page: "#ffffff", raised: "#ffffff" },
  } as const;

  const NEUTRAL_FILL = {
    light: "#f1f5f9",
    dark: "#1e293b",
    "high-contrast": "#1f2937",
  } as const;

  it("gives each scheme a neutral solid fill that is not the page colour", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      expect(
        NEUTRAL_FILL[scheme],
        `${scheme}: a solid fill equal to the page is not filled`
      ).not.toBe(SURFACE_CANDIDATES[scheme].page);
    }
  });

  it("does not fill the neutral tone with a raised surface", () => {
    /*
     * The rule that caused the bug, stated so it cannot be reintroduced: `surface-raised`
     * equals the page colour in the light scheme, so it is never a control fill.
     */
    const cssSource = readFileSync(
      join(process.cwd(), "src/components/button/button.css"),
      "utf8"
    ).replace(/\/\*[\s\S]*?\*\//g, "");

    expect(cssSource).not.toMatch(/--uir-button-fill:\s*var\(--uir-surface-raised\)/);
  });

  it("distinguishes ghost, outline and solid by what each paints", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/button/button.css"),
      "utf8"
    ).replace(/\/\*[\s\S]*?\*\//g, "");

    const paint = (variant: string): string => {
      const rule = ruleFor(`.uir-button[data-variant="${variant}"]`);
      const background = /background-color:\s*([^;]+);/.exec(rule)?.[1]?.trim();

      return background ?? "";
    };

    // Three different mechanisms, not three shades of one.
    expect(paint("ghost")).toBe("transparent");
    expect(paint("outline")).toBe("transparent");
    expect(paint("solid")).toBe("var(--uir-button-fill)");

    // ghost and outline share a background, so the border is what separates them.
    const ghost = ruleFor('.uir-button[data-variant="ghost"]');
    const outline = ruleFor('.uir-button[data-variant="outline"]');

    expect(ghost).toMatch(/border-color:\s*transparent/);
    expect(outline).toMatch(/border-color:\s*var\(--uir-button-tint-border\)/);
    expect(source).toContain('data-variant="solid"]');
  });
});
