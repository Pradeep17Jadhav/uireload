/**
 * Snackbar prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

/**
 * Why the snackbar is asking to close.
 *
 * The distinction matters and is the component's central design decision: a consumer must be able to
 * treat a timeout differently from a dismissal. A timed-out message is often still worth reading, and
 * an app that re-opens the snackbar on its own dismissal but not on a timeout gets the behaviour right
 * by accident — or, more often, gets it wrong in a way that is very hard to see.
 */
export type SnackbarCloseReason = "timeout" | "dismiss" | "escape";

export interface SnackbarOwnProps {
  /** The message. The only required prop. */
  children?: ReactNode | undefined;

  /**
   * Controlled open state. `undefined` means uncontrolled; see `useControllableState`.
   */
  open?: boolean | undefined;

  /** Initial state when uncontrolled. */
  defaultOpen?: boolean | undefined;

  /**
   * Called when the snackbar asks to close.
   *
   * Reports a reason and never closes itself when `open` is controlled — the consumer decides, exactly
   * as with `Dialog`. In uncontrolled mode the snackbar does close itself, and still calls this.
   */
  onClose?: ((reason: SnackbarCloseReason) => void) | undefined;

  /**
   * Why the snackbar closed, so the consumer can distinguish the cases.
   *
   * `timeout` is the timer expiring, `dismiss` is the close control or a click outside, and `escape`
   * is the key. Without this a consumer has to guess, and the three want different responses.
   */
  onDismiss?: ((reason: SnackbarCloseReason) => void) | undefined;

  /**
   * Milliseconds before the snackbar asks to close itself.
   *
   * `null` never closes on a timer, which is the right setting for anything the user must act on.
   *
   * The floor is 5000ms, whatever is passed. A shorter timer is a message that disappears while it is
   * being read, or while focus is inside it — and the second case is worse than the first, because a
   * focused element vanishing from the tab order takes the user's place with it.
   *
   * @default 7000
   */
  duration?: number | null | undefined;

  /**
   * Where it sits.
   *
   * @default "bottom-end"
   *
   * Logical rather than physical, so `bottom-end` is the bottom of the reading direction's trailing
   * edge and mirrors in RTL without a second prop.
   */
  placement?:
    | "top-start"
    | "top-center"
    | "top-end"
    | "bottom-start"
    | "bottom-center"
    | "bottom-end"
    | undefined;

  /**
   * Advisory intent.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Whether a close control is shown.
   *
   * @default true
   *
   * On by default even with a timer, because the timer and the control are different affordances: one
   * says "this will go away", the other says "I have read it".
   */
  showClose?: boolean | undefined;

  /**
   * Announced name for the close control.
   *
   * @default "Close"
   */
  closeLabel?: string | undefined;

  /**
   * Whether clicking outside dismisses it.
   *
   * @default false
   *
   * Off by default, and deliberately. Dismiss-on-click-away is a convenience on a message with no
   * controls and a hazard on one with them: a stray click on a message carrying a button throws away
   * something the user was reaching for. There is a close control for the case where dismissing is
   * wanted.
   */
  dismissOnClickOutside?: boolean | undefined;

  /**
   * Whether the timer pauses while the pointer is over it or focus is inside it.
   *
   * @default true
   *
   * On by default, and this is the single most important behaviour in the component. A timer that
   * keeps running while the user is reading the message, or has tabbed into its action, removes the
   * thing they were interacting with.
   */
  pauseOnHover?: boolean | undefined;

  /**
   * Whether the message is announced.
   *
   * @default "polite"
   *
   * A live region, because a message that appears and is not announced is a message nobody receives.
   * `assertive` interrupts whatever is being read and is wrong for anything but an error the user
   * must know about now.
   */
  live?: "off" | "polite" | "assertive" | undefined;

  /** An action, rendered after the message. Kept short: "Undo", "Retry", "View". */
  action?: ReactNode | undefined;

  /**
   * Leading adornment.
   *
   * Rendered as a tone glyph when `action` is absent, and suppressed when `tone` is `neutral` — an
   * information mark beside text that says nothing is decoration.
   */
  icon?: ReactNode | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the root.
   *
   * The root is the live region, so a consumer who needs to move focus to the snackbar's action has
   * to be able to reach it. The action itself is the consumer's own element and needs no forwarding.
   */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type SnackbarProps = SnackbarOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof SnackbarOwnProps | "children">;
