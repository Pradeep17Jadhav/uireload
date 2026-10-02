/**
 * Tile.
 *
 * A surface that groups related content. A `<div>` when it is only a surface, a `<button>` or an
 * `<a>` when it is activatable — because "the whole card is clickable" is a real interaction and the
 * only correct way to express it is with the element that means it.
 */

import { forwardRef } from "react";
import { cx } from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./tile.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { TileProps } from "./tile.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

export const Tile = forwardRef<HTMLElement, TileProps>(function Tile(props, ref) {
  const {
    children,
    elevation = "flat",
    interactive: interactiveProp,
    href,
    target,
    rel,
    header,
    footer,
    tone = "neutral",
    padding = "md",
    maxHeight,
    loading = false,
    className,
    style,
    as,
    onClick,
    ...rest
  } = props;

  /*
   * `href` implies interactive.
   *
   * A link-shaped tile that is not activatable is a link with no link behaviour: it looks like a
   * destination, takes no pointer, and is not in the tab order. Inferring rather than requiring both
   * props removes the state a consumer can get wrong.
   */
  const interactive = interactiveProp ?? href !== undefined;

  const data = {
    "data-elevation": elevation,
    "data-tone": tone,
    "data-padding": padding,
    "data-interactive": interactive ? "" : undefined,
    "data-link": href !== undefined ? "" : undefined,
    "data-loading": loading ? "" : undefined,
    "data-has-header": isRenderable(header) ? "" : undefined,
    "data-has-footer": isRenderable(footer) ? "" : undefined,
  };

  /*
   * The bound for an internally-scrolling body, resolved once.
   *
   * A prop rather than a CSS custom property because the consumer has to be able to set it
   * conditionally — a tile that scrolls at 320px and does not at 480px is a real case, and a token
   * cannot express it.
   *
   * `max-block-size` rather than `max-height`, so a consumer writing in a vertical-rtl script gets the
   * bound in the right physical direction.
   */
  const rootStyle =
    maxHeight === undefined
      ? style
      : { ...style, maxBlockSize: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight };

  const body = (
    <>
      {isRenderable(header) ? (
        <div className="uir-tile__header" data-uir-part="header">
          {header}
        </div>
      ) : null}

      {/*
        The body.
        *
        `aria-hidden` while loading, and the reason is the skeleton rather than the busy flag: the
        placeholder is what a sighted user sees, and a screen reader should not read out text the user
        cannot see is stale. `aria-busy` on the root says the region is loading.
        */}
      <div className="uir-tile__body" data-uir-part="body" aria-hidden={loading || undefined}>
        {children}
      </div>

      {isRenderable(footer) ? (
        <div className="uir-tile__footer" data-uir-part="footer">
          {footer}
        </div>
      ) : null}
    </>
  );

  /*
   * A link tile.
   *
   * An `<a>`, so the destination is announced, the context menu works, and the middle-click opens a
   * new tab — none of which a `<button>` with a click handler can do.
   */
  if (href !== undefined) {
    return (
      <a
        {...rest}
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={loading ? undefined : href}
        target={target}
        rel={rel}
        className={cx("uir-tile", className)}
        style={rootStyle}
        {...data}
        aria-busy={loading || undefined}
        onClick={onClick}
      >
        {body}
      </a>
    );
  }

  /*
   * A button tile.
   *
   * `type="button"` is not optional: a tile inside a form that defaulted to `submit` would submit it.
   *
   * The consumer's `onClick` is passed through rather than composed. There is no internal click
   * behaviour to compose with — it is a `<button>` and the browser already does everything a button
   * does — so composing would call the handler twice.
   */
  if (interactive) {
    return (
      <button
        {...rest}
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={cx("uir-tile", className)}
        style={rootStyle}
        {...data}
        aria-busy={loading || undefined}
        disabled={loading}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  /*
   * A plain tile.
   *
   * A `<div>` by default. `aria-busy` and not a live region: the tile's *arrival* is what a consumer
   * announces, and a live region inside every loading tile is a screen reader talking over itself.
   */
  const Element = as ?? "div";

  return (
    <Element
      {...rest}
      ref={ref}
      className={cx("uir-tile", className)}
      style={rootStyle}
      {...data}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {body}
    </Element>
  );
});
