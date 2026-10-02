/**
 * Button prop types.
 *
 * The reasoning behind each choice is in `README.md`.
 */

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone, Variant } from "../../foundations";

/**
 * Props specific to `Button`. Everything else comes from the native element.
 *
 * Deliberately absent, with reasons recorded in `README.md`:
 *
 * - `color` — replaced by `tone`; there is no palette to key into.
 * - `href` / `component` / `asChild` — v1 renders a real `<button>` only. A link
 *   button needs either `asChild` composition or a second code path for
 *   `disabled` on an anchor; both are planned, neither is in v1.
 * - `loadingPosition` — repositioning the label around the indicator. The busy indicator
 *   is centred instead, which is
 *   what this does.
 * - `loadingDelay` — see `docs/foundations.md` section 5.4.
 * - `disableElevation`, `disableRipple`, `disableFocusRipple` — Material machinery.
 *   Elevation and ripples are not part of this library's surface, and focus rings are
 *   never optional.
 */
export interface ButtonOwnProps {
  /**
   * Emphasis. `ghost` < `outline` < `solid`.
   *
   * @default "outline"
   */
  variant?: Variant | undefined;

  /**
   * Intent. Orthogonal to `variant`, so every tone exists at every emphasis level.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Size. See `docs/foundations.md` section 2.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /**
   * Not actionable, and out of the tab order.
   *
   * Rendered with the native `disabled` attribute, so assistive technology agrees
   * with the visual state without an extra `aria-disabled`.
   */
  disabled?: boolean | undefined;

  /**
   * Shows a busy indicator and blocks interaction.
   *
   * The accessible name is preserved, so a loading button still announces what it is
   * doing. The indicator's wrapper is always in the DOM and toggled with CSS, because
   * conditionally inserting it crashes Google Translate
   * (material-ui#27853).
   */
  loading?: boolean | undefined;

  /**
   * Replaces the default busy indicator.
   *
   * Rendered with `aria-hidden`, since the button's own name already conveys the
   * state. Must be decorative.
   */
  loadingIndicator?: ReactNode | undefined;

  /**
   * Element placed before the label.
   *
   * Sized by the component via `--uir-icon-size-*`; it inherits the label's colour.
   */
  startIcon?: ReactNode | undefined;

  /**
   * Element placed after the label.
   *
   * A trailing icon on a label-less button is meaningless, so it is not supported.
   */
  endIcon?: ReactNode | undefined;

  /** Fills the width of the containing block. */
  fullWidth?: boolean | undefined;

  /** Merged onto the root element. */
  className?: string | undefined;

  /**
   * Forwarded to the root `<button>`.
   *
   * @default "button"
   */
  ref?: Ref<HTMLButtonElement> | undefined;
}

/**
 * `type` is constrained to the three values a button can have, rather than left as
 * `string`. This is a real narrowing: a typo becomes a type
 * error instead of an inert attribute.
 */
export type ButtonType = "button" | "submit" | "reset";

export interface ButtonProps
  extends ButtonOwnProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> {
  /** Defaults to `"button"` so a button inside a form does not submit it. */
  type?: ButtonType | undefined;
}
