/**
 * Group seam geometry.
 *
 * Asserted on the assembled stylesheet rather than on computed style, for the reason every other
 * foundation test here uses: jsdom does no layout, and the shipped artefact is `dist/index.css`
 * anyway. A test that passed in jsdom and disagreed with the browser would be worse than none.
 *
 * The bug this file exists to prevent: `button.css` used to strip `border-inline-start-width` on
 * `[data-grouped]` — hardcoded to the inline axis — while `toggle-button-group.css` applied the
 * negative margin on the axis named by `data-orientation`. That pair is right for `horizontal` and
 * wrong for `vertical`, where every member but the first lost its **left** border and the vertical
 * seam was never collapsed. Confirmed in a browser: members 2 and 3 reported
 * `border-inline-start-width: 0px` and `margin-block-start: 0px`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const strip = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const BUTTON_CSS = strip(readFileSync(join(ROOT, "src/components/button/button.css"), "utf8"));
const GROUP_CSS = strip(
  readFileSync(join(ROOT, "src/components/toggle-button-group/toggle-button-group.css"), "utf8")
);

describe("the seam belongs to the group, which knows the axis", () => {
  it("keeps no axis-hardcoded rules for data-grouped in button.css", () => {
    expect(BUTTON_CSS).not.toContain("data-grouped");
  });

  it("collapses the horizontal seam on the inline axis", () => {
    const rule = GROUP_CSS.match(
      /\.uir-toggle-button-group\[data-orientation="horizontal"\]\s*>\s*\*:not\(:first-child\)\s*\{([^}]*)\}/
    );

    expect(rule, "no horizontal seam rule").not.toBeNull();

    const body = rule?.[1] ?? "";
    // Both halves, or the seam either doubles or is never collapsed.
    expect(body).toMatch(/border-inline-start-width:\s*0/);
    expect(body).toMatch(/margin-inline-start:\s*calc\(-1 \* var\(--uir-control-border-width\)\)/);
  });

  it("collapses the vertical seam on the block axis", () => {
    const rule = GROUP_CSS.match(
      /\.uir-toggle-button-group\[data-orientation="vertical"\]\s*>\s*\*:not\(:first-child\)\s*\{([^}]*)\}/
    );

    expect(rule, "no vertical seam rule").not.toBeNull();

    const body = rule?.[1] ?? "";
    expect(body).toMatch(/border-block-start-width:\s*0/);
    expect(body).toMatch(/margin-block-start:\s*calc\(-1 \* var\(--uir-control-border-width\)\)/);
  });

  it("never strips an inline border from a vertical group's members", () => {
    /*
     * The regression in one assertion: no rule that applies to every member of a group may touch
     * `border-inline-start-width` without being scoped to `data-orientation="horizontal"`.
     */
    const offenders = [...GROUP_CSS.matchAll(/([^{}]+)\{([^}]*border-inline-start-width[^}]*)\}/g)]
      .map((match) => (match[1] ?? "").trim().replace(/\s+/g, " "))
      .filter((selector) => !selector.includes('data-orientation="horizontal"'));

    expect(offenders).toEqual([]);
  });

  it("rounds the corners on the orientation's own axis", () => {
    // Horizontal: the group's outer ends are the inline ends. Vertical: they are the block ends.
    expect(GROUP_CSS).toMatch(
      /data-orientation="horizontal"\]\s*>\s\*:first-child[^{]*\{[^}]*border-start-start-radius/
    );
    expect(GROUP_CSS).toMatch(
      /data-orientation="vertical"\]\s*>\s\*:first-child[^{]*\{[^}]*border-start-start-radius/
    );
  });

  it("keeps a focus ring visible where the seam is collapsed", () => {
    /*
     * The negative margin pulls a member over its neighbour's border, so a ring drawn *inside* the
     * border box would be clipped by the neighbour. `outline-offset` puts the ring outside the box,
     * which survives the overlap; this asserts the member rule still exists to raise it above.
     */
    expect(GROUP_CSS).toMatch(/\.uir-toggle-button-group\s*>\s*\*:focus-visible/);
  });
});

describe("assembled stylesheet", () => {
  it("contains both seam rules and neither axis-hardcoded border strip", () => {
    /*
     * Read from `dist/index.css` when present, so the assertion covers the artefact consumers load
     * rather than the source. Skipped when absent, because `npm test` must pass without a build.
     */
    const dist = join(ROOT, "dist/index.css");
    let css: string;
    try {
      css = strip(readFileSync(dist, "utf8"));
    } catch {
      return;
    }

    expect(css).toMatch(
      /\.uir-toggle-button-group\[data-orientation="vertical"\]\s*>\s*\*:not\(:first-child\)\s*\{[^}]*border-block-start-width:\s*0/
    );
    expect(css).not.toMatch(/\.uir-button\[data-grouped\]/);
  });
});
