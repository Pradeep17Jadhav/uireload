/**
 * Tooltip prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

/**
 * Where the tooltip sits relative to its trigger.
 *
 * The four are the ones that work on every trigger geometry. `left` / `right` are reachable by
 * flipping `side` on a `vertical` placement, so eight enum values would be four.
 */
export type TooltipPlacement = "top" | "bottom" | "inline-start" | "inline-end";

export interface TooltipOwnProps {
  /** The tooltip text. */
  children?: ReactNode | undefined;

  /**
   * The element the tooltip describes.
   *
   * Wrapped in a `<span>` with `tabIndex={0}`, because a tooltip must be reachable by keyboard and a
   * `<span>` around a non-focusable element is the only way to make a non-focusable element
   * focusable without changing it.
   *
   * A tooltip on a control that is *already* focusable adds nothing — the control's own accessible
   * name should carry the text — and the extra tab stop is a real cost. See the README.
   */
  label?: ReactNode | undefined;

  /**
   * Where the tooltip sits.
   *
   * @default "top"
   *
   * `inline-start` and `inline-end` rather than `left` / `right`, so the tooltip appears on the
   * reading direction's leading or trailing edge and mirrors in RTL without a second prop.
   */
  placement?: TooltipPlacement | undefined;

  /**
   * Gap between the trigger and the tooltip.
   *
   * In pixels. A tooltip with no gap looks like it is part of the thing it describes, which defeats
   * the whole point of it being a separate object.
   */
  offset?: number | undefined;

  /**
   * How long the pointer must rest before the tooltip appears.
   *
   * @default 400
   *
   * Not zero, and that is the component's most consequential default. A tooltip that appears on hover
   * with no delay fires on every pass of the pointer across a toolbar, which is how a tooltip starts
   * feeling like an attack.
   */
  delay?: number | undefined;

  /**
   * How long the tooltip stays after the pointer leaves.
   *
   * @default 200
   *
   * A grace period, and it is what makes the tooltip usable: moving the pointer onto the tooltip
   * itself — to read it, or to select its text — must not dismiss it.
   */
  hideDelay?: number | undefined;

  /**
   * Whether the tooltip is shown at all.
   *
   * @default false
   */
  open?: boolean | undefined;

  /**
   * Called when the tooltip would open or close, with the next state.
   *
   * Lets a consumer drive it: a tooltip whose text depends on data it has not fetched yet, or one that
   * should not appear on touch at all.
   */
  onOpenChange?: ((open: boolean) => void) | undefined;

  /**
   * How the tooltip reaches assistive technology.
   *
   * @default "tooltip"
   *
   * `tooltip` uses `aria-describedby`, which is correct when the tooltip *supplements* a control's own
   * name. `label` is for the case where the tooltip **is** the name — an icon button with no other
   * text — and uses `aria-label` instead, because a described-by does not replace a missing name.
   *
   * `aria-label` is applied only when `label` is a **string**. A `ReactNode` has no string form and
   * `String(node)` is `"[object Object]"`, which is a worse name than none; supply `aria-label`
   * yourself in that case.
   */
  describe?: "tooltip" | "label" | undefined;

  /** Merged onto the wrapper, never onto the surface. */
  className?: string | undefined;

  /** Inline styles for the wrapper. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the wrapper. */
  ref?: Ref<HTMLSpanElement> | undefined;
}

export type TooltipProps = TooltipOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, keyof TooltipOwnProps | "children">;
