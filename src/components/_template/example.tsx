/**
 * Template component.
 *
 * This is the architectural reference for authoring a UIReload component. It is
 * NOT a product component and is never exported: `index.ts` in this folder
 * deliberately exports nothing, and the `_` prefix keeps the folder out of the
 * published build.
 *
 * What it demonstrates, in the order a real component needs it:
 *
 * 1. Native attributes spread first, so consumer props are never silently dropped.
 * 2. `className` composed through `cx` rather than string concatenation.
 * 3. Visual state expressed as `data-*` attributes, never as CSS class names.
 * 4. Controlled/uncontrolled state via `useControllableState`.
 * 5. Handlers composed so a consumer can `preventDefault()` to opt out.
 * 6. Refs forwarded to the root element.
 * 7. No DOM access during render, so the component is SSR safe.
 * 8. All user-visible strings routed through the i18n catalog.
 */

import { forwardRef, type MouseEvent } from "react";
import { cx, composeHandlers, useControllableState } from "../../internal";
import { resolveMessage, BASE_MESSAGES } from "../../i18n";

/*
 * NOTE: this file deliberately does NOT import "./example.css".
 *
 * Component CSS is assembled into `uireload/styles.css` by
 * `scripts/bundle-css.mjs`. Importing it from JavaScript would make the package
 * non-tree-shakeable (`sideEffects: false` would be a lie) and would duplicate the
 * rules in every consumer bundle. A story imports its own stylesheet instead.
 */

import type { ExampleProps } from "./example.types";

/**
 * Placeholder root. Replace the element and the `role` with whatever the WAI-ARIA
 * APG pattern for this component requires. If the pattern calls for no role, do
 * not add one.
 */
export const Example = forwardRef<HTMLDivElement, ExampleProps>(function Example(
  {
    className,
    style,
    size = "md",
    disabled = false,
    open,
    defaultOpen = false,
    onOpenChange,
    onClick,
    children,
    ...rest
  },
  ref
) {
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const handleClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uir-example", className)}
      style={style}
      data-size={size}
      data-state={isOpen ? "open" : "closed"}
      aria-disabled={disabled || undefined}
      onClick={composeHandlers(handleClick, onClick)}
    >
      {children}
      <span hidden>{resolveMessage(undefined, BASE_MESSAGES, "common.close")}</span>
    </div>
  );
});
