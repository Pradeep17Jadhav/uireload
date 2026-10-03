/**
 * Prop types for Loader.
 *
 * Provenance for this component — the counterpart consulted in each reference
 * library and the symbol behind each non-obvious choice — is recorded in
 * `docs/references.md`. It is not repeated here, because these comments ship as
 * the published `.d.ts`.
 */

import type { UIReloadBaseProps } from "../../types";
import type { Tone } from "../../foundations";

/** Bar height. */
export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderOwnProps {
  /**
   * How much is done, from 0 to `max`.
   *
   * **Omit it and the loader is indeterminate** — a bar that moves without a known
   * destination. Supply it and the bar becomes a determinate `progressbar` carrying
   * `aria-valuenow`.
   *
   * Omitted rather than defaulted to `0`, because "nothing done yet" and "we do not
   * know" are different facts and a bar pinned at zero tells a screen reader the
   * first one when the truth is the second.
   */
  value?: number | undefined;

  /**
   * The value that means complete.
   *
   * @default 100
   *
   * A percentage unless the caller says otherwise, so `value={40}` reads as 40% with
   * no further ceremony.
   */
  max?: number | undefined;

  /**
   * What is loading, for assistive technology.
   *
   * Defaults to the catalogue's "Loading" rather than to nothing, because an
   * unlabelled `progressbar` is an accessibility failure and the common case — a
   * caller who has not thought about it — must not be the broken one.
   */
  label?: string | undefined;

  /**
   * Show the numeric value beside the bar.
   *
   * @default false
   *
   * Off by default because the bar already shows it, and a number repeated in text
   * is a second thing to read that says the same thing. The *accessible* value is
   * always present regardless; this is about sight only.
   */
  showValue?: boolean | undefined;

  /**
   * A description of the current step, in place of the number.
   *
   * Reaches assistive technology as `aria-valuetext` and is rendered in place of the
   * number when `showValue` is on. This is where "Step 2 of 7 — verifying" belongs:
   * a percentage says how much, never what.
   */
  valueLabel?: string | undefined;

  /**
   * Bar height.
   *
   * @default "md"
   */
  size?: LoaderSize | undefined;

  /**
   * Colour.
   *
   * @default "accent"
   */
  tone?: Tone | undefined;
}

export interface LoaderProps extends UIReloadBaseProps<HTMLDivElement>, LoaderOwnProps {}
