/**
 * Skeleton.
 *
 * A placeholder shaped like the content it stands in for, hidden from assistive technology and
 * described by a status region instead.
 *
 * The whole component is one `role="status"` wrapper around N `aria-hidden` bars. That is the entire
 * accessibility contract, and it is worth stating plainly: a skeleton announces *nothing* about its own
 * shape, because a screen reader reading "grey rectangle" has told the user nothing they did not know.
 */

import { forwardRef } from "react";
import { cx } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./skeleton.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { SkeletonProps } from "./skeleton.types";

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(props, ref) {
  const {
    variant = "text",
    lines = 1,
    width,
    height,
    animate = true,
    label,
    className,
    style,
    ...rest
  } = props;

  const name = label ?? resolveMessage(undefined, BASE_MESSAGES, "common.loading");

  /*
   * `lines` is clamped to one, not zero.
   *
   * A zero-line skeleton renders an empty `role="status"` region, which announces nothing at all and
   * occupies no height — so the content it stands in for appears to arrive from nothing, which is the
   * layout shift the component exists to prevent.
   */
  const count = Math.max(1, Math.floor(lines));

  /*
   * Every bar is `aria-hidden`.
   *
   * The status region above them carries the meaning. Individually they are decorative shapes, and a
   * screen reader describing each one is the failure mode `role="status"` exists to prevent.
   */
  const bars = Array.from({ length: count }, (_, index) => (
    <span
      key={index}
      className="uir-skeleton__bar"
      aria-hidden="true"
      style={{
        /*
         * The last line of a paragraph is shorter than the ones above it.
         *
         * Applied here rather than in CSS because it depends on the *count*, which only JavaScript
         * has. A CSS `:last-child` rule would shorten every last line including a single-line
         * skeleton, which is then a stub rather than a line.
         */
        ...(variant === "text" && index === count - 1 && count > 1
          ? { inlineSize: "var(--uir-skeleton-last-line, 65%)" }
          : {}),
      }}
    />
  ));

  return (
    <div
      {...rest}
      ref={ref}
      /*
       * `role="status"` and `aria-busy`.
       *
       * `status` is a live region with an implicit `aria-live="polite"`, which is what announces the
       * label once — when the region appears. `aria-busy` says the region is not ready, so a screen
       * reader does not try to read the bars while they are still being drawn.
       */
      role="status"
      /*
       * `aria-live` stated even though `role="status"` implies `polite`.
       *
       * The implicit value is the right one and stating it costs one attribute. What it buys is that a
       * reader of this file does not have to know that `status` is polite to be sure the region is —
       * and the one case that genuinely matters is `assertive`, which nobody would guess is right here.
       */
      aria-live="polite"
      aria-busy="true"
      aria-label={name}
      className={cx("uir-skeleton", className)}
      /*
       * The consumer's width and height land on the *root*, so a skeleton occupies the same box the
       * content will — which is the only reason it prevents a layout shift.
       *
       * Applied after `{...rest}` so a consumer's own `style` cannot override the dimension the
       * skeleton was given, which would leave it the wrong size and reintroduce the shift.
       */
      style={{
        ...style,
        ...(width === undefined ? {} : { inlineSize: toLength(width) }),
        ...(height === undefined ? {} : { blockSize: toLength(height) }),
      }}
      data-variant={variant}
      data-animate={animate ? "" : undefined}
      data-lines={count}
    >
      {variant === "text" ? bars : <span className="uir-skeleton__shape" aria-hidden="true" />}
    </div>
  );
});

/**
 * A number becomes pixels, anything else is passed through.
 *
 * So `width={200}` and `width="50%"` both work, which is what a consumer writing either expects and
 * what a component that silently ignored one of them would not.
 */
function toLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}
