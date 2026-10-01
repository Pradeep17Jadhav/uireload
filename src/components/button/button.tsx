/**
 * Button.
 *
 * The reference implementation for every other control in the library. If you are
 * unsure how a control should behave, this file answers it; `docs/foundations.md`
 * answers why.
 *
 * Design reconciliation in `README.md`.
 */

import { forwardRef } from "react";
import { cx, composeHandlers } from "../../internal";
import type { ButtonProps } from "./button.types";

/**
 * A button that triggers an action.
 *
 * Renders a real `<button>` with no wrapper, so native form participation, native
 * focus order, native Enter/Space activation and native `:disabled` all apply without
 * this component having to reimplement any of them.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "outline",
    tone = "neutral",
    size = "md",
    disabled = false,
    loading = false,
    loadingIndicator,
    startIcon,
    endIcon,
    fullWidth = false,
    type = "button",
    className,
    children,
    onClick,
    ...rest
  },
  ref
) {
  // `loading` is a stronger claim than `disabled`: it means "do not interact, and do
  // not let anyone submit the form this lives in". Both attributes are needed — the
  // boolean for the visual state, the attribute for the behaviour.
  const inert = disabled || loading;

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      // `inert` rather than `disabled` alone, so a loading button cannot be submitted.
      disabled={inert}
      className={cx("uir-button", className)}
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-loading={loading ? "" : undefined}
      data-full-width={fullWidth ? "" : undefined}
      aria-busy={loading || undefined}
      onClick={composeHandlers((event: React.MouseEvent<HTMLButtonElement>) => {
        // Belt and braces: `disabled` already blocks this, but a consumer could
        // pass `disabled={false}` through `rest` ordering or render into a form
        // that submits on click. Being explicit costs one line.
        if (inert) event.preventDefault();
      }, onClick)}
    >
      {/*
        The wrapper is always present. Google Translate re-translates the subtree when
        it changes, and removing the node mid-flight crashes it
        (mui/material-ui#27853). Visibility is CSS, driven by `data-loading`.
      */}
      <span className="uir-button__loading" aria-hidden="true">
        {loadingIndicator ?? <span className="uir-button__spinner" />}
      </span>

      {startIcon ? (
        <span className="uir-button__icon uir-button__icon--start">{startIcon}</span>
      ) : null}

      <span className="uir-button__label">{children}</span>

      {endIcon ? <span className="uir-button__icon uir-button__icon--end">{endIcon}</span> : null}
    </button>
  );
});
