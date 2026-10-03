import { describe, expect, it } from "vitest";

import { fractionFromPointer, nearestThumbIndex } from "./track";

/**
 * The two bugs this file exists for, both of which were invisible to every DOM-level test:
 *
 * - A vertical slider's fraction was read from the top of the rail, so its two ends were transposed and
 *   the drawn thumb went the wrong way for the pointer.
 * - A range slider had no notion of "nearest thumb", so whichever input was on top took every gesture.
 */
describe("fractionFromPointer", () => {
  /** A 432px rail with an 18px thumb: 414px of travel, 9px of inset at each end. */
  const HORIZONTAL = { length: 432, thumb: 18 };

  it("puts the two ends of the rail at 0 and 1", () => {
    expect(fractionFromPointer(HORIZONTAL, 9)).toBe(0);
    expect(fractionFromPointer(HORIZONTAL, 423)).toBe(1);
  });

  it("puts the midpoint of the *travel* at one half", () => {
    // 9 + 414 / 2, which is not the middle of the rail — that difference is the thumb inset.
    expect(fractionFromPointer(HORIZONTAL, 9 + 207)).toBeCloseTo(0.5, 10);
  });

  it("clamps a press beyond either end", () => {
    expect(fractionFromPointer(HORIZONTAL, -500)).toBe(0);
    expect(fractionFromPointer(HORIZONTAL, 5000)).toBe(1);
  });

  it("returns 0 when the rail has no travel, rather than dividing by it", () => {
    // A collapsed rail, or one whose thumb is wider than it is. `0/0` is `NaN`, and a `NaN` fraction
    // becomes a `NaN` value, which renders as `value="NaN"` on the input.
    expect(fractionFromPointer({ length: 18, thumb: 18 }, 9)).toBe(0);
    expect(fractionFromPointer({ length: 0, thumb: 0 }, 0)).toBe(0);
  });

  describe("vertical", () => {
    /** A 210px rail with an 18px thumb. The position is measured from the *bottom*. */
    const VERTICAL = { length: 210, thumb: 18 };

    it("reads the position from the bottom, so the minimum is at the bottom", () => {
      // clientY 201 on a 210px rail is 9px from the bottom: the inset, so fraction 0.
      expect(fractionFromPointer(VERTICAL, 210 - 201)).toBe(0);
      // And 9px from the top is the other end.
      expect(fractionFromPointer(VERTICAL, 210 - 9)).toBe(1);
    });

    it("produces the same fractions as a horizontal rail, for the same fraction of its own travel", () => {
      // Each rail's own travel, so this compares the two orientations rather than two lengths.
      for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
        const verticalPosition = 9 + (210 - 18) * fraction;
        const horizontalPosition = 9 + (432 - 18) * fraction;

        expect(fractionFromPointer(VERTICAL, verticalPosition)).toBeCloseTo(
          fractionFromPointer(HORIZONTAL, horizontalPosition),
          10
        );
      }
    });
  });
});

describe("nearestThumbIndex", () => {
  it("picks the thumb a value belongs to", () => {
    expect(nearestThumbIndex([25, 75], 10)).toBe(0);
    expect(nearestThumbIndex([25, 75], 90)).toBe(1);
  });

  it("prefers the thumb nearest the value, not the first or the last", () => {
    // The bug: every gesture went to whichever thumb was on top, so a press at 10 moved thumb 1.
    expect(nearestThumbIndex([25, 75], 10)).not.toBe(1);
    expect(nearestThumbIndex([25, 75], 90)).not.toBe(0);
  });

  it("resolves an exact tie to the lower index, so the value stays ordered", () => {
    expect(nearestThumbIndex([25, 75], 50)).toBe(0);
  });

  it("handles a single thumb", () => {
    expect(nearestThumbIndex([40], 0)).toBe(0);
    expect(nearestThumbIndex([40], 100)).toBe(0);
  });

  it("returns 0 for an empty set rather than throwing", () => {
    expect(nearestThumbIndex([], 50)).toBe(0);
  });

  it("agrees with the thumb that is already closest after a press", () => {
    const values = [25, 75] as const;

    for (const press of [0, 20, 30, 50, 70, 80, 100]) {
      const before = values[nearestThumbIndex(values, press)] as number;
      // Moving the chosen thumb to the press leaves the other one further away than before.
      const after = values.map((v, i) => (i === nearestThumbIndex(values, press) ? press : v));
      const stillNearest = nearestThumbIndex(after, press);

      expect(stillNearest, `press ${press} from ${before}`).toBe(nearestThumbIndex(values, press));
    }
  });
});
