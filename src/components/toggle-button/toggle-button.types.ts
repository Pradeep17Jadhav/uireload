/**
 * ToggleButton prop types.
 *
 * The reasoning behind each choice is in `README.md`.
 */

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import type { Size, Tone, Variant } from "../../foundations";

/**
 * The ARIA role a toggle button renders.
 *
 * Normally derived from its context and never set by hand:
 *
 * - Standalone, or inside a multiple-selection group: a button with `aria-pressed`.
 * - Inside a single-selection group: `role="radio"` with `aria-checked`, because the
 *   APG radio-group pattern is the correct one for "choose exactly one".
 *
 * Exposed so a consumer can opt out deliberately, not so they have to.
 */
export type ToggleButtonRole = "button" | "radio";

export interface ToggleButtonOwnProps {
  /**
   * Emphasis. Inherited from `Button` for consistency, which other implementations
   * does not offer.
   *
   * @default "outline"
   */
  variant?: Variant | undefined;

  /**
   * Intent.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Size.
   *
   * @default "md"
   */
  size?: Size | undefined;

  /**
   * Whether the button is in its pressed state.
   *
   * Rendered as `aria-pressed` (or `aria-checked` when `role="radio"`), and as
   * `data-pressed` for styling. `undefined` means uncontrolled.
   *
   * Named `pressed` rather than `selected` because it describes the control's
   * own visual and ARIA state; "selected" is a group concept and is owned by
   * `ToggleButtonGroup`.
   */
  pressed?: boolean | undefined;

  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean | undefined;

  /** Called whenever the component intends to change its pressed state. */
  onPressedChange?: ((pressed: boolean) => void) | undefined;

  /** Not actionable, and out of the tab order. */
  disabled?: boolean | undefined;

  /**
   * Value this button contributes to its group.
   *
   * Required when inside a `ToggleButtonGroup`. Standalone use does not need it.
   */
  value?: string | undefined;

  /** Merged onto the root element. */
  className?: string | undefined;

  /** Forwarded to the root `<button>`. */
  ref?: Ref<HTMLButtonElement> | undefined;
}

export interface ToggleButtonProps
  extends
    ToggleButtonOwnProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ToggleButtonOwnProps> {
  /** Defaults to `"button"`. */
  type?: "button" | "submit" | "reset" | undefined;

  /**
   * Icon rendered before the label, sized by the control.
   */
  startIcon?: ReactNode | undefined;
}
