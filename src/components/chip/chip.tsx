/**
 * Chip.
 *
 * A small, rounded label for a piece of metadata: a category, a count, a filter, a removable item.
 *
 * The component's whole surface is the choice of `intent`, because that is the choice that decides
 * what the chip *is* to the platform. A static label is a `<span>` and needs no role, no name and no
 * tab stop; an activatable chip is a `<button>`; a removable chip is a `<span>` with a real
 * `<button>` inside for the trailing control. Nothing here reimplements any of that — the element
 * choice *is* the accessibility work.
 */

import { forwardRef } from "react";
import { composeHandlers, cx } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./chip.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by `scripts/bundle-css.mjs`.
 */

import type { ChipProps } from "./chip.types";

/** Whether a slot has anything to render. */
function isRenderable(node: unknown): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * The chip's text, when it is plain text — the fallback for a remove button's accessible name.
 *
 * Returns `undefined` for arbitrary content, because a `ReactNode` that happens to be an element
 * does not have a name anyone can announce.
 */
function textOf(children: React.ReactNode): string | undefined {
  if (typeof children === "string" || typeof children === "number") return String(children);
  return undefined;
}

export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(props, ref) {
  const {
    children,
    intent = "none",
    tone = "neutral",
    size = "md",
    variant = "filled",
    icon,
    removeLabel,
    onRemove,
    disabled = false,
    buttonLabel,
    className,
    style,
    onClick,
    onKeyDown,
    ...rest
  } = props;

  const hasRemove = intent === "remove" && isRenderable(onRemove);

  /*
   * A remove button's name, built from the chip's own text when it has any.
   *
   * "Remove" alone announces as "Remove button" and says nothing about what is being removed, which
   * is useless in a list of twelve. `removeLabel` overrides it for exactly that case.
   */
  const ownText = textOf(children);
  const removeName =
    removeLabel ??
    `${ownText ? `${ownText} ` : ""}${resolveMessage(undefined, BASE_MESSAGES, "common.remove")}`;

  const data = {
    "data-intent": intent,
    "data-tone": tone,
    "data-size": size,
    "data-variant": variant,
    "data-disabled": disabled ? "" : undefined,
  };

  const content = (
    <>
      {/*
        Decorative. The chip's text is its name; a leading icon announced as well would say the same
        thing twice. An icon that carries meaning the text does not belongs in the text.
      */}
      {isRenderable(icon) ? (
        <span className="uir-chip__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      <span className="uir-chip__label">{children}</span>

      {hasRemove ? (
        <button
          type="button"
          className="uir-chip__remove"
          /*
           * `aria-label` rather than a visually hidden span.
           *
           * The accessible name has to include the chip's text, which is *outside* this button, so it
           * cannot be derived from the button's own content. `aria-label` is the only way to supply a
           * name that is not in the subtree.
           */
          aria-label={removeName}
          disabled={disabled}
          onClick={composeHandlers<React.MouseEvent<HTMLButtonElement>>(
            (event) => {
              /*
               * Stop the chip's own click from also firing.
               *
               * `intent="remove"` renders a span, so this only matters for a consumer who has put an
               * `onClick` on the chip as well — and in that case they almost certainly meant the click
               * on the remove control to remove, not to open.
               */
              event.stopPropagation();
              onRemove?.();
            },
            /*
             * Deliberately *not* the root's `onClick`.
             *
             * The root is an ancestor of this button, so a click here would otherwise reach both — and
             * `stopPropagation` above is what stops it reaching the root's handler. Passing it here as
             * well would run the consumer's handler twice for one click.
             */
            undefined
          )}
        >
          {/*
            A CSS-drawn cross: two rotated bars, so there is no icon to import and no request. The
            button has an `aria-label`, so the shape is presentational and `aria-hidden` is correct.
          */}
          <span className="uir-chip__remove-glyph" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );

  /*
   * `intent="none"` — a span.
   *
   * Not a div, because a div with no role is announced by whatever its contents happen to say, and a
   * static chip is exactly that. `onClick` is still forwarded: a consumer who wants a clickable
   * non-semantic chip can have one, and the CSS contract says it is not focusable.
   */
  if (intent === "none") {
    return (
      <span
        {...rest}
        className={cx("uir-chip", className)}
        style={style}
        {...data}
        onClick={onClick}
      >
        {content}
      </span>
    );
  }

  /*
   * `intent="button"` — a real button.
   *
   * `type="button"` is not optional: a chip inside a form that defaulted to `submit` would submit the
   * form, which is never what activating a chip means.
   */
  if (intent === "button") {
    return (
      <button
        {...rest}
        /*
         * Widened because `ChipProps["ref"]` is `Ref<HTMLElement>` — the widest element any `intent`
         * can render — while this branch renders a `<button>`. A callback ref is typed rather than
         * cast, so both the function and the object forms keep working.
         */
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={cx("uir-chip", className)}
        style={style}
        {...data}
        aria-label={buttonLabel}
        disabled={disabled}
        /*
         * Passed straight through rather than composed.
         *
         * `composeHandlers` exists to let a consumer veto *our* behaviour, and a button chip has no
         * internal click behaviour — it is a `<button>` and the browser already does everything a
         * button does. Composing here would call the consumer's handler twice.
         */
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {content}
      </button>
    );
  }

  /*
   * `intent="remove"` — a span holding the remove control.
   *
   * The chip's content is not itself interactive here. A button inside a button is invalid HTML and
   * an unlabelled one to a screen reader, so the two halves stay siblings and only the trailing
   * control is focusable.
   */
  return (
    <span {...rest} className={cx("uir-chip", className)} style={style} {...data} onClick={onClick}>
      {content}
    </span>
  );
});
