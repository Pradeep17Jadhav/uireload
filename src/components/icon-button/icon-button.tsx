/**
 * IconButton.
 *
 * A button whose entire content is an icon. Built by composing `Button` rather than
 * by re-implementing it, so the size, tone, state and focus behaviour are inherited
 * from one place and cannot drift.
 */

import { forwardRef } from "react";
import { cx } from "../../internal";
import { Button } from "../button";

import type { IconButtonProps } from "./icon-button.types";

/**
 * A button with no visible label.
 *
 * **An accessible name is required.** There is deliberately no `label` prop that
 * could be forgotten: comparable libraries state the same requirement in prose — a tooltip
 * attribute must be provided for icon-only buttons so it represents their exact meaning rather
 * than their function — or they rely on the consumer passing `aria-label`. Pass one, or supply
 * visually hidden text as children.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    // `ghost` by default rather than Button's `outline`: an icon button has no label
    // to read as "clickable", so a border is the only affordance it has. Most usage
    // is inside a toolbar that already has other affordances.
    variant = "ghost",
    tone = "neutral",
    size = "md",
    disabled = false,
    loading = false,
    loadingIndicator,
    edge = false,
    className,
    type = "button",
    children,
    ...rest
  },
  ref
) {
  return (
    <Button
      {...rest}
      ref={ref}
      type={type}
      variant={variant}
      tone={tone}
      size={size}
      disabled={disabled}
      loading={loading}
      loadingIndicator={loadingIndicator}
      className={cx("uir-icon-button", className)}
      data-edge={edge === false ? undefined : edge}
      /*
       * `startIcon`, not `children`.
       *
       * `Button` wraps `children` in `.uir-button__label`, and a label is a line box:
       * an inline-flex icon inside one sits on the text baseline, with the parent's
       * font descent left below it, so the icon lands a few pixels high. Both
       * Both comparable libraries avoid that by keeping the icon out of the text wrapper — one
       * renders `children` straight into the button root
       * rendering `children` into the root, and the other makes the icon a sibling of the
       * label rather than a child of it. The icon slot here is a direct flex
       * child of the root, so `align-items: center` on `.uir-button` centres it and
       * the label is left empty for the `:empty` collapse.
       */
      startIcon={<span className="uir-icon-button__icon">{children}</span>}
    />
  );
});
