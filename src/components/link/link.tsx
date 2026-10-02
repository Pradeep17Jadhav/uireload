/**
 * Link.
 *
 * A real `<a>`. Everything a link is — the role, the focus stop, Enter and Space activation, the
 * context menu, the middle-click, the open-in-new-tab, the announced destination — is the platform's,
 * and none of it is reimplemented.
 *
 * The component's own work is the small set of decisions a design system has to make anyway: how
 * loud a link looks, whether it is underlined when at rest, and whether it says that it opens
 * somewhere new.
 */

import { useEffect } from "react";
import { cx } from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./link.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { LinkProps } from "./link.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

export function Link(props: LinkProps) {
  const {
    children,
    href,
    target,
    rel,
    underline = "inline",
    tone = "accent",
    size = "md",
    external = false,
    endIcon,
    disabled = false,
    className,
    style,
    ref,
    onClick,
    ...rest
  } = props;

  /*
   * A development warning for the one case where the library cannot help and the consumer must know
   * about.
   *
   * `target="_blank"` without `rel="noopener"` gives the opened page a handle on this one, via
   * `window.opener`. `rel="noopener"` is a correctness fix and adding it silently would be a decision
   * made for the consumer; `rel="noreferrer"` additionally strips the referrer, which some analytics
   * depend on. So it is named rather than chosen.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (target !== "_blank") return;
    if (rel?.includes("noopener") === true || rel?.includes("noreferrer") === true) return;

    console.warn(
      'Link: `target="_blank"` with no `rel` containing `noopener` or `noreferrer`. ' +
        "The opened page gets a handle on this one through `window.opener`. Add " +
        '`rel="noopener"` if that matters; it is not defaulted here because `noreferrer` ' +
        "also strips the referrer, which is not this component's decision to make."
    );
  }, [rel, target]);

  /*
   * A disabled link.
   *
   * `<a>` has no `disabled` attribute, and the two ways to fake one both cost something:
   *
   * - Removing `href` stops navigation — and the platform gives an `<a>` with no `href` **no tab stop
   *   either**. The link leaves the tab order entirely, so a keyboard user cannot reach it and cannot
   *   discover that it exists.
   * - Keeping `href` keeps it focusable and activable, and the click has to be stopped with
   *   `preventDefault()`.
   *
   * The second is used: the `href` stays, `aria-disabled` says it is unavailable, and our own handler
   * prevents the navigation. A control that vanishes from the tab order when it becomes unavailable is a
   * control that stops being in the page, and the whole point of `aria-disabled` is that the user can
   * reach it and be told it does nothing.
   *
   * The consumer's `onClick` still runs — it is called *after* `preventDefault`, not suppressed. A
   * handler that vanishes for a disabled control is a handler whose absence nobody notices until they
   * look for it in a log; this way the click is recorded and simply does not navigate.
   */
  const handleClick = disabled
    ? (event: React.MouseEvent<HTMLAnchorElement>): void => {
        event.preventDefault();
        onClick?.(event);
      }
    : onClick;

  return (
    <a
      {...rest}
      ref={ref}
      href={href}
      /*
       * Applied explicitly rather than left to `{...rest}`.
       *
       * `target` and `rel` are destructured because the development warning above reads them, and a
       * destructured prop that is not re-applied is silently swallowed — the link renders, looks
       * right, and opens in the same tab whatever the consumer asked for.
       */
      target={target}
      rel={rel}
      onClick={handleClick}
      className={cx("uir-link", className)}
      style={style}
      data-underline={underline}
      data-tone={tone}
      data-size={size}
      data-external={external ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      aria-disabled={disabled || undefined}
      /*
       * The rendered element is always an `<a>`, even with no `href`, so the CSS contract does not
       * change shape based on props. With no `href` the platform gives it no role, which is the
       * point: a not-yet-routed link must not be announced as a link.
       */
    >
      {children}

      {isRenderable(endIcon) ? (
        <span className="uir-link__end-icon" aria-hidden="true">
          {endIcon}
        </span>
      ) : null}

      {/*
        The external marker.
        *
        * A CSS-drawn arrow rather than a glyph, so there is nothing to import. Its absence is the
        * signal, so it is drawn from borders and rotated — a shape that reads as "leaves this page"
        * without needing a font to have it.
        */}
      {external ? <span className="uir-link__external" aria-hidden="true" /> : null}
    </a>
  );
}
