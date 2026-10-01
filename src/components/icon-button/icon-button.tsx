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
 * could be forgotten: UI5 states the same requirement in prose ("A tooltip attribute
 * should be provided for icon-only buttons, in order to represent their exact
 * meaning/function", `@ui5/webcomponents/dist/Button.d.ts`, `tooltip`), and MUI
 * relies on the consumer passing `aria-label`. Pass one, or supply visually hidden
 * text as children.
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
    >
      <span className="uir-icon-button__icon">{children}</span>
    </Button>
  );
});
