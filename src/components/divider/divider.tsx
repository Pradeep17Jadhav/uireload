/**
 * Divider.
 *
 * A rule between things. `role="separator"`, which is the only role it ever needs.
 *
 * A divider is the smallest component in the library and the one most likely to be gotten wrong
 * silently: it renders identically whether or not it is in the accessibility tree, so a rule that
 * should be announced and is not looks exactly the same on screen as one that should not be.
 */

import { forwardRef } from "react";
import { cx } from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./divider.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { DividerProps } from "./divider.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(props, ref) {
  const {
    orientation = "horizontal",
    label,
    weight = "thin",
    decorative = false,
    className,
    style,
    ...rest
  } = props;

  const hasLabel = isRenderable(label);

  /*
   * The label, when it can be named.
   *
   * `role="separator"` is a structure role, and structure roles take their name from `aria-label` and
   * nothing else — the text inside the rule is *not* its accessible name, however obviously it looks
   * like one. So a string label is stated explicitly, and a `ReactNode` is decoration.
   */
  const labelText = typeof label === "string" ? label : undefined;

  /*
   * A vertical rule with a label is coerced to horizontal rather than refused.
   *
   * The type says the combination does not exist, and it does not — but a consumer who has a label and
   * flips `orientation` should get a horizontal rule rather than a component that throws. Coercion is
   * silent, so it is documented in the README and asserted in the test rather than left to be
   * discovered.
   */
  const resolvedOrientation = hasLabel ? "horizontal" : orientation;

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uir-divider", className)}
      style={style}
      data-orientation={resolvedOrientation}
      data-weight={weight}
      data-labelled={hasLabel ? "" : undefined}
      /*
       * `role="separator"`, or `presentation` when decorative.
       *
       * `role="presentation"` rather than `aria-hidden="true"`: a hidden element is still reached by
       * some screen readers when focus lands inside it, and the role-based way to remove decoration
       * from the tree is to say it has no role.
       *
       * `aria-orientation` is stated only for vertical, because `horizontal` is the default value and
       * stating it is redundant markup on every rule in an application.
       */
      role={decorative ? "presentation" : "separator"}
      aria-orientation={resolvedOrientation === "vertical" ? "vertical" : undefined}
      /*
       * The label as an `aria-label`, and only when it is a string.
       *
       * `role="separator"` is a **structure** role, and structure roles do not take their name from
       * their contents — the text inside the rule is not its accessible name, however obviously it
       * looks like one on screen. A string label therefore has to be stated explicitly; a `ReactNode`
       * cannot be, and is rendered as decoration only.
       */
      aria-label={decorative ? undefined : labelText}
    >
      {hasLabel ? (
        /*
         * The label.
         *
         * Inside the separator rather than beside it, so it is part of the separator's name. A label
         * in a sibling element would be loose text on the page that a screen reader meets before the
         * rule it belongs to.
         */
        <span className="uir-divider__label">{label}</span>
      ) : null}
    </div>
  );
});
