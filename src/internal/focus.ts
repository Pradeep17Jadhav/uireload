import { useEffect, useRef, type RefObject } from "react";
import { isBrowser, useIsomorphicLayoutEffect } from "./use-media-query";

/** Selector for elements that can receive keyboard focus. */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(",");

/**
 * Attribute marking a member of a roving-tabindex group.
 *
 * Roving focus cannot reuse {@link FOCUSABLE_SELECTOR}: that selector deliberately
 * excludes `[tabindex="-1"]`, which is exactly what every inactive group member
 * carries. Using it would make the group look like it had one member.
 */
export const ROVING_ITEM_ATTRIBUTE = "data-uir-roving-item";

/** Elements considered hidden when computing whether a trap is possible. */
function isVisible(element: HTMLElement): boolean {
  return !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true";
}

/** All tabbable descendants of a container, in DOM order. */
export function getTabbableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

/** All roving-group members within a container, in DOM order. */
export function getRovingItems(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(`[${ROVING_ITEM_ATTRIBUTE}]`)).filter(
    isVisible
  );
}

/** Move focus to a node without scrolling the page unless necessary. */
export function focusElement(element: HTMLElement | null, options?: FocusOptions): void {
  if (!element) return;
  element.focus({ preventScroll: true, ...options });
}

/* ------------------------------------------------------------------ *
 * Roving tabindex
 * ------------------------------------------------------------------ */

export interface RovingFocusOptions {
  /** Orientation of the composite widget. `horizontal` maps to ArrowLeft/ArrowRight. */
  orientation?: "horizontal" | "vertical" | "both";
  /** Loop from last to first and back. Default `true`, matching WAI-ARIA APG. */
  loop?: boolean;
}

/** Key codes for the four arrow keys, checked once. */
const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/**
 * Implement roving tabindex for a composite widget (listbox, menu, toolbar, tabs).
 *
 * Exactly one member has `tabindex=0`; the rest carry `tabindex=-1`, so the whole
 * group is a single tab stop. Arrow keys move focus within the group.
 *
 * Returns `getItemProps` and `handleKeyDown` rather than a component, so items stay
 * plain DOM elements owned by the consumer's markup.
 */
