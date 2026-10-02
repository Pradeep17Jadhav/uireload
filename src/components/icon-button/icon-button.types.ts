/**
 * IconButton prop types.
 *
 * Reconciliation in `README.md`.
 */

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone, Variant } from "../../foundations";

/**
 * Props specific to `IconButton`.
 *
 * `variant` and `tone` are inherited unchanged from `Button`. `edge` is a Material
 * kept because it has no equivalent that a consumer could write for themselves
 * without duplicating the negative-margin rule.
 */
export interface IconButtonOwnProps {
  /**
   * Emphasis. Same ladder as `Button`.
   *
   * @default "ghost"
   */
  variant?: Variant | undefined;

  /**
   * Intent. Same ladder as `Button`.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Size. Drives both the control box and the icon inside it.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /** Not actionable, and out of the tab order. */
  disabled?: boolean | undefined;

  /** Shows a busy indicator and blocks interaction. */
  loading?: boolean | undefined;

  /**
   * Replaces the default busy indicator. Must be decorative; the wrapper is
   * `aria-hidden`.
   */
  loadingIndicator?: ReactNode | undefined;

  /**
   * Removes padding on one inline edge and pulls the control out by the same amount,
   * so a row of icon buttons aligns their icons with the content beside them.
   *
   * Uses logical `start` / `end`, so it mirrors correctly in RTL.
   *
   * @default false
   */
  edge?: "start" | "end" | false | undefined;

  /** Merged onto the root element. */
  className?: string | undefined;

  /** Forwarded to the root `<button>`. */
  ref?: Ref<HTMLButtonElement> | undefined;
}

export interface IconButtonProps
  extends
    IconButtonOwnProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof IconButtonOwnProps> {
  /**
   * Defaults to `"button"`.
   *
   * Present for parity with `Button`. There is no label, so `submit` is only
   * meaningful when the consumer also sets `aria-label`.
   */
  type?: "button" | "submit" | "reset" | undefined;
}
