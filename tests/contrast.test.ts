/**
 * Colour contrast tests.
 *
 * Written after a screenshot looked *fine*. The `positive` tone was green-600
 * (`#16a34a`), which is 3.30:1 as a fill behind white text and 3.00:1 as text on the
 * page. Both fail WCAG SC 1.4.3, which requires 4.5:1 for a 1rem button label. Nothing
 * in the behavioural test suite could see it: computed colour is not asserted by any of
 * the component tests, and jsdom does no layout or painting.
 *
 * So contrast is measured here, from the token values themselves, for every
 * scheme/tone/variant combination. These are arithmetic facts about the palette, so
 * they belong in a test rather than in someone's eyes.
 *
 * axe checks contrast in a real browser, but only for what a story happens to render,
 * and it reports a violation rather than preventing the token from being introduced.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The token contract under test.
 *
 * Each entry is a foreground/background pair that a control actually renders, named by
 * the role that produces it. Keeping the list declarative is the point: adding a tone
 * means adding a row here, and a new row is measured.
 */
const PAIRS = [
  // Solid: the tone's fill behind its on-fill foreground.
  { scheme: "light", label: "accent solid", fg: "--uir-accent-contrast", bg: "--uir-accent" },
  { scheme: "light", label: "positive solid", fg: "--uir-success-contrast", bg: "--uir-success" },
  { scheme: "light", label: "danger solid", fg: "--uir-danger-contrast", bg: "--uir-danger" },
  { scheme: "light", label: "neutral solid", fg: "--uir-text", bg: "--uir-surface-raised" },

  // Ghost and outline: the tone used as text, on the page and on the hover wash.
  { scheme: "light", label: "accent ghost", fg: "--uir-accent", bg: "--uir-background" },
  { scheme: "light", label: "accent ghost hover", fg: "--uir-accent", bg: "--uir-accent-subtle" },
  { scheme: "light", label: "positive ghost", fg: "--uir-success", bg: "--uir-background" },
  {
    scheme: "light",
    label: "positive ghost hover",
    fg: "--uir-success",
    bg: "--uir-success-subtle",
  },
  { scheme: "light", label: "danger ghost", fg: "--uir-danger", bg: "--uir-background" },
  { scheme: "light", label: "danger ghost hover", fg: "--uir-danger", bg: "--uir-danger-subtle" },
  { scheme: "light", label: "neutral ghost", fg: "--uir-text", bg: "--uir-background" },
  { scheme: "light", label: "muted text on page", fg: "--uir-text-muted", bg: "--uir-background" },

  // Dark scheme: the on-fill foregrounds invert, so each is checked against its own.
  { scheme: "dark", label: "accent solid", fg: "--uir-accent-contrast", bg: "--uir-accent" },
  { scheme: "dark", label: "positive solid", fg: "--uir-success-contrast", bg: "--uir-success" },
  { scheme: "dark", label: "danger solid", fg: "--uir-danger-contrast", bg: "--uir-danger" },
  { scheme: "dark", label: "neutral solid", fg: "--uir-text", bg: "--uir-surface-raised" },
  { scheme: "dark", label: "accent ghost", fg: "--uir-accent", bg: "--uir-background" },
  { scheme: "dark", label: "positive ghost", fg: "--uir-success", bg: "--uir-background" },
  { scheme: "dark", label: "danger ghost", fg: "--uir-danger", bg: "--uir-background" },
  { scheme: "dark", label: "text on page", fg: "--uir-text", bg: "--uir-background" },
  { scheme: "dark", label: "muted text on page", fg: "--uir-text-muted", bg: "--uir-background" },

  // High contrast.
  {
    scheme: "high-contrast",
    label: "accent solid",
    fg: "--uir-accent-contrast",
    bg: "--uir-accent",
  },
  {
    scheme: "high-contrast",
    label: "positive solid",
    fg: "--uir-success-contrast",
    bg: "--uir-success",
  },
  {
    scheme: "high-contrast",
    label: "danger solid",
    fg: "--uir-danger-contrast",
    bg: "--uir-danger",
  },
  {
    scheme: "high-contrast",
    label: "text on page",
    fg: "--uir-text",
    bg: "--uir-background",
  },
] as const;

/** SC 1.4.3 for normal-size text. A control label is 1rem at weight 500, which is not
 * "large text" (18.66px bold / 24px regular), so 4.5 is the applicable threshold. */
const AA_TEXT = 4.5;

