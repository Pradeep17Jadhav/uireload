/**
 * Slider geometry, as pure functions.
 *
 * The arithmetic that turns a pointer position into a value, and a value into the thumb that should
 * move. Extracted for two reasons, and the second is the important one:
 *
 * 1. It is the same arithmetic for both orientations and both thumb counts, so stating it once is the
 *    only way the two cannot drift apart.
 * 2. **It is testable.** `jsdom` has no `PointerEvent` and no `setPointerCapture`, so a gesture cannot be
 *    delivered to a component there at all — `fireEvent.pointerDown(el, { clientX })` arrives with
 *    `clientX` as `NaN`. Every attempt to test this through the DOM passed or failed for reasons that
 *    had nothing to do with the code. As functions, it is simply arithmetic and can be checked exactly.
 *
 * Private to the library. Nothing here observes a reference library's API: it is the geometry of one
 * rail and one thumb.
 */

/** Which way the rail runs. */
export type TrackOrientation = "horizontal" | "vertical";

/** The two dimensions that matter, both measured from `getBoundingClientRect`. */
export interface TrackGeometry {
  /** The rail's extent along the main axis — its width, or its height when vertical. */
  length: number;
  /** The thumb's extent across the main axis. Its extent *along* the axis is irrelevant here. */
  thumb: number;
}

/**
 * Where along the rail a pointer position falls, as a fraction from 0 to 1.
 *
 * 0 is the **minimum** value's end of the rail and 1 is the maximum's, which for a vertical rail means
 * 0 is at the bottom. `--uir-slider-at` and the drawn thumb are both written against that convention.
 *
 * `position` must therefore already be measured **from that end**: `clientX - rect.left` for a horizontal
 * rail, `rect.bottom - clientY` for a vertical one. The caller does it rather than this function, because
 * getting it wrong — reading the block axis from the top, which is the obvious transcription — transposes
 * a vertical slider's two ends, and a function that took the raw event could not tell that had happened.
 *
 * The travel is the rail shortened by the thumb at **each** end, because the thumb's *centre* is what sits
 * on the value. Without that inset a press at either extreme maps to a value the centre cannot reach, and
 * the drawn thumb stops a thumb's width short of the end of the line.
 *
 * Clamped, so a press beyond either end — which a drag that outruns the control produces — reports the end
 * rather than a value outside the range.
 */
export function fractionFromPointer(geometry: TrackGeometry, position: number): number {
  const { length, thumb } = geometry;

  const travel = length - thumb;
  if (travel <= 0) return 0;

  const fraction = (position - thumb / 2) / travel;

  return Math.min(1, Math.max(0, fraction));
}

/**
 * The index of the thumb nearest a value.
 *
 * A range slider cannot have two thumbs stacked, so a press has to mean exactly one of them. Choosing
 * the *nearest* rather than "the last one in the DOM" is the whole of that decision, and it is why the
 * pointer is handled on the rail: one full-length input per thumb cannot express "nearest", because one
 * of them is always on top and receives every event.
 *
 * Ties resolve to the **lower** index, so the low thumb wins an exact midpoint. Two thumbs at the same
 * value are already a malformed range, and when they are indistinguishable the answer that keeps the
 * value ordered is the one to give.
 */
export function nearestThumbIndex(values: readonly number[], target: number): number {
  return values.reduce(
    (best, candidate, at) =>
      Math.abs(candidate - target) < Math.abs((values[best] as number) - target) ? at : best,
    0
  );
}
