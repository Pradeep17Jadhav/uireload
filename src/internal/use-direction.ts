/**
 * Direction (LTR / RTL) detection.
 *
 * Direction is *never* read during render. The library resolves direction from the
 * DOM (`dir` attribute inheritance) so it works inside portals, shadow roots and
 * nested direction changes without a React context, and without hydration drift.
 *
 * Components that need a boolean read it from their own root element, which is the
 * element that actually inherits `dir`.
 */

import { useIsomorphicLayoutEffect } from "./use-media-query";
import { useState, type RefObject } from "react";

export type Direction = "ltr" | "rtl";

/** Read the effective direction of an element, defaulting to `ltr`. */
export function readDirection(element: Element | null | undefined): Direction {
  if (!element) return "ltr";
  const dir = element.closest("[dir]")?.getAttribute("dir");
  return dir === "rtl" ? "rtl" : "ltr";
}

/**
 * Track the effective direction of the given root element.
 *
 * Returns `defaultDirection` for the first render (and on the server) so markup is
 * identical between server and client.
 */
export function useDirection(ref: RefObject<Element | null>, defaultDirection: Direction = "ltr") {
  const [direction, setDirection] = useState<Direction>(defaultDirection);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const sync = (): void => setDirection(readDirection(node));
    sync();

    // Keep us correct when the effective `dir` changes at runtime. Observing the
    // nearest `[dir]` ancestor (falling back to `<html>`) is enough, and avoids
    // watching a whole subtree per mounted component.
    //
    // Known limitation, documented rather than papered over: adding `dir` to an
    // ancestor that had none is not observed, because we cannot watch an ancestor
    // we do not yet know about. Set `dir` on `<html>` or on an element that already
    // has it, which is what every real application does.
    if (typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(sync);
    const host = node.closest("[dir]") ?? node.ownerDocument.documentElement;
    observer.observe(host, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, [ref]);

  return direction;
}

/** Resolve the logical counterpart of a physical inline direction. */
export function opposite(direction: Direction): Direction {
  return direction === "rtl" ? "ltr" : "rtl";
}
