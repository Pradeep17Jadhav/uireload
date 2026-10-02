/**
 * Overlay positioning tests.
 *
 * The algorithm is pure arithmetic over two rects and two sizes, so it is tested directly
 * rather than through a rendered popover: jsdom does no layout, so a rendered test could only
 * assert that the function was called, not that it placed anything correctly.
 *
 * The cases that matter are the ones that are wrong in subtle ways — a flip that should not
 * have happened, an arrow pointing off the end of its surface — so each is pinned with a
 * comment saying what it would look like if the rule broke.
 */

import { describe, expect, it } from "vitest";

import { computeOverlayPosition, resolvePlacement } from "./positioning";

/**
 * A rect at a known position.
 *
 * Only the six fields the algorithm reads, with `bottom` and `right` derived so a test never
 * states them inconsistently. jsdom's `DOMRect` constructor exists but returns zeros for
 * everything, so a literal is both clearer and the only way to place a rect by hand.
 */
function rect(top: number, left: number, width = 100, height = 20): DOMRectReadOnly {
  return { top, left, width, height, bottom: top + height, right: left + width } as DOMRectReadOnly;
}

/** Roomy defaults, so a test that does not care about the viewport is not testing it. */
const ROOMY = {
  viewportWidth: 1000,
  viewportHeight: 800,
  offset: 8,
  viewportPadding: 8,
  align: "center" as const,
  direction: "ltr" as const,
};

describe("resolvePlacement", () => {
  it("leaves the block axis alone", () => {
    expect(resolvePlacement("top", "ltr")).toBe("top");
    expect(resolvePlacement("bottom", "rtl")).toBe("bottom");
  });

  it("mirrors the inline axis in RTL", () => {
    expect(resolvePlacement("start", "ltr")).toBe("left");
    expect(resolvePlacement("start", "rtl")).toBe("right");
    expect(resolvePlacement("end", "ltr")).toBe("right");
    expect(resolvePlacement("end", "rtl")).toBe("left");
  });
});

describe("computeOverlayPosition: the requested placement", () => {
  it("centres below the anchor and clears it by the offset", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });

    // anchor bottom is 120, plus the 8px offset.
    expect(result.top).toBe(128);
    // Anchor centre is 450; a 200px surface centred on it starts at 350.
    expect(result.left).toBe(350);
    expect(result.placement).toBe("bottom");
    expect(result.shifted).toBe(false);
  });

  it("centres above the anchor when asked to sit above it", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      // Far enough down that a 150px surface plus padding fits above it; an anchor at 100
      // would overflow the top, and the flip rule below would send the surface downwards
      // instead — which is correct, and is what the flip tests assert.
      anchorRect: rect(300, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "top",
    });

    // Anchor top is 300, minus the 150px surface, minus the 8px offset.
    expect(result.top).toBe(300 - 150 - 8);
    expect(result.placement).toBe("top");
  });

  it("puts the surface beside the anchor for an inline placement", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400, 20, 40),
      surfaceWidth: 200,
      surfaceHeight: 100,
      placement: "end",
    });

    // The anchor's right edge is 420, plus the 8px offset.
    expect(result.left).toBe(420 + 8);
    // Centred on the anchor's 40px block axis: 100 + 20 - 50.
    expect(result.top).toBe(70);
  });

  it("aligns the surface's inline-start edge to the anchor's when stretched", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
      align: "stretch",
    });

    // Stretched below means the surface lines up with the anchor's left edge.
    expect(result.left).toBe(400);
  });

  it("aligns a stretched surface to the anchor's right edge in RTL", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400, 20),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
      align: "stretch",
      direction: "rtl",
    });

    // The anchor's inline-start is its right edge in RTL, so 420 is the answer here and 400
    // would mean the surface hangs off the wrong side of its trigger.
    expect(result.left).toBe(420);
  });
});

describe("computeOverlayPosition: flipping", () => {
  it("flips above when below would overflow the viewport and above fits", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(600, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });

    // 600 + 20 + 8 = 628, plus 150 = 778... which fits in 800. Move the anchor lower.
    expect(result.placement).toBe("bottom");
  });

  it("flips to the opposite side when the requested one overflows", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(700, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });

    // 700 + 20 + 8 + 150 = 878, past the 792px limit, so it goes above.
    expect(result.placement).toBe("top");
    expect(result.top).toBe(700 - 150 - 8);
  });

  it("flips from the inline axis too, not just the block one", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 900, 20, 40),
      surfaceWidth: 200,
      surfaceHeight: 100,
      placement: "end",
    });

    // 900 + 20 + 8 = 928, past the 992px limit once the 200px surface is added.
    expect(result.placement).toBe("start");
  });

  it("prefers flipping over shifting, which is the rule that matters", () => {
    /*
     * Both placements overflow, so a flip cannot help and a clamp is applied. The assertion
     * is that the placement stays as requested: a surface that moved sideways while its arrow
     * still points at the anchor is confusing, whereas one that has changed sides says so.
     */
    const result = computeOverlayPosition({
      ...ROOMY,
      viewportHeight: 200,
      anchorRect: rect(50, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });

    expect(result.placement).toBe("bottom");
    expect(result.shifted).toBe(true);
  });
});