/** SC 1.4.11 for a non-text indicator: a border or a focus ring. */
const AA_NON_TEXT = 3;

const tokensCss = readFileSync(join(process.cwd(), "src", "theme", "tokens.css"), "utf8");

/** Declarations inside the block whose selector list contains `selector`. */
function schemeTokens(selector: string): Map<string, string> {
  const start = tokensCss.indexOf(selector);
  expect(start, `no scheme block matching ${selector}`).toBeGreaterThan(-1);

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

  const found = new Map<string, string>();
  const body = tokensCss.slice(open + 1, end);

  for (const match of body.matchAll(/(--uir-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    found.set(match[1] as string, (match[2] as string).trim());
  }

  return found;
}

/**
 * The base palette, which every scheme overrides.
 *
 * A selector list, so the closing brace is found by depth counting rather than by
 * assuming the block ends at the first `}`.
 */
const baseTokens = schemeTokens(':root,\n[data-uir-scheme="light"]');

const darkTokens = schemeTokens('[data-uir-scheme="dark"]');
const contrastTokens = schemeTokens('[data-uir-scheme="high-contrast"]');

/** Base, overlaid with a scheme's overrides. */
function palette(scheme: "light" | "dark" | "high-contrast"): Map<string, string> {
  const merged = new Map(baseTokens);

  const overrides =
    scheme === "dark" ? darkTokens : scheme === "high-contrast" ? contrastTokens : null;
  for (const [property, value] of overrides ?? []) merged.set(property, value);

  return merged;
}

/** Resolve a token to a concrete colour, following `var()` indirection. */
function resolve(tokens: Map<string, string>, name: string): string {
  const seen = new Set<string>();
  let current: string | undefined = name;

  while (current !== undefined) {
    if (seen.has(current)) {
      throw new Error(`circular token reference: ${[...seen].join(" -> ")}`);
    }
    seen.add(current);

    const value = tokens.get(current);
    if (value === undefined) throw new Error(`undefined token: ${current}`);

    const reference = /^var\(\s*(--uir-[a-z0-9-]+)\s*\)$/i.exec(value);
    if (reference === null) return value;
    current = reference[1];
  }

  throw new Error(`unresolvable token: ${name}`);
}

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parse `#rgb`, `#rrggbb` or `rgb()` / `rgba()`, the only notations the tokens use. */
function parseColor(value: string): Rgb {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);

  if (hex !== null) {
    const digits = hex[1] as string;
    const full =
      digits.length === 3
        ? digits
            .split("")
            .map((d) => d + d)
            .join("")
        : digits;

    return {
      r: Number.parseInt(full.slice(0, 2), 16),
      g: Number.parseInt(full.slice(2, 4), 16),
      b: Number.parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }

  const fn = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.%]+))?\s*\)$/i.exec(
    value
  );
  if (fn !== null) {
    const alpha = fn[4];
    return {
      r: Number.parseFloat(fn[1] as string),
      g: Number.parseFloat(fn[2] as string),
      b: Number.parseFloat(fn[3] as string),
      a:
        alpha === undefined || alpha.endsWith("%")
          ? Number.parseFloat(alpha ?? "1")
          : Number.parseFloat(alpha),
    };
  }

  throw new Error(`unparseable colour: ${value}`);
}

/**
 * Composite a translucent colour over an opaque one, which is what a browser does.
 *
 * Rounded to 8 bits per channel because that is what a browser composites to. Without
 * the rounding, 50% black over white yields 127.5 and the computed ratio differs from
 * the rendered one in the third decimal � small, but it means this helper would
 * disagree with axe and with devtools about the same pixels.
 */
function flatten(top: Rgb, bottom: Rgb): Rgb {
  if (top.a >= 1) return top;
  return {
    r: Math.round(top.r * top.a + bottom.r * (1 - top.a)),
    g: Math.round(top.g * top.a + bottom.g * (1 - top.a)),
    b: Math.round(top.b * top.a + bottom.b * (1 - top.a)),
    a: 1,
  };
}

/** WCAG 2.x relative luminance. */
function luminance(color: Rgb): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

/**
 * WCAG 2.x contrast ratio, 1 to 21.
 *
 * `behind` is what a translucent `background` is painted on, and is required whenever the
 * background has alpha. The dark scheme's `--uir-*-subtle` hover washes are exactly
 * that: `rgba(74, 222, 128, 0.16)` over the page. Reading their raw RGB would compare
 * the text against a fully-saturated green the user never sees.
 */
