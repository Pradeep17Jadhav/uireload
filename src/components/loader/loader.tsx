/**
 * Loader.
 *
 * A progress bar, for when the work *is* measurable. The determinate half of the
 * idea `Spinner` covers the other half of, and the split is the reason neither has a
 * `mode` prop: `Loader` without a `value` is indeterminate, `Spinner` is always
 * indeterminate, and a caller picks the component rather than a flag.
 *
 * The determinate form is a real `progressbar` carrying `aria-valuenow`,
 * `aria-valuemin` and `aria-valuemax`. The indeterminate form is the **same role
 * with those three omitted** — which is the specified way to say "unknown", and the
 * reason `value` is optional rather than defaulting to `0`. A bar pinned at zero
 * tells a screen reader "nothing done yet", which is a different claim from "we do
 * not know", and only one of them is true.
 *
 * `aria-valuetext` carries `valueLabel` when given, so a screen reader hears "Step 2
 * of 7" rather than "20". `showValue` is separate and about sight only: the bar
 * already shows the proportion, so repeating it in text is a second thing to read
 * that says the same thing.
 *
 * The fill's width is a percentage of the track rather than a pixel width, so the
 * same rule serves any `max`, and a consumer who changes it needs no arithmetic.
 */

import { forwardRef, type CSSProperties } from "react";
import { cx } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

import type { LoaderProps } from "./loader.types";

export const Loader = forwardRef<HTMLDivElement, LoaderProps>(function Loader(
  {
    className,
    style,
    value,
    max = 100,
    label,
    showValue = false,
    valueLabel,
    size = "md",
    tone = "accent",
    children,
    ...rest
  },
  ref
) {
  const determinate = value !== undefined;

  /*
   * Clamped here rather than in CSS.
   *
   * A value outside the range is a bug in the caller, and the fix is to keep the
   * *accessible* value honest as well as the drawn one — a `progressbar` reporting
   * 140 out of 100 is wrong in the same way whether or not the bar overflows. `0` is
   * returned for a non-finite value, which is the only safe reading of `NaN`.
   */
  const span = max === 0 ? 0 : max;
  const safe = determinate && Number.isFinite(value) ? Math.min(span, Math.max(0, value)) : 0;
  const percent = span === 0 ? 0 : (safe / span) * 100;

  const name = label ?? resolveMessage(undefined, BASE_MESSAGES, "common.loading");

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uir-loader", className)}
      style={style}
      data-size={size}
      data-tone={tone}
      data-determinate={determinate ? "" : undefined}
      role="progressbar"
      aria-label={name}
      aria-valuenow={determinate ? safe : undefined}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? span : undefined}
      aria-valuetext={valueLabel}
    >
      {/*
        The track and the fill are two elements because the fill has to be *on* the
        track and a pseudo-element cannot be the one carrying the accessible state.
      */}
      <div className="uir-loader__track">
        <div
          className="uir-loader__fill"
          /*
           * A custom property rather than `inlineSize`, so the fill is a percentage
           * of its own track and the same rule serves any `max`. Cast because
           * `CSSProperties` does not admit an unknown key.
           */
          style={
            { "--uir-loader-percent": determinate ? `${percent}%` : undefined } as CSSProperties
          }
        />
      </div>

      {(showValue || valueLabel !== undefined) && (
        <span className="uir-loader__value">
          {valueLabel ?? (determinate ? `${Math.round(percent)}%` : null)}
        </span>
      )}

      {children}
    </div>
  );
});
