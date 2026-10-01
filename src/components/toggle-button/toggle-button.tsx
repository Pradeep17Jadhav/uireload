/**
 * ToggleButton.
 *
 * A button with two states. Built by composing `Button`, so it inherits the entire
 * visual contract, and it changes only the pressed state and its ARIA expression.
 */

import { forwardRef } from "react";
import { cx, composeHandlers, useControllableState } from "../../internal";
import { Button } from "../button";

import type { ToggleButtonProps } from "./toggle-button.types";

/**
 * A button that toggles between pressed and not-pressed.
 *
 * Standalone it is a button with `aria-pressed`. Inside a single-selection
 * `ToggleButtonGroup` it becomes `role="radio"` with `aria-checked`, which is the
 * correct pattern for "choose exactly one"; see `ToggleButtonGroup`.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  {
    variant = "outline",
    tone = "neutral",
    size = "md",
    pressed: pressedProp,
    defaultPressed = false,
    onPressedChange,
    disabled = false,
    value,
    startIcon,
    className,
    type = "button",
    children,
    onClick,
    // Set by the group; undefined when standalone, which keeps `role="button"`.
    role,
    tabIndex,
    ...rest
  },
  ref
) {
  const [pressed, setPressed] = useControllableState({
    value: pressedProp,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  });

  const asRadio = role === "radio";

  return (
    <Button
      {...rest}
      ref={ref}
      type={type}
      role={role}
      tabIndex={tabIndex}
      variant={variant}
      tone={tone}
      size={size}
      disabled={disabled}
      startIcon={startIcon}
      className={cx("uir-toggle-button", className)}
      // Exactly one of these two is rendered, chosen by `role`. Emitting both would be
      // an ARIA conflict: `aria-pressed` on an element whose role is `radio` is
      // ignored by assistive technology at best and confusing at worst.
      aria-pressed={asRadio ? undefined : pressed}
      aria-checked={asRadio ? pressed : undefined}
      data-pressed={pressed ? "" : undefined}
      onClick={composeHandlers((event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        setPressed(!pressed);
      }, onClick)}
    >
      {children}
    </Button>
  );
});