export function useRovingFocus({ orientation = "vertical", loop = true }: RovingFocusOptions = {}) {
  const activeRef = useRef<HTMLElement | null>(null);
  /*
   * The group container is captured the first time a key is handled and then kept.
   * Re-deriving it from `activeRef.current.parentElement` would not work: once the
   * active item is unmounted its `parentElement` is already null, which is exactly
   * the moment we need the container to repair the tab stop.
   */
  const containerRef = useRef<HTMLElement | null>(null);

  /** Spread onto each group member. `index` is its position in the group. */
  const getItemProps = (index: number) => ({
    [ROVING_ITEM_ATTRIBUTE]: "",
    tabIndex: index === 0 ? 0 : -1,
    ...(orientation === "both" ? {} : { "data-orientation": orientation }),
  });

  /**
   * Keyboard handler for a group member.
   *
   * Reads the group from the DOM at event time rather than from a React array, so
   * disabled, filtered and reordered items are always handled correctly. Reading a
   * stale closure of `items` is the usual source of roving-focus bugs.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.defaultPrevented) return;

    const current = event.currentTarget;
    const container = current.parentElement;
    if (container) containerRef.current = container;

    const items = getRovingItems(container);

    if (items.length === 0) return;

    const index = items.indexOf(current);
    if (index === -1) return;

    const useInline = orientation === "horizontal" || orientation === "both";
    const useBlock = orientation === "vertical" || orientation === "both";

    let next: number | null = null;

    if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = items.length - 1;
    } else if (ARROW_KEYS.has(event.key)) {
      const isForward =
        (useBlock && event.key === "ArrowDown") || (useInline && event.key === "ArrowRight");
      const isBackward =
        (useBlock && event.key === "ArrowUp") || (useInline && event.key === "ArrowLeft");

      if (!isForward && !isBackward) return;
      next = index + (isForward ? 1 : -1);
    } else {
      return;
    }

    event.preventDefault();

    const target = loop
      ? ((next % items.length) + items.length) % items.length
      : Math.min(Math.max(next, 0), items.length - 1);

    const node = items[target];
    if (!node) return;

    // Update the single tab stop so tabbing into the group later resumes here.
    for (const item of items) {
      item.tabIndex = item === node ? 0 : -1;
    }

    activeRef.current = node;
    focusElement(node);
  };

  /*
   * Repair the tab stop when the active item leaves the DOM (a filtered list, a
   * deleted row). Without this the group keeps exactly one `tabindex=0` on a node
   * that no longer exists, and the group becomes unreachable by keyboard.
   *
   * Runs after every render rather than on a specific dependency, because the
   * failure mode is "the DOM changed underneath us".
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container?.isConnected) return;

    const items = getRovingItems(container);
    if (items.length === 0) return;
    if (items.some((item) => item.tabIndex === 0)) return;

    const first = items[0];
    if (first) first.tabIndex = 0;
  });

  return { getItemProps, handleKeyDown, activeRef };
}

/* ------------------------------------------------------------------ *
 * Focus trap
 * ------------------------------------------------------------------ */

export interface FocusTrapOptions {
  /** Whether the trap is currently active. */
  active: boolean;
  /** The element that contains the trapped focus. */
  containerRef: RefObject<HTMLElement | null>;
  /** Element to focus on activation. Defaults to the first tabbable descendant. */
  initialFocus?: RefObject<HTMLElement | null> | (() => HTMLElement | null) | undefined;
  /**
   * Restore focus to the previously focused element on deactivation. Default
   * `true`. Disable only when the consumer takes over focus management itself.
   */
  restoreFocus?: boolean;
}

/**
 * Trap focus inside a container while `active`, then restore focus to whatever was
 * focused before activation.
 *
 * Deliberately implemented with a scoped capture-phase `keydown` listener plus an
 * explicit restore, rather than sentinel `<div tabindex="-1">` nodes. Sentinels
 * leak into the accessibility tree as unnamed focus stops and are the source of
 * most "focus jumped somewhere odd" bug reports in component libraries.
 */
export function useFocusTrap({
  active,
  containerRef,
  initialFocus,
  restoreFocus = true,
}: FocusTrapOptions): void {
  const previouslyFocused = useRef<Element | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current = isBrowser() ? (document.activeElement ?? null) : null;

    // A container with nothing tabbable still needs to be focusable, otherwise Tab
    // would escape the dialog entirely on the very first press.
    const items = getTabbableElements(container);
    if (items.length === 0 && !container.hasAttribute("tabindex")) {
      container.tabIndex = -1;
    }

    const requested =
      typeof initialFocus === "function"
        ? initialFocus()
        : (initialFocus?.current ?? items[0] ?? container);

    focusElement(requested);

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Tab") return;

      const tabbable = getTabbableElements(container);
      if (tabbable.length === 0) {
        event.preventDefault();
        focusElement(container);
        return;
      }

      const first = tabbable[0] as HTMLElement;
      const last = tabbable[tabbable.length - 1] as HTMLElement;
      const current = container.ownerDocument.activeElement;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        focusElement(last);
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        focusElement(first);
      }
    };

    // Capture phase: we must see Tab before it moves focus, and before any consumer
    // handler can stop propagation on an inner element.
    const doc = container.ownerDocument;
    doc.addEventListener("keydown", onKeyDown, true);

    return () => {
      doc.removeEventListener("keydown", onKeyDown, true);
    };
  }, [active, containerRef, initialFocus]);

  useEffect(() => {
    if (active) return;

    const previous = previouslyFocused.current;
    if (restoreFocus && previous instanceof HTMLElement && previous.isConnected) {
      focusElement(previous);
    }
    previouslyFocused.current = null;
  }, [active, restoreFocus]);
}
