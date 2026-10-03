/**
 * Pagination prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, Ref } from "react";
import type { Size } from "../../foundations";

export interface PaginationOwnProps {
  /**
   * Zero-based index of the current page.
   */
  page?: number | undefined;

  /**
   * Total number of pages.
   *
   * Required, because a pagination control with no total is not a pagination control — it is a "next"
   * button with page numbers around it, and there is nothing to tell the user how much of the content
   * they are looking at.
   *
   * A total of `0` or `1` renders nothing: a single page has no pagination, and drawing one anyway is
   * how a control ends up taking space it has nothing to say with.
   */
  pageCount: number;

  /**
   * Called with the new zero-based index.
   *
   * Not called when the requested page is the current one, or out of range. A control that reports a
   * change it did not make is a control a consumer has to defensively filter.
   */
  onPageChange?: ((page: number) => void) | undefined;

  /**
   * Which page numbers to show.
   *
   * `auto` is the default and shows a window around the current page with first and last always
   * present, so the ends of the collection are one click away. `all` shows every page, which is right
   * for a short list and wrong past about twenty.
   */
  siblingCount?: "auto" | "all" | 1 | 2 | 3 | undefined;

  /**
   * Whether to show first / previous / next / last controls.
   *
   * @default true
   */
  showEdges?: boolean | undefined;

  /**
   * How the current position is announced.
   *
   * @default true
   *
   * A `role="status"` region reading "Page 3 of 12". Without it a screen reader user pressing a page
   * number has no idea whether anything changed — the pressed state moves and the content loads, and
   * neither is announced.
   */
  announcePosition?: boolean | undefined;

  /**
   * Announced noun for the page.
   *
   * @default "Page"
   */
  pageLabel?: string | undefined;

  /**
   * Announced name for the previous-page control.
   *
   * @default "Previous page"
   */
  previousLabel?: string | undefined;

  /**
   * Announced name for the next-page control.
   *
   * @default "Next page"
   */
  nextLabel?: string | undefined;

  /**
   * Announced name for the first-page control.
   *
   * @default "First page"
   */
  firstLabel?: string | undefined;

  /**
   * Announced name for the last-page control.
   *
   * @default "Last page"
   */
  lastLabel?: string | undefined;

  /** Size, shared with the rest of the library. @default "md" */
  size?: Size | undefined;

  /** Not actionable. */
  disabled?: boolean | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the `<nav>`. */
  ref?: Ref<HTMLElement> | undefined;
}

export type PaginationProps = PaginationOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof PaginationOwnProps | "children" | "onChange">;
