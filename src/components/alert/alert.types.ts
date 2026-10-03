/**
 * Alert prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

/**
 * How insistently the alert announces itself.
 *
 * Separate from `tone`, and deliberately: an error that is `assertive` *and* `danger` would be two
 * props agreeing about one thing, and a consumer who sets one and forgets the other gets an error
 * that interrupts or an info banner that shouts.
 */
/** How loud it looks. A page of solid alerts is a page of stop signs. */
export type AlertVariant = "subtle" | "outlined" | "solid";

export type AlertUrgency = "polite" | "assertive";

export interface AlertOwnProps {
  /** The message. The only required prop. */
  children?: ReactNode | undefined;

  /**
   * What the alert is about.
   *
   * @default "alert"
   *
   * `alert` for `urgency="assertive"`, `status` for `polite`.
   *
   * This is not a stylistic choice. `role="alert"` is an implicit `aria-live="assertive"` region and
   * `role="status"` is `polite`, so the role and the urgency are the same fact stated twice — and a
   * component that let them disagree would produce an error banner that waits its turn to be read.
   */
  role?: "alert" | "status" | undefined;

  /**
   * Whether the message interrupts.
   *
   * @default "polite"
   *
   * `assertive` for `tone="danger"` — the one tone here that means "this will cost you" — and `polite`
   * for everything else. Assertive interrupts a screen reader mid-sentence, which is only worth it for
   * something the user must know about immediately.
   */
  urgency?: AlertUrgency | undefined;

  /**
   * Advisory intent.
   *
   * @default "neutral"
   *
   * Four tones, matching the rest of the library. Note what is absent: there is no `warning` tone, for
   * the reason `docs/foundations.md` gives for excluding one — a tone has to carry meaning that
   * changes what the user should *do*, and `accent` already covers "look at this".
   */
  tone?: Tone | undefined;

  /**
   * How loud it looks.
   *
   * @default "subtle"
   *
   * `subtle` is a wash, `outlined` a border on the surface, `solid` a filled tone. A page of solid
   * alerts is a page of stop signs, so solid is for the one thing that is actually wrong.
   */
  variant?: AlertVariant | undefined;

  /**
   * Visible heading above the message.
   *
   * Rendered as a real heading element so the alert appears in a screen reader's heading list, which
   * is how a user skips past it to the content they came for.
   */
  title?: ReactNode | undefined;

  /**
   * Which heading level the title uses.
   *
   * @default "h3"
   *
   * `h3` by default because an alert is nested inside a section and should not outrank it. A consumer
   * with a different document outline sets it.
   */
  titleLevel?: "h2" | "h3" | "h4" | "h5" | "h6" | undefined;

  /** Trailing actions — "Retry", "Dismiss", "View details". */
  action?: ReactNode | undefined;

  /**
   * Whether a dismiss control is shown.
   *
   * @default false
   *
   * Off by default. An alert that dismisses itself is a message the user can lose, and an alert is
   * almost always information they need to still have. The close control is for the ones that really
   * are dismissible.
   */
  dismissible?: boolean | undefined;

  /**
   * Announced name for the dismiss control.
   *
   * @default "Close"
   */
  dismissLabel?: string | undefined;

  /** Called when the dismiss control is activated. The alert does not remove itself. */
  onDismiss?: (() => void) | undefined;

  /**
   * Leading adornment.
   *
   * A tone glyph when absent, suppressed for `tone="neutral"` — an information mark beside text that
   * says nothing is decoration.
   */
  icon?: ReactNode | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the root. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type AlertProps = AlertOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof AlertOwnProps | "children">;
