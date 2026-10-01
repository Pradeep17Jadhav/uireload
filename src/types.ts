/**
 * Public prop conventions shared by every UIReload component.
 *
 * These types are deliberately small and structural. They exist so that every
 * component accepts the same escape hatches, and so that native attributes,
 * refs and aria props compose predictably.
 */

import type { CSSProperties, HTMLAttributes, ReactNode, Ref, RefObject } from "react";

/** Native attributes a component forwards to its root element. */
export type NativeRootProps<E extends HTMLElement = HTMLElement> = Omit<
  HTMLAttributes<E>,
  "children" | "className" | "style"
>;

/**
 * Props that nearly every component accepts.
 *
 * Note what is *not* here: no `sx`, no `styles`, no `css` prop. Styling stays the
 * consumer's job, expressed through the class names we render and the CSS custom
 * properties we define. Avoiding inline-style escape hatches is what lets
 * consumers restyle with plain CSS, CSS modules, or a utility framework.
 */
export interface UIReloadBaseProps<E extends HTMLElement = HTMLElement> extends NativeRootProps<E> {
  /** Merge additional class names onto the component root. */
  className?: string | undefined;
  /** Inline styles applied to the component root. Used sparingly. */
  style?: CSSProperties | undefined;
  /** Content rendered inside the component. */
  children?: ReactNode;
}

/** Props for components that render a single element and forward their ref. */
export interface PolymorphicRefProp<E extends Element = HTMLElement> {
  ref?: Ref<E> | undefined;
}

/**
 * Slots let a consumer place their own content inside a component's structure
 * without the library needing to know what that content is.
 */
export interface SlotProps {
  children?: ReactNode;
}

/**
 * Shared sizing scale.
 *
 * Sizing is driven by `data-size` attributes, not by variants baked into JS, so
 * consumers can restyle any size from CSS without new props.
 */
export type Size = "sm" | "md" | "lg";

/**
 * Describes an element that should receive focus programmatically.
 *
 * Accepts a ref, a DOM node, or a thunk returning one. Callables are resolved at
 * focus time and never during render, which keeps this SSR and hydration safe.
 */
export type FocusTarget =
  Element | null | undefined | RefObject<Element | null> | (() => Element | null | undefined);
