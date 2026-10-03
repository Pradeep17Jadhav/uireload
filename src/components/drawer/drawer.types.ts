/**
 * Drawer prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

export interface DrawerOwnProps {
  /** The drawer's content. */
  children?: ReactNode | undefined;

  /**
   * Controlled open state. `undefined` means uncontrolled; see `useControllableState`.
   */
  open?: boolean | undefined;

  /**
   * Initial state when uncontrolled.
   *
   * Present for the same reason as on every other component with an open state: an uncontrolled
   * drawer that can only be opened by passing `open` is not uncontrolled at all.
   */
  defaultOpen?: boolean | undefined;

  /**
   * Called when the drawer asks to close.
   *
   * Reports a reason, like `Dialog`: a user dismissing it and a consumer resetting it are different
   * facts and a consumer that cannot tell them apart will undo its own navigation.
   */
  onClose?: ((reason: DrawerCloseReason) => void) | undefined;

  /**
   * Why the drawer is asking to close.
   *
   * `escape` is the key, `dismiss` the close button or a click on the backdrop, and `programmatic` a
   * consumer closing it from outside.
   */
  onDismiss?: ((reason: DrawerCloseReason) => void) | undefined;

  /**
   * Which edge the drawer slides in from.
   *
   * @default "inline-start"
   *
   * Logical rather than `left` / `right`: a navigation drawer belongs on the side the reading direction
   * starts from, which is `inline-start` in both scripts without a second prop.
   */
  placement?: "inline-start" | "inline-end" | "block-start" | "block-end" | undefined;

  /**
   * Whether the page beside the drawer stays usable.
   *
   * @default false
   *
   * False by default: `modal` is a focus trap and a scroll lock, and both are a real cost to impose
   * on a page. A navigation drawer that traps focus is worse than one that does not, because the user
   * cannot reach the thing they opened the drawer to change.
   *
   * True for the case that genuinely needs it — a destructive confirmation panel, or a filter panel
   * that must be finished with before anything else happens.
   */
  modal?: boolean | undefined;

  /**
   * Width or height, as a CSS length.
   *
   * A prop rather than a token because the right value depends entirely on content: a navigation
   * drawer is 16rem, a filter panel is `min(28rem, 100vw)`, and a token cannot be right for both.
   */
  size?: string | undefined;

  /** Visible heading, rendered as a real `<h2>`. */
  title?: ReactNode | undefined;

  /**
   * Whether a dismiss control is shown in the header.
   *
   * @default true
   */
  showClose?: boolean | undefined;

  /**
   * Announced name for the dismiss control.
   *
   * @default "Close"
   */
  closeLabel?: string | undefined;

  /** Content pinned to the block-start edge, above the body. */
  header?: ReactNode | undefined;

  /** Content pinned to the block-end edge, below the body. */
  footer?: ReactNode | undefined;

  /**
   * Whether clicking the backdrop dismisses.
   *
   * @default true
   *
   * Only when `modal`. A non-modal drawer has no backdrop to click, so the prop is inert without one —
   * and inert props are recorded rather than silently accepted.
   */
  dismissOnBackdropClick?: boolean | undefined;

  /** Not actionable as a whole. */
  disabled?: boolean | undefined;

  /**
   * Which element receives focus when the drawer opens.
   *
   * @default "first"
   *
   * `first` is the first focusable thing inside, or the drawer itself if there is none — a drawer
   * whose first focusable element is the close control is correct, and one that focuses the backdrop
   * is not.
   */
  initialFocus?: "first" | "container" | "none" | undefined;

  /** Merged onto the panel, never onto the backdrop. */
  className?: string | undefined;

  /** Inline styles for the panel. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the panel. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type DrawerCloseReason = "escape" | "dismiss" | "programmatic";

export type DrawerProps = DrawerOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof DrawerOwnProps | "children">;
