/**
 * Internal utilities barrel.
 *
 * Nothing in `src/internal` is part of the public API. It may change in any
 * release without a deprecation cycle. Components import from here so that a
 * utility's public surface stays under our control.
 */

export { cx, uirName, PREFIX, type ClassValue } from "./classnames";
export { composeHandlers, type ComposeOptions, type CancellableEvent } from "./compose-handlers";
export { composeRefs, type PossibleRef } from "./compose-refs";
export { useControllableState, type ControllableState } from "./use-controllable-state";
export { useDirection, readDirection, opposite, type Direction } from "./use-direction";
export { useIsomorphicLayoutEffect, useMediaQuery, isBrowser } from "./use-media-query";
export {
  Portal,
  useScrollLock,
  useDismiss,
  useAnchorInView,
  useRepositionOnChange,
} from "./overlay";
export {
  computeOverlayPosition,
  resolvePlacement,
  type PositionedOverlay,
  type OverlayPlacement,
  type ComputePositionOptions,
} from "./positioning";
export {
  useFocusTrap,
  useRovingFocus,
  getTabbableElements,
  focusElement,
  FOCUSABLE_SELECTOR,
  type FocusTrapOptions,
  type RovingFocusOptions,
} from "./focus";
