/**
 * Overlay infrastructure: portals, scroll locking, and dismissal.
 *
 * `Popover`, `Select` and `Dialog` all need the same things, and getting any of them subtly
 * wrong is the kind of bug users report as "the popover is stuck" or "I can't scroll the
 * page any more". They live here so the three components cannot each solve them differently.
 */

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { isBrowser } from "./use-media-query";

/* ------------------------------------------------------------------ *
 * Portal
 * ------------------------------------------------------------------ */

/**
 * Render `children` into `container`, once mounted.
 *
 * ## Why a portal at all
 *
 * Three problems a surface rendered in place cannot avoid:
 *
 * - `overflow: hidden` on any ancestor between the trigger and the surface clips it.
 * - `transform`, `filter` or `will-change` on an ancestor makes that ancestor the containing
 *   block for `position: fixed`, so a "fixed" surface scrolls away with the page.
 * - A `z-index` on an ancestor creates a stacking context, and there is no z-index high
 *   enough to be reliably on top of every consumer's stacking context.
 *
 * ## Why a portal does not fix the accessibility tree
 *
 * It does not, and this is a documented limitation rather than a solved problem. Moving a
 * node in the DOM *does* move it in the accessibility tree, so a portalled surface is a
 * sibling of the trigger rather than its descendant. Two consequences:
 *
 * - `aria-labelledby` and `aria-describedby` still work, because those are document-wide
 *   id references. This is why `Popover` can label itself from a heading that lives inside
 *   the trigger's subtree.
 * - CSS inheritance does *not* cross the boundary. `--uir-*` tokens declared on a wrapper
 *   around the trigger are not inherited by the surface, so a consumer who scopes tokens to
 *   a subtree must also apply them to `body` or pass `container`.
 *
 * Both references portal (`Modal`'s `container` prop, UI5's static area) and both inherit
 * the second problem. Recorded rather than worked around.
 */
export function Portal({
  children,
  container,
}: {
  children: ReactNode;
  /** Where to render. Defaults to `document.body`. Null is treated as "not mounted yet". */
  container?: Element | null | undefined;
}): ReactNode {
  const [mounted, setMounted] = useState(false);

  /*
   * The mount gate, and the reason this is SSR safe.
   *
   * A portal has nowhere to render to on the server, so rendering during SSR would produce
   * nothing on the server and something on the client: a hydration mismatch, plus a surface
   * that appears after hydration. Returning `null` on the first pass — on the server and in
   * the browser alike — makes the two identical and lets the surface appear in an effect.
   *
   * `useEffect` rather than the layout effect on purpose: the surface must not appear before
   * the browser has painted the page it is attached to, or it flashes over unlaid-out
   * content.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isBrowser()) return null;

  return createPortal(children, container ?? document.body);
}

/* ------------------------------------------------------------------ *
 * Scroll lock
 * ------------------------------------------------------------------ */

/**
 * Block page scroll for as long as `active`, and release it on unmount.
 *
 * ## The two things that make this hard
 *
 * 1. **The scrollbar gutter.** `overflow: hidden` on `<html>` removes the scrollbar, so the
 *    page reflows sideways by its width the moment a surface opens. The gutter is measured
 *    *before* the change and applied as `padding-inline-end`, which keeps the content box the
 *    same size. This is the visible half of the "dialog makes my page jump" bug.
 * 2. **Nested modals.** Two dialogs can legitimately be open, and a plain boolean lets the
 *    inner one unlock the page for the outer one. A counter does not: the page unlocks when
 *    the last lock is released, whatever order they were acquired in.
 *
 * ## Cleanup is what makes this safe
 *
 * The effect's cleanup is unconditional. A surface closed by an unexpected unmount — a route
 * change, a `key` change on an ancestor — would otherwise leave the page permanently
 * unscrollable, which is the worst failure this file can have.
 *
 * ## Known gap
 *
 * iOS Safari ignores `overflow: hidden` on `<html>` and scrolls the body regardless. Both
 * reference libraries have the same gap. Recorded rather than patched with a `touchmove`
 * listener, which breaks momentum scrolling when it guesses wrong.
 */
let scrollLocks = 0;
let restorePage: (() => void) | null = null;

function acquireScrollLock(): () => void {
  if (!isBrowser()) return () => undefined;

  scrollLocks += 1;
  // Already locked: this lock is a participant, not the one that mutated the document.
  if (scrollLocks > 1) return release;

  const element = document.documentElement;
  const previousOverflow = element.style.overflow;
  const previousPadding = element.style.paddingInlineEnd;

  const gutter = window.innerWidth - element.clientWidth;

  element.style.overflow = "hidden";
  if (gutter > 0) element.style.paddingInlineEnd = `${gutter}px`;

  restorePage = () => {
    element.style.overflow = previousOverflow;
    element.style.paddingInlineEnd = previousPadding;
    restorePage = null;
  };

  return release;

  function release(): void {
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) restorePage?.();
  }
}

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return acquireScrollLock();
  }, [active]);
}

