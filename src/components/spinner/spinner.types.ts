/**
 * Prop types for Spinner.
 *
 * Provenance for this component — the counterpart consulted in each reference
 * library and the symbol behind each non-obvious choice — is recorded in
 * `docs/references.md`. It is not repeated here, because these comments ship as
 * the published `.d.ts`.
 */

import type { UIReloadBaseProps } from "../../types";
import type { Tone } from "../../foundations";

/** Diameter. */
export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerOwnProps {
  /**
   * Diameter.
   *
   * @default "md"
   *
   * The shared `sm | md | lg` vocabulary rather than a pixel `size`, so a spinner
   * beside a control can be asked to match it without the consumer counting
   * pixels.
   */
  size?: SpinnerSize | undefined;

  /**
   * What is loading, for assistive technology.
   *
   * Omit it and the spinner is `aria-hidden`, which is the correct treatment for a
   * decorative one sitting beside text that already says what is happening — a
   * second copy is noise. Supply it and the spinner becomes a labelled
   * `progressbar` in its own right.
   *
   * This is the one decision that is not a matter of taste: an unlabelled
   * `progressbar` is an accessibility failure, so the two states cannot be merged
   * and the prop decides which one you get.
   */
  label?: string | undefined;

  /**
   * Colour.
   *
   * @default "accent"
   *
   * `neutral` for a spinner on a surface where a coloured one would read as a
   * status rather than as activity.
   */
  tone?: Tone | undefined;

  /**
   * How thick the ring is, relative to its diameter.
   *
   * @default "md"
   *
   * `thin` reads as quieter at small diameters, where a thick ring closes into a
   * solid disc; `thick` reads as more deliberate at large ones.
   */
  thickness?: "thin" | "md" | "thick" | undefined;
}

export interface SpinnerProps extends UIReloadBaseProps<HTMLSpanElement>, SpinnerOwnProps {}
