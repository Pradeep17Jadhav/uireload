/**
 * Tile prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

export interface TileOwnProps {
  /** What to render inside the tile. */
  children?: ReactNode | undefined;

  /**
   * How far the tile stands off the page.
   *
   * - `flat` — a border and no shadow. The default, because elevation is the most expensive visual
   *   decision in a design system: a page of raised cards reads as a page of popups.
   * - `raised` — a border *and* a shadow. For a tile that is meant to read as a distinct object.
   * - `floating` — a larger shadow and no border. For the one or two things on a page that genuinely
   *   float above it.
   *
   * @default "flat"
   */
  elevation?: "flat" | "raised" | "floating" | undefined;

  /**
   * Whether the whole tile is activatable.
   *
   * When true the tile renders as a `<button>` — or an `<a>`, if `href` is given — and the whole
   * surface is the target. It is one tab stop, not one per child, because a button containing buttons
   * is invalid HTML.
   *
   * @default false
   */
  interactive?: boolean | undefined;

  /**
   * Where the tile leads, when `interactive`.
   *
   * Implies `interactive` if `interactive` is not set, because a link-shaped tile that is not
   * activatable is a link with no link behaviour.
   */
  href?: string | undefined;

  /**
   * Where the tile opens. Only with `href`.
   */
  target?: string | undefined;

  /** The `rel` attribute. Only with `href`; never defaulted. */
  rel?: string | undefined;

  /**
   * Header, above the body.
   *
   * Rendered inside the tile rather than as a prop of its own, so a consumer can put anything there —
   * a heading, a `Chip`, a row of actions — without the tile having to model each of them.
   */
  header?: ReactNode | undefined;

  /**
   * Footer, below the body.
   *
   * A sibling of `header` rather than a "media" slot, because the interesting case is a row of actions
   * and a design system has no business deciding what they are.
   */
  footer?: ReactNode | undefined;

  /**
   * Advisory intent of the leading edge.
   *
   * A bar down the block-start edge rather than a coloured fill, because a tinted background on a
   * large surface is the fastest way to make a page unreadable, and the edge is where a status is
   * scanned for.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Density of the padding.
   *
   * @default "md"
   */
  padding?: "none" | "sm" | "md" | "lg" | undefined;

  /**
   * Whether the body scrolls internally rather than growing.
   *
   * `maxHeight` is a prop because a scroll container with no bound is not a scroll container, and a
   * consumer who has to reach into CSS to set one has lost the ability to do it conditionally.
   */
  maxHeight?: number | string | undefined;

  /**
   * Skeleton state.
   *
   * Marks the tile as loading, hides its contents from assistive technology, and lets the CSS draw a
   * placeholder. `aria-busy` rather than a live region: the tile's arrival is what a consumer
   * announces, and a region inside every loading tile is a screen reader talking over itself.
   */
  loading?: boolean | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the interactive element when there is one, and to the root otherwise.
   *
   * `Ref<HTMLElement>` because `interactive` decides the element, and a narrower ref would make the
   * interactive variants untypeable.
   */
  ref?: Ref<HTMLElement> | undefined;

  /**
   * Which element to render when the tile is not interactive.
   *
   * A `<div>` by default; `<article>` for a tile in a list of independent items, `<li>` inside a
   * `<ul>` of tiles. Not needed at all when `interactive`, which decides the element itself.
   */
  as?: ElementType | undefined;
}

export type TileProps = TileOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof TileOwnProps | "children">;
