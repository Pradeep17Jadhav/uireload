/**
 * Avatar.
 *
 * A person's likeness, their initials, or a fallback glyph. A `<div>`, a `<button>`, or an `<img>` with
 * initials behind it — and the image-failed case is handled, because an avatar's image failing is
 * normal rather than exceptional.
 */

import { forwardRef, useEffect, useRef, useState } from "react";
import { cx } from "../../internal";

/*
 * NOTE: this file deliberately does NOT import "./avatar.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { AvatarProps } from "./avatar.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * At most two initials from a name.
 *
 * "Ada Lovelace" → "AL", "Ada" → "A", "Prince" → "P".
 *
 * Two, not three: a three-initial avatar is wide enough that it stops being a circle at any size small
 * enough to sit beside a name, and the shape is doing more work than the letters.
 */
function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "";
  if (words.length === 1) {
    const only = words[0] as string;
    // A single word that is already an abbreviation is used as-is.
    return only.slice(0, only.length >= 2 ? 2 : 1).toUpperCase();
  }

  return `${(words[0] as string)[0] ?? ""}${(words[words.length - 1] as string)[0] ?? ""}`.toUpperCase();
}

export const Avatar = forwardRef<HTMLElement, AvatarProps>(function Avatar(props, ref) {
  const {
    src,
    alt = "",
    initials,
    variant = "circular",
    size = "md",
    tone = "neutral",
    interactive = false,
    badge,
    disabled = false,
    className,
    style,
    ...rest
  } = props;

  /*
   * Whether the image failed to load.
   *
   * State rather than a CSS-only fallback, because a broken-image glyph is not a fallback — it is the
   * browser telling the user the file is missing, which for an avatar means a revoked gravatar or a
   * moved file, both of which are ordinary. Falling back to the initials is what a person would do.
   *
   * Reset when `src` changes, so an avatar that swaps from one broken image to a working one recovers.
   */
  const [failed, setFailed] = useState(false);
  const previousSrc = useRef(src);

  useEffect(() => {
    if (previousSrc.current === src) return;
    previousSrc.current = src;
    setFailed(false);
  }, [src]);

  const showImage = src !== undefined && !failed;
  const text = initials ?? "";

  const inner = (
    <>
      {showImage ? (
        <img className="uir-avatar__image" src={src} alt={alt} onError={() => setFailed(true)} />
      ) : (
        <span className="uir-avatar__initials" aria-hidden={alt === "" ? undefined : "true"}>
          {text === "" ? <span className="uir-avatar__glyph" /> : text}
        </span>
      )}

      {isRenderable(badge) ? (
        <span className="uir-avatar__badge" aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </>
  );

  const data = {
    "data-variant": variant,
    "data-size": size,
    "data-tone": tone,
    "data-interactive": interactive ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-has-image": showImage ? "" : undefined,
  };

  /*
   * An activatable avatar.
   *
   * A `<button type="button">`: one tab stop, Space and Enter activate it natively. `type` is not
   * optional — an avatar in a toolbar inside a form that defaulted to `submit` would submit the form.
   *
   * The consumer's `onClick` is passed through rather than composed: there is no internal click
   * behaviour to compose with, so composing would call the handler twice.
   */
  if (interactive) {
    return (
      <button
        {...rest}
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={cx("uir-avatar", className)}
        style={style}
        {...data}
        disabled={disabled}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      {...rest}
      /*
       * `AvatarProps["ref"]` is `Ref<HTMLElement>` — the widest element `interactive` can render — and
       * this branch renders a `<div>`. The public type stays wide because narrowing it here would make
       * the button variant untypeable.
       */
      ref={ref as React.Ref<HTMLDivElement>}
      className={cx("uir-avatar", className)}
      style={style}
      {...data}
    >
      {inner}
    </div>
  );
});

export { initialsFrom };