function contrast(foreground: string, background: string, behind: string = "#ffffff"): number {
  const back = parseColor(background);
  // Resolve the background first, so the foreground composites over the colour that is
  // actually behind it.
  const resolvedBack = back.a >= 1 ? back : flatten(back, parseColor(behind));
  const front = flatten(parseColor(foreground), resolvedBack);

  const a = luminance(front);
  const b = luminance(resolvedBack);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("colour contrast", () => {
  it.each(PAIRS)("$scheme: $label reaches $threshold", ({ scheme, label, fg, bg }) => {
    const tokens = palette(scheme);
    const page = resolve(tokens, "--uir-background");
    const ratio = contrast(resolve(tokens, fg), resolve(tokens, bg), page);

    // A formatted, specific failure message: a bare `expected 3.3 to be >= 4.5` does not
    // say which pair failed or which token to change.
    expect(
      ratio,
      `${scheme} "${label}": ${fg} (${resolve(tokens, fg)}) on ${bg} ` +
        `(${resolve(tokens, bg)}) is ${ratio.toFixed(2)}:1, below the WCAG SC 1.4.3 ` +
        `minimum of ${AA_TEXT}:1 for normal-size text. Darken or lighten one of them.`
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("gives every tone a solid fill that differs from its on-fill foreground", () => {
    // A fill equal to its own foreground would pass contrast arithmetically only by
    // accident; this states the intent directly.
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const tokens = palette(scheme);

      for (const tone of ["accent", "success", "danger"] as const) {
        const fill = resolve(tokens, `--uir-${tone}`);
        const on = resolve(tokens, `--uir-${tone}-contrast`);

        expect(fill, `${scheme} ${tone}`).not.toBe(on);
      }
    }
  });

  it("keeps a non-text border distinguishable from its background", () => {
    // SC 1.4.11 applies to the outline and focus ring, which convey the control's edge.
    const tokens = palette("light");

    expect(
      contrast(resolve(tokens, "--uir-border-strong"), resolve(tokens, "--uir-background"))
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it("does not require contrast from disabled text", () => {
    /*
     * SC 1.4.3 exempts inactive controls, so a disabled label below 4.5:1 is conformant
     * and must not be treated as a failure. Asserted so the exemption is a decision
     * rather than an oversight.
     */
    const tokens = palette("light");
    const ratio = contrast(
      resolve(tokens, "--uir-text-disabled"),
      resolve(tokens, "--uir-background")
    );

    expect(ratio).toBeLessThan(AA_TEXT);
  });
});

describe("the contrast helper", () => {
  it("computes the reference values from the WCAG definition", () => {
    // Black on white is the maximum; identical colours are the minimum. If these drift,
    // every ratio above is wrong in the same direction and nothing would catch it.
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrast("#2563eb", "#ffffff")).toBeCloseTo(contrast("#ffffff", "#2563eb"), 10);
  });

  it("composites a translucent foreground over its background", () => {
    /*
     * A `rgba()` subtle wash is what a dark-scheme ghost hover paints. Ignoring the
     * alpha would compute contrast against a colour the user never sees.
     *
     * 50% black over white is `#808080` (0.5 * 255 = 127.5, rounded), and black on that
     * is 5.32:1 � so the expected value is checkable by hand rather than merely
     * self-consistent.
     */
    expect(contrast("rgba(0, 0, 0, 0.5)", "#ffffff")).toBeCloseTo(
      contrast("#808080", "#ffffff"),
      5
    );
    expect(contrast("rgba(0, 0, 0, 0.5)", "#ffffff")).toBeCloseTo(3.95, 2);
  });

  it("composites a translucent background over what is behind it", () => {
    // The dark scheme's hover washes are `rgba()`, and they are backgrounds. Reading
    // their raw RGB would score the text against a colour the user never sees � and it
    // would score it in the wrong direction, because a 16% green is far lighter than the
    // dark page it sits on.
    expect(contrast("#000000", "rgba(0, 0, 0, 0.5)", "#ffffff")).toBeCloseTo(
      contrast("#000000", "#808080"),
      5
    );
    expect(contrast("#000000", "rgba(0, 0, 0, 0.5)", "#ffffff")).toBeCloseTo(5.32, 2);
  });

  it("treats a fully opaque rgba() as its own colour", () => {
    expect(contrast("#000000", "rgba(255, 255, 255, 1)")).toBeCloseTo(21, 5);
  });
});
