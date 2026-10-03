/**
 * Divider prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

/** Which way the rule runs. */
export type DividerOrientation = "horizontal" | "vertical";

/** How heavy the rule is drawn. */
export type DividerWeight = "thin" | "thick";

export interface DividerOwnProps {
  /**
   * Whether the rule is horizontal or vertical.
   *
   * `horizontal` draws a line across the block axis — a rule between stacked sections.
   * `vertical` draws it down the inline axis — a rule between side-by-side items.
   *
   * @default "horizontal"
   */
  orientation?: DividerOrientation | undefined;

  /**
   * Label rendered in the middle of the rule.
   *
   * Only valid on a horizontal divider, and the type says so: a vertical rule with a label in it has
   * nowhere to put the text that does not rotate it, and rotated text is a decision a design system
   * should make deliberately rather than inherit from a prop.
   *
   * When present the rule becomes a `<fieldset>`-like separator using a real `<span>` inside a
   * separator role, so the label is announced as part of the separator rather than as loose text.
   */
  label?: ReactNode | undefined;

  /**
   * Weight of the rule.
   *
   * @default "thin"
   *
   * `thick` is for a rule that carries structure — a header underline. Two weights is enough; a
   * numeric width would invite `0.5px`, which no display renders consistently.
   */
  weight?: DividerWeight | undefined;

  /**
   * Not decorative.
   *
   * @default false
   *
   * A decorative divider is `role="presentation"` — removed from the accessibility tree, which is
   * right for the rule between two buttons in a toolbar and wrong for the rule above a section whose
   * heading is missing.
   *
   * `aria-hidden` is **not** used: a hidden element is still announced by some screen readers when
   * focus lands inside it, and `role="presentation"` is the role-based way to say "this is
   * decoration".
   */
  decorative?: boolean | undefined;

  /** Merged onto the component root. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the rendered element, which is a `<div>` or — when `label` is present — a
   * `<fieldset>`-shaped `<div>` with `role="separator"`.
   */
  ref?: Ref<HTMLDivElement> | undefined;
}

export type DividerProps = DividerOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof DividerOwnProps | "children">;
