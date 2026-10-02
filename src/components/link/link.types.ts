/**
 * Link prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { AnchorHTMLAttributes, CSSProperties, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

export interface LinkOwnProps {
  /** What to render. */
  children?: ReactNode | undefined;

  /**
   * Where the link goes.
   *
   * Optional, and omitting it is a supported state rather than a mistake. A link with no `href`
   * renders an `<a>` with no `href`, which the platform gives no role, no focus stop and no
   * keyboard activation — so it is not a link, and the CSS and this file's defaults assume as much.
   *
   * That is the right default for the common case where a consumer routes internally: the link has no
   * meaningful URL to put in the DOM before a router has resolved one, and faking one with `href="#"`
   * or `href="javascript:void(0)"` produces a link that is announced as a link, is focusable, and
   * goes nowhere.
   */
  href?: string | undefined;

  /**
   * Where to open it.
   *
   * `target="_blank"` and anything else pass straight through. `rel` is forwarded separately rather
   * than defaulted — see below.
   */
  target?: string | undefined;

  /**
   * The `rel` attribute.
   *
   * Not defaulted for `target="_blank"`. Adding `rel="noopener"` silently would be a
   * correctness-with-consequences decision made for the consumer, and `rel="noreferrer"` additionally
   * strips the referrer, which some analytics depend on. The warning below names the case instead.
   */
  rel?: string | undefined;

  /**
   * Link emphasis.
   *
   * - `inline` (default) — underlined. What a reader scans for.
   * - `hover` — underlined on hover and on focus only. The right choice inside a sentence of prose
   *   where a screen full of underlined words is hard to read, but it has a real cost: a keyboard user
   *   cannot see where the links are until they reach them. Choose it deliberately.
   * - `none` — never underlined. For a link inside a heading or a button-like affordance that is
   *   already visually distinct.
   *
   * @default "inline"
   */
  underline?: "inline" | "hover" | "always" | "none" | undefined;

  /**
   * How loud the link is.
   *
   * @default "accent"
   *
   * Accent by default because a link that does not look like a link is not a link — but the emphasis
   * and the colour are separate axes, so a `neutral` link is available for the case where the colour
   * would be wrong in context.
   */
  tone?: Tone | undefined;

  /**
   * Type scale, for a link that has to match its surroundings rather than the default body text.
   *
   * @default "body"
   */
  size?: "sm" | "md" | "lg" | undefined;

  /**
   * Where the link leads.
   *
   * *Text only.* Where a link goes away from this page, saying so is the difference between a link
   * the user chose and a link that surprised them — and it is the difference between a safe guess and
   * a mistake on the way back.
   */
  external?: boolean | undefined;

  /**
   * Trailing adornment, decorative.
   *
   * `aria-hidden`, because `external` already says it. A glyph that repeats what the accessible name
   * states is noise.
   */
  endIcon?: ReactNode | undefined;

  /** Not actionable. */
  disabled?: boolean | undefined;

  /** Merged onto the component root, never onto the icon. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /** Forwarded to the `<a>`. */
  ref?: Ref<HTMLAnchorElement> | undefined;
}

/**
 * The type is `AnchorHTMLAttributes` rather than `HTMLAttributes`.
 *
 * Anchor-specific attributes — `download`, `hreflang`, `ping`, `referrerPolicy`, `type` — are not in
 * the generic set, so inheriting from `HTMLAttributes` would reject `download` on a component whose
 * whole job is rendering an anchor.
 */
export type LinkProps = LinkOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkOwnProps | "children">;
