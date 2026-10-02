/**
 * Popover prop types.
 *
 * The reasoning behind each choice is in `README.md`.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { FocusTarget } from "../../types";
import type { Tone } from "../../foundations";

/**
 * Which side of the anchor the popover sits on.
 *
 * The four-value placement enum
 * (`Start`, `End`, `Top`,
 * `Bottom`), renamed to the library's logical vocabulary. `Start` and `End` are what
 * `Left` and `Right` are in LTR and the reverse in RTL, so a placement expressed as a
 * logical direction needs no mirroring anywhere else in the library.
 *
 * That is a real improvement rather than a rename: an anchor-relative enum has to ship a
 * `getRTLCorrectionLeft()` method and an `isRtl` getter to patch up the physical case.
 */
export type PopoverPlacement = "top" | "bottom" | "start" | "end";

/**
 * How the popover aligns to the anchor along the cross axis.
 *
 * A comparable design splits this into two separate enums, one per axis, which
 * `PopoverHorizontalAlign` (`.../types/PopoverVerticalAlign.d.ts`,
 * `.../types/PopoverHorizontalAlign.d.ts`), each of which offers `Center`, `Start`, `End`
 * and `Stretch`. That is two props where one suffices, and the cross axis is already
 * determined by the placement, so the useful values here are `center` and `stretch`.
 *
 * `start` and `end` are rejected: the cross axis is implied by the placement, so
 * `placement="bottom" align="end"` is the same request as `placement="bottom"`, and
 * accepting both would let them disagree.
 */
export type PopoverAlign = "center" | "stretch";

/**
 * Why the popover closed.
 *
 * A before-close event often carries `{ escPressed: boolean }`, and
 * (`PopupBeforeCloseEventDetail` in `Popup.d.ts`), and `closePopup(escPressed)` is a public
 * method. Both libraries' reason for distinguishing is the same: a consumer whose popover
 * holds unsaved input has to treat Escape differently from a click outside, and cannot
 * tell them apart from a single boolean `onClose`.
 */
export type PopoverCloseReason = "escape" | "outside-press";

export interface PopoverOwnProps {
  /**
   * Controlled open state. `undefined` means uncontrolled; see `useControllableState`.
   *
   * When closed, nothing is rendered at all — not a hidden surface, not an empty portal.
   * An `inert` or `display: none` popover is still a node in the accessibility tree in some
   * assistive technology, and a stale `aria-expanded` on the anchor is a bug the consumer
   * then has to remember to fix.
   */
  open?: boolean | undefined;

  /** Initial state when uncontrolled. */
  defaultOpen?: boolean | undefined;

  /** Called whenever the component intends to change `open`. */
  onOpenChange?: ((open: boolean) => void) | undefined;

  /**
   * The target the popover is positioned against.
   *
   * Accepts a ref, a node, a thunk, or a bare rect (see {@link PopoverVirtualAnchor}).
   *
   * The thunk form is what a consumer needs for an anchor that is not mounted yet, and it is
   * resolved at layout time rather than during render, which is what keeps this SSR safe.
   *
   * The rect form is a "virtual element": a caret, a chart point or a map pin has no
   * DOM node of its own, and a popover anchored to one should not need a hidden `<span>` to
   * give it a box.
   *
   * May be null while the anchor is not mounted, in which case the popover renders centred in
   * the viewport rather than at 0,0 — an unpositioned popover in the corner is a far worse
   * failure than a centred one.
   */
  anchor: FocusTarget | PopoverVirtualAnchor | null;

  /**
   * Which side of the anchor to sit on.
   *
   * `bottom` — below the anchor, which is what a dropdown wants — is the default rather
   * than `end`, because a popover with no stated placement is nearly always a menu
   * dropping downwards, and `end` means "right" in LTR, which is a surprise.
   *
   * @default "bottom"
   */
  placement?: PopoverPlacement | undefined;

  /**
   * Alignment along the cross axis.
   *
   * @default "center"
   */
  align?: PopoverAlign | undefined;

  /**
   * Gap between the anchor and the popover, in pixels.
   *
   * Measured from the anchor's edge to the popover's edge, so a value also offsets the
   * arrow when one is drawn.
   *
   * @default 8
   */
  offset?: number | undefined;

