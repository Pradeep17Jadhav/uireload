/**
 * Prop types for the template component.
 *
 * Kept in a `*.types.ts` file when a component has enough types that `index.ts`
 * would otherwise become a wall of type declarations. Types are exported publicly
 * so consumers get full IntelliSense on every prop, including which ones accept
 * native attributes.
 */

import type { UIReloadBaseProps } from "../../types";

export interface ExampleProps extends UIReloadBaseProps<HTMLDivElement> {
  /**
   * Visual size. Rendered as `data-size` rather than a class so consumers can
   * target it from CSS without our knowing their selector strategy.
   */
  size?: "sm" | "md" | "lg" | undefined;
  /**
   * Disables interaction. Rendered as `data-disabled` plus the native `disabled`
   * attribute where the element supports it, so assistive technology agrees with
   * the visual state.
   */
  disabled?: boolean | undefined;
  /**
   * Controlled open state, when the component has one.
   * Undefined means uncontrolled; see `useControllableState`.
   */
  open?: boolean | undefined;
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean | undefined;
  /** Called whenever the component intends to change `open`. */
  onOpenChange?: ((open: boolean) => void) | undefined;
}
