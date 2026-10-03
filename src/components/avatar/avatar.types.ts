/**
 * Avatar prop types.
 *
 * The reconciliation this file's props encode — which reference implementation backed each
 * non-obvious choice — is recorded in `docs/references.md`, which is not published.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import type { Tone } from "../../foundations";

/**
 * Shape.
 *
 * `square` is deliberately absent: at avatar sizes a hard square is what a company logo wants, which
 * is an image rather than an avatar.
 */
export type AvatarShape = "circular" | "rounded";

/**
 * Size.
 *
 * Its own five-step ladder rather than the shared `Size`, and the reason is the top of it.
 *
 * `--uir-control-height-*` tops out at 2.75rem, because a control taller than that is not a control —
 * it is a panel. An avatar has no such ceiling: an avatar is a picture of a person, it appears beside
 * prose at whatever size the layout needs, and the sizes that actually matter are the large ones. A
 * gallery header, a comment byline and a 48px avatar in a table row are all ordinary, and none of
 * them fits inside a control height.
 *
 * So `xs` and `xl` are added either side of the shared three. `sm` / `md` / `lg` keep the control
 * heights so an avatar still lines up with the button beside it, and `xl` goes to 8rem, which is
 * large enough to be the subject of a page rather than a decoration on it.
 */
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarOwnProps {
  /**
   * Image source.
   *
   * Rendered as a real `<img>` with `alt`, and the initials are the fallback for when it is missing
   * or fails to load. An avatar's image failing is normal — a revoked gravatar, a moved file — and a
   * broken-image glyph is a worse answer than the initials the component already has.
   */
  src?: string | undefined;

  /**
   * Image alt text.
   *
   * The person's name when the avatar identifies a person, because the image *is* that person's
   * likeness and a screen reader announcing "photograph" has said nothing.
   *
   * Empty string when the avatar is decorative — beside a name that is already visible. An `alt=""` is
   * not a missing alt; it is the correct declaration that the image carries no information.
   */
  alt?: string | undefined;

  /**
   * Up to two initials, shown when there is no image.
   *
   * Rendered as text inside the avatar, so it is part of the accessible name whether or not `alt` is
   * set — the alternative is an avatar announced as an empty shape beside a name.
   */
  initials?: string | undefined;

  /**
   * Shape.
   *
   * @default "circular"
   *
   * `square` is not offered: a rounded square at avatar sizes reads as a slightly squashed circle, and
   * a hard square is what a company logo wants, which is an image rather than an avatar.
   */
  variant?: AvatarShape | undefined;

  /**
   * Size.
   *
   * @default "md"
   *
   * `xs` … `xl`. See `AvatarSize`: the shared control ladder tops out at 2.75rem because a taller
   * control is a panel, which is the right ceiling for a button and the wrong one for a picture of a
   * person. `sm` / `md` / `lg` keep the control heights so an avatar still lines up with the control
   * beside it.
   */
  size?: AvatarSize | undefined;

  /**
   * Fill when there is no image.
   *
   * @default "neutral"
   */
  tone?: Tone | undefined;

  /**
   * Whether the whole avatar is activatable.
   *
   * @default false
   *
   * Renders a `<button type="button">` — one tab stop, Space and Enter activate it natively. The common
   * case is an avatar that opens a profile menu, and a `<div>` with a click handler gets close to that
   * while losing the platform's activation semantics.
   */
  interactive?: boolean | undefined;

  /**
   * Trailing badge — a presence dot, a count.
   *
   * Rendered outside the avatar's box and `aria-hidden`: a presence dot has no announcement, and a
   * count that matters belongs in the avatar's name or beside it, not in a corner that a screen reader
   * meets as an unlabelled shape.
   */
  badge?: ReactNode | undefined;

  /** Not actionable. Native `disabled` when interactive. */
  disabled?: boolean | undefined;

  /** Merged onto the component root, never onto the image. */
  className?: string | undefined;

  /** Inline styles for the component root. Used sparingly. */
  style?: CSSProperties | undefined;

  /**
   * Forwarded to the interactive element when there is one, and to the root otherwise.
   *
   * `Ref<HTMLElement>` because `interactive` decides the element, so a narrower ref would make the
   * button variant untypeable.
   */
  ref?: Ref<HTMLElement> | undefined;
}

export type AvatarProps = AvatarOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof AvatarOwnProps | "children">;
