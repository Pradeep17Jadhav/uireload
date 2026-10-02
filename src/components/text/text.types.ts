/**
 * Text prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from "react";

/**
 * The type scale.
 *
 * `body` is not a heading level and is the default, because most text on a page is prose. The six
 * heading levels each render the element of the same name.
 */
export type TextVariant = "body" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Semantic colour.
 *
 * `inherit` is the default and is deliberate: text that names its own colour is text that has decided
 * something about contrast it cannot see. A component whose default is a specific colour imposes that
 * decision on every call site.
 */
export type TextTone = "inherit" | "default" | "muted" | "subtle";

export interface TextOwnProps {
  /** What to render. */
  children?: ReactNode | undefined;

  /**
   * The type scale, and for a heading the document rank.
   *
   * `h1` renders an `<h1>`. The visual size and the outline a screen reader can navigate are the same
   * fact, so they cannot drift apart — which is exactly the failure a `<div>` with a large font
   * produces.
   *
   * `body` renders a `<p>`.
   *
   * @default "body"
   */
  variant?: TextVariant | undefined;

  /**
   * Semantic colour.
   *
   * @default "inherit"
   */
  tone?: TextTone | undefined;

  /**
   * Which element to render, when the variant's own element is wrong.
   *
   * The escape hatch for the real cases: a `<div>` for a heading inside a `summary` or `legend`, an
   * `<h1>` with a different visual level for a page whose outline does not match the design, a
   * `<span>` for text inside a heading. It changes the element without changing the styling, so
   * `variant` and `as` are genuinely independent axes.
   *
   * Reach for it only when the automatic element is wrong. A component that always required `as`
   * would have two sources of truth for one fact — the same reasoning that keeps `thumbs` off `Slider`
   * and `intent` off nothing.
   */
  as?: ElementType | undefined;

  /**
   * Line alignment.
   *
   * @default "start"
   *
   * `start` / `end` rather than `left` / `right`, so text aligns to the reading direction rather than
   * to the physical edge. A left-aligned RTL paragraph is not aligned with anything.
   */
  align?: "start" | "center" | "end" | "justify" | undefined;

  /**
   * Truncate with an ellipsis on one line.
   *
   * Opt-in, because truncation loses content and there is no way for a screen reader to know how much
   * was lost — so it needs to be a decision rather than a default. `title` on the element is not set
   * for you; see the README.
   */
  noWrap?: boolean | undefined;

  /**
   * Space below, for when the element is not in a flow that already spaces it.
   *
   * @default false
   */
  gutterBottom?: boolean | undefined;

  /**
   * Cap the measure.
   *
   * Measured in characters, not pixels: the readability of a line is a function of how many
   * characters it holds, and a pixel cap means a different measure at every font size and in every
   * language. `65ch` is the usual comfortable maximum for body text.
   */
  measure?: "none" | "short" | "long" | undefined;

  /**
   * Overline.
   *
   * Small, spaced, uppercased — the label above a heading or a field group.
   */
  overline?: boolean | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the rendered element, whatever it is.
   *
   * `Ref<HTMLElement>` rather than a narrower type because `as` decides the element; a narrower ref
   * would make the escape hatch untypeable.
   */
  ref?: Ref<HTMLElement> | undefined;
}

export type TextProps = TextOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof TextOwnProps | "children" | "color">;