/* ------------------------------------------------------------------ *
 * Dismissal
 * ------------------------------------------------------------------ */

/**
 * Dismiss on Escape, and on a press outside `containerRef` that is not inside `ignoreRef`.
 *
 * ## Why the listeners are on the document, not on the surface
 *
 * A `click` handler on the surface only sees clicks that *reached* the surface. A click on
 * the page behind, on a scrollbar, or on anything that stops propagation before it arrives
 * never triggers it, so "click outside to dismiss" fails in exactly the cases that matter.
 * A document-level capture-phase listener sees the press before anything can intercept it.
 *
 * ## Why `pointerdown` and not `click`
 *
 * `pointerdown` fires before focus moves, so the surface is still mounted and its geometry
 * still valid when the decision is made. With `click`, a press on a scrollable child can
 * scroll it first, moving the surface's contents between the press and the check, and the
 * press is then misattributed.
 *
 * ## Why `keydown` and not `keyup`
 *
 * `keydown` is the event assistive technology synthesises for its own Escape handling. A
 * `keyup` listener never fires for a synthetic Escape.
 *
 * ## Why the reason is reported
 *
 * A consumer whose surface holds unsaved input has to treat Escape differently from a click
 * outside, and cannot tell them apart from a single boolean. UI5 carries the same
 * information in `PopupBeforeCloseEventDetail`'s `escPressed`.
 */
/** Any element a press can be tested against, so an anchor need not be an `HTMLElement`. */
export type DismissContainer = Element | null;

export function useDismiss({
  active,
  onDismiss,
  containerRef,
  ignoreRef,
  escape = true,
  outsidePress = true,
}: {
  active: boolean;
  onDismiss: (reason: "escape" | "outside-press") => void;
  /** The surface. `contains` is the only method used, so an `Element` is enough. */
  containerRef: RefObject<DismissContainer>;
  /**
   * Nodes that should not count as "outside" — typically the anchor.
   *
   * Typed as `Element` rather than `HTMLElement` because an anchor can legitimately be an SVG
   * element, which is a positioning target but not an `HTMLElement`.
   */
  ignoreRef?: RefObject<Element | null> | undefined;
  escape?: boolean;
  outsidePress?: boolean;
}): void {
  /*
   * Latest-value refs, so the listeners attach once rather than being torn down and
   * re-attached on every render of a surface that is animating open.
   */
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const container = containerRef;

  useEffect(() => {
    if (!active || !isBrowser()) return;

    const doc = container.current?.ownerDocument ?? document;

    const onPointerDown = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      /*
       * A press on the anchor is a toggle, not an outside press. Without this, pressing a
       * trigger while its surface is open closes it and then the click reopens it, which
       * reads as the surface being stuck open.
       */
      if (ignoreRef?.current?.contains(target)) return;
      if (container.current?.contains(target)) return;

      dismissRef.current("outside-press");
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      // A modifier means the browser was asked for something else.
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      event.stopPropagation();
      dismissRef.current("escape");
    };

    if (outsidePress) doc.addEventListener("pointerdown", onPointerDown, true);
    if (escape) doc.addEventListener("keydown", onKeyDown, true);

    return () => {
      if (outsidePress) doc.removeEventListener("pointerdown", onPointerDown, true);
      if (escape) doc.removeEventListener("keydown", onKeyDown, true);
    };
  }, [active, container, escape, ignoreRef, outsidePress]);
}