  /**
   * Space to keep between the popover and the viewport edge.
   *
   * When the preferred placement does not fit, the component falls back to the opposite
   * side; only when that does not fit either does it shift along the cross axis. This is
   * the same rule applies with a viewport margin and
   * `shouldCloseDueToOverflow`.
   *
   * @default 8
   */
  viewportPadding?: number | undefined;

  /**
   * Draws the surface as a blocking, focus-trapping modal.
   *
   * A modal popover takes focus on open, traps `Tab` inside itself, blocks scroll on the
   * page, and closes on Escape. A non-modal one leaves focus where it was and lets `Tab`
   * continue past the popover, which is what a dropdown list needs.
   *
   * @default false
   */
  modal?: boolean | undefined;

  /**
   * Closes when the user clicks or presses outside, or scrolls the page.
   *
   * @default true
   */
  closeOnOutsidePress?: boolean | undefined;

  /**
   * Closes on Escape.
   *
   * @default true
   */
  closeOnEscape?: boolean | undefined;

  /**
   * Closes when the anchor scrolls out of view.
   *
   * The opener is watched with an `IntersectionObserver` and the surface closes when it is no longer
   * visible (`_onOpenerIntersection` in `Popover.d.ts`). A popover pinned to an anchor that
   * has scrolled away is a surface floating over unrelated content.
   *
   * @default true
   */
  closeOnAnchorOutOfView?: boolean | undefined;

  /**
   * Moves focus into the popover when it opens.
   *
   * Only meaningful when `modal`: a non-modal popover must not steal focus, because the
   * user is still working in the page around it.
   *
   * @default true
   */
  autoFocus?: boolean | undefined;

  /**
   * Returns focus to the anchor when it closes.
   *
   * The one case where restoring focus is wrong is a popover that is being closed *because*
   * its anchor was removed, so set this to `false` when the consumer takes over focus.
   *
   * @default true
   */
  restoreFocus?: boolean | undefined;

  /**
   * Accessible name, applied as `aria-label` when `aria-labelledby` is not given.
   *
   * A popover with no name is announced as "dialog" and nothing else, which is not enough
   * to tell a user what opened. `dialog`'s `title` covers the common case by giving the
   * surface a visible heading and pointing `aria-labelledby` at it.
   */
  label?: string | undefined;

  /**
   * Intent of the surface's border and ring.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Optional heading rendered at the top of the surface, and the element
   * `aria-labelledby` points at automatically.
   *
   * Prefer this over `label` whenever the popover has a heading worth showing, because a
   * visible heading is a name a sighted user gets too. When both are absent, a development
   * warning says so.
   */
  title?: ReactNode | undefined;

  /**
   * Rendered at the end of the surface, in a footer row.
   *
   * A surface can carry a header and a footer without either being mandatory.
   */
  header?: ReactNode | undefined;

  /** Rendered at the end of the surface, in a footer row. */
  footer?: ReactNode | undefined;

  /**
   * Draws a small triangle pointing at the anchor.
   *
   * A visual affordance only; it is `aria-hidden` and carries no meaning a screen reader
   * needs.
   */
  arrow?: boolean | undefined;

  /** Rendered inside the surface. */
  children?: ReactNode | undefined;

  /** Merged onto the surface element. */
  className?: string | undefined;

  /** Inline styles for the surface element. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Called when the popover closes, with why.
   *
   * Always fires, controlled or not, because it reports an *event* rather than a state
   * transition. Use `onOpenChange` to veto a close.
   */
  onClose?: ((reason: PopoverCloseReason) => void) | undefined;

  /**
   * Forwarded to the surface element.
   *
   * The surface is the element the popover is, so `role`, `aria-label` and `className` all
   * belong there rather than on a wrapper. The wrapper exists only to position it.
   */
  ref?: Ref<HTMLDivElement> | undefined;
}

/**
 * A rectangle a popover can be positioned against, for anchoring to something that is not
 * an element.
 *
 * The same shape a comparable library calls a `PopoverVirtualElement`: a bare
 * `{ getBoundingClientRect }` and nothing more, so a consumer can pass any object that
 * reports a rect.
 */
export interface PopoverVirtualAnchor {
  getBoundingClientRect: () => DOMRect;
}

export type PopoverProps = PopoverOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof PopoverOwnProps>;
