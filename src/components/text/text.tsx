/**
 * Text.
 *
 * The type scale: body prose and six heading levels. A heading variant renders the heading element of
 * the same name, so the visual hierarchy and the document outline are one fact rather than two that
 * can disagree.
 */

import { forwardRef } from "react";
import { cx } from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./text.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { TextProps, TextVariant } from "./text.types";

/**
 * The element each variant renders.
 *
 * A `<p>` for body and the matching heading element for each level. The mapping is the component:
 * there is no path by which a visual level and a heading rank can come apart, because there is only
 * one prop that chooses them.
 */
const ELEMENTS: Record<TextVariant, "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"> = {
  body: "p",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
};

/**
 * Body text and headings.
 *
 * ```html
 * <h2 class="uir-text" data-variant="h2" data-tone="default" data-align="start">…</h2>
 * ```
 *
 * There is one element, not a wrapper around the caller's children. A wrapper would add a box for a
 * heading inside a `summary` to break out of, and would make the accessible name of the thing it
 * labels include the wrapper.
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(props, ref) {
  const {
    children,
    variant = "body",
    tone = "inherit",
    as,
    align = "start",
    noWrap = false,
    gutterBottom = false,
    measure = "none",
    overline = false,
    className,
    style,
    ...rest
  } = props;

  const Element = as ?? ELEMENTS[variant];

  return (
    <Element
      {...rest}
      ref={ref}
      className={cx("uir-text", className)}
      style={style}
      data-variant={variant}
      data-tone={tone}
      data-align={align}
      data-overline={overline ? "" : undefined}
      /*
       * `data-measure` and `data-nowrap` only when set, so a consumer's
       * `.uir-text[data-variant="body"]` selector is not made more specific than it needs to be by an
       * attribute that is present on every instance.
       */
      data-measure={measure === "none" ? undefined : measure}
      data-nowrap={noWrap ? "" : undefined}
      data-gutter={gutterBottom ? "" : undefined}
    >
      {children}
    </Element>
  );
});
