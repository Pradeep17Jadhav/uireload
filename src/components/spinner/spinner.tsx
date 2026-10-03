/**
 * Spinner.
 *
 * An indeterminate busy indicator: a ring that rotates, for when the work taking
 * longer than a moment is not measurable and reporting a percentage would be a
 * lie.
 *
 * Two states, and which one you get is decided by `label`:
 *
 * - **Decorative** (no `label`): `aria-hidden`. The spinner sits beside text that
 *   already says what is happening, and a second announcement is noise.
 * - **Labelled** (`label` given): `role="progressbar"` with `aria-label`.
 *
 * `role="progressbar"` with no `aria-valuenow` is the indeterminate form of the
 * role, and it is the correct one here. There is deliberately **no** `value` prop:
 * a spinner that takes a percentage is a different component, and having both
 * would mean two ways to say "unknown" that mean different things to assistive
 * technology. For a measurable value use `Loader`, which is the determinate half
 * of the same idea.
 *
 * The rotation is a `transform` on the ring rather than on the element, so it is a
 * compositing change and the spinner costs no layout. The track behind it does not
 * rotate, which is what makes the rotation legible at all — a full circle turning
 * in place is invisible.
 *
 * The ring is drawn with two borders on one box: `currentColor` throughout, so it
 * is correct in every colour scheme and in forced colours with nothing extra to
 * keep in step, and no SVG to import.
 */

import { forwardRef } from "react";
import { cx } from "../../internal";

import type { SpinnerProps } from "./spinner.types";

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, style, size = "md", thickness = "md", tone = "accent", label, ...rest },
  ref
) {
  /*
   * Trimmed and emptiness-tested, rather than `label === undefined`.
   *
   * An empty string is not "no name given": passing one would produce a `progressbar` whose accessible
   * name is `""`, which is the same unlabelled-progressbar failure this prop exists to prevent, reached by
   * the back door. A caller whose label variable resolved to nothing gets the decorative form, which is
   * the safe reading.
   */
  const name = typeof label === "string" ? label.trim() : "";
  const hasName = name !== "";

  return (
    <span
      {...rest}
      ref={ref}
      className={cx("uir-spinner", className)}
      style={style}
      data-size={size}
      data-thickness={thickness}
      data-tone={tone}
      /*
       * The indeterminate form of `progressbar` is the role with no `aria-valuenow`.
       * `aria-valuetext` is left off for the same reason: it would be describing a
       * value that does not exist.
       */
      role={hasName ? "progressbar" : undefined}
      aria-label={hasName ? name : undefined}
      aria-hidden={hasName ? undefined : true}
    >
      {/*
        The track and the arc are two boxes, not one: a single ring cannot show
        rotation, because a circle has no landmarks. The arc is the bordered one and
        is what turns.
      */}
      <span className="uir-spinner__track" />
      <span className="uir-spinner__arc" />
    </span>
  );
});