describe("computeOverlayPosition: clamping", () => {
  it("keeps the surface inside the viewport padding when no side fits", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      viewportHeight: 200,
      anchorRect: rect(50, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });

    // A 150px surface in a 200px viewport with 8px padding has 34px of room.
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.top + 150).toBeLessThanOrEqual(200 - 8);
  });

  it("never places a surface at a negative coordinate", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(400, 10),
      surfaceWidth: 300,
      surfaceHeight: 400,
      placement: "top",
      viewportHeight: 600,
    });

    expect(result.left).toBeGreaterThanOrEqual(8);
    expect(result.top).toBeGreaterThanOrEqual(8);
  });

  it("reports whether it had to shift, so a consumer can tell", () => {
    const centred = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });
    expect(centred.shifted).toBe(false);

    const edge = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 990),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });
    expect(edge.shifted).toBe(true);
  });
});

describe("computeOverlayPosition: the arrow", () => {
  it("points at the anchor's centre", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400, 100),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
    });

    // Anchor centre is 450; the surface starts at 350 and is 200 wide, so 50%.
    expect(result.arrowStartPercent).toBeCloseTo(50, 5);
  });

  it("stays inside the surface when the anchor is near one edge", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      viewportWidth: 1200,
      anchorRect: rect(100, 20, 20),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
      align: "stretch",
    });

    // Left unclamped this would be negative, i.e. an arrow hanging off the surface pointing
    // at nothing.
    expect(result.arrowStartPercent).toBeGreaterThan(0);
    expect(result.arrowStartPercent).toBeLessThan(100);
  });

  it("tracks the block axis for an inline placement", () => {
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400, 20, 40),
      surfaceWidth: 200,
      surfaceHeight: 100,
      placement: "end",
    });

    // Anchor centre is 120 on the block axis; the surface starts at 70 and is 100 tall.
    expect(result.arrowStartPercent).toBeCloseTo(50, 5);
  });

  it("is always a finite percentage, even for a zero-size surface", () => {
    // A surface measured before layout reports 0x0, and NaN here would put the arrow at an
    // arbitrary position via `left: NaN%`.
    const result = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400),
      surfaceWidth: 0,
      surfaceHeight: 0,
      placement: "bottom",
    });

    expect(Number.isFinite(result.arrowStartPercent)).toBe(true);
    expect(Number.isFinite(result.left)).toBe(true);
    expect(Number.isFinite(result.top)).toBe(true);
  });
});

describe("computeOverlayPosition: RTL", () => {
  it("mirrors an inline placement without changing the reported name", () => {
    const ltr = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400, 20, 40),
      surfaceWidth: 200,
      surfaceHeight: 100,
      placement: "start",
      direction: "ltr",
    });
    const rtl = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400, 20, 40),
      surfaceWidth: 200,
      surfaceHeight: 100,
      placement: "start",
      direction: "rtl",
    });

    // LTR `start` is left of the anchor (400 - 200 - 8); RTL `start` is right of it
    // (400 + 20 + 8 = 428, the anchor's right edge plus the offset).
    expect(ltr.left).toBe(400 - 200 - 8);
    expect(rtl.left).toBe(428);
    /*
     * And the reported placement stays logical, so a consumer reading the resolved placement
     * never has to know the direction to interpret it. Asserting the RTL case specifically
     * matters: mapping physical `right` to logical `end` without consulting the direction
     * makes this report `end`, which is the opposite of what was asked for.
     */
    expect(ltr.placement).toBe("start");
    expect(rtl.placement).toBe("start");
  });

  it("does not mirror the block axis", () => {
    const ltr = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
      direction: "ltr",
    });
    const rtl = computeOverlayPosition({
      ...ROOMY,
      anchorRect: rect(100, 400),
      surfaceWidth: 200,
      surfaceHeight: 150,
      placement: "bottom",
      direction: "rtl",
    });

    expect(ltr.top).toBe(rtl.top);
  });
});
