/**
 * Skeleton prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

/** What the skeleton is standing in for. */
export type SkeletonVariant = "text" | "rounded" | "circular";

export interface SkeletonOwnProps {
  /**
   * Shape.
   *
   * @default "text"
   *
   * `text` is a single line of prose, `rounded` a block, `circular` a dot. A skeleton shaped like
   * what it replaces is the entire point: a page that jumps when the content arrives is a page that
   * reflows under the reader.
   */
  variant?: SkeletonVariant | undefined;

  /**
   * How many lines.
   *
   * @default 1
   *
   * Only meaningful for `variant="text"`, and the only thing that is worth parameterising: one line
   * does not stand in for a paragraph, and a skeleton whose height does not match the content it
   * replaces is a layout shift waiting to happen.
   */
  lines?: number | undefined;

  /**
   * Width.
   *
   * A CSS length or a percentage. `100%` fills the container; anything less reads as the last line of
   * a paragraph, which is why `text` defaults to less than full width.
   */
  width?: number | string | undefined;

  /**
   * Height, for the non-text variants.
   */
  height?: number | string | undefined;

  /**
   * Whether the shimmer moves.
   *
   * @default true
   *
   * `prefers-reduced-motion` turns it off regardless, in CSS. It is a prop because a skeleton that is
   * on screen for four seconds as several rows is a distraction with no information in it.
   *
   * The same exception the loading indicator in `button.css` makes, and for the same reason: a stopped
   * skeleton still reads as loading — that is what the shape is for — so the animation is made slower
   * rather than removed. See `docs/accessibility.md` rule 7.
   */
  animate?: boolean | undefined;

  /**
   * Announced description of what is loading.
   *
   * @default "Loading"
   *
   * `aria-label` on a `role="status"` region. The skeleton itself is `aria-hidden`, because a screen
   * reader announcing a grey rectangle says nothing.
   */
  label?: string | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the root.
   *
   * Named `ref` because it is the element a consumer measures — a skeleton whose box is not the box
   * the content will occupy is not doing its job.
   */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type SkeletonProps = SkeletonOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof SkeletonOwnProps | "children">;

/**
 * A row of skeletons with the heights of a list.
 *
 * Not a prop of `Skeleton`. `lines` covers the one case that is genuinely a variant — a paragraph — and
 * a `SkeletonGroup` would be a component whose only job is to map an array to `lines`, which is a
 * `.map` in the consumer's own code.
 */
export type SkeletonRow = {
  /** Row width. Defaults to full width. */
  width?: number | string | undefined;
  /** Row height. Defaults to one text line. */
  height?: number | string | undefined;
};

export type SkeletonChildren = ReactNode | undefined;