/* ------------------------------------------------------------------ *
 * Anchor visibility
 * ------------------------------------------------------------------ */

/**
 * Report when the anchor has left the viewport entirely.
 *
 * UI5 watches the opener with an `IntersectionObserver` and closes the popover when it is
 * no longer visible (`_onOpenerIntersection` in
 * `@ui5/webcomponents/dist/Popover.d.ts`). The reason is not cosmetic: a surface pinned to
 * an anchor that has scrolled away floats over unrelated content, still holds focus, and is
 * still announced.
 *
 * A missing `IntersectionObserver` reports nothing rather than closing, because a surface
 * that closes itself because the environment cannot answer the question is worse than one
 * that stays where it is.
 */
export function useAnchorInView(
  ref: RefObject<Element | null>,
  active: boolean,
  onExit: () => void
): void {
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    const element = ref.current;
    if (!active || !element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting === false) exitRef.current();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [active, ref]);
}

/* ------------------------------------------------------------------ *
 * Repositioning
 * ------------------------------------------------------------------ */

/**
 * Re-measure whenever an observed element changes size, or the page scrolls or resizes.
 *
 * The alternative is a stale position: a surface whose content grows, or whose anchor moves
 * because the window scrolled, ends up pointing at the wrong place. `ResizeObserver` plus
 * the two viewport events cover every case that can move an anchor without a scroll event,
 * which includes a web font finishing loading and a `<details>` above it opening.
 *
 * Two details that are deliberate:
 *
 * - The scroll listener is `passive` and capture-phase. Passive because calling
 *   `preventDefault()` would break the page's own scrolling; capture-phase because a
 *   scrolling container inside the surface stops the event bubbling and a non-capturing
 *   listener would then miss its own surface scrolling.
 * - jsdom implements neither `ResizeObserver` nor `IntersectionObserver`, so both are
 *   feature-detected. The measurement itself is driven by the caller, which is what keeps
 *   the positioning testable without a layout engine.
 */
export function useRepositionOnChange(
  refs: RefObject<Element | null>[],
  active: boolean,
  onChange: () => void
): void {
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  /*
   * What the effect actually depends on is *which elements are currently resolved*, since
   * `refs` and the array `map`/`filter` produce are both fresh on every render and neither is a
   * usable dependency.
   *
   * `key` gives the set a stable identity, and `resolvedRef` lets the effect read the elements
   * without depending on them. A null ref that becomes a real element changes `key` from
   * `empty` to that element's signature, which re-runs the effect — the one transition that
   * matters, since an observer can only observe what exists when it is attached.
   */
  const resolved: Element[] = refs
    .map((ref) => ref.current)
    .filter((element): element is Element => element !== null);

  const resolvedRef = useRef<Element[]>(resolved);
  resolvedRef.current = resolved;

  const key = resolved.map((element) => `${element.tagName}#${element.id}`).join("|");

  useEffect(() => {
    if (!active || !isBrowser()) return;

    const handle = (): void => changeRef.current();

    window.addEventListener("scroll", handle, { passive: true, capture: true });
    window.addEventListener("resize", handle);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handle);
      // Null is skipped rather than observed: `observe` throws on a non-Element, and an
      // unpopulated ref is a normal state here, not an error.
      for (const element of resolvedRef.current) observer.observe(element);
    }

    return () => {
      window.removeEventListener("scroll", handle, { capture: true });
      window.removeEventListener("resize", handle);
      observer?.disconnect();
    };
    // Only `key` and `active`. `refs` and `resolvedRef.current` are fresh every render, and
    // depending on them would tear the observers down and re-attach them continuously.
  }, [active, key]);
}
