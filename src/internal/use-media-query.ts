/**
 * SSR / hydration guards.
 *
 * Two rules the whole library follows:
 *
 * 1. Never touch `window`, `document` or `matchMedia` during render. Only in
 *    effects or event handlers.
 * 2. Anything that reads layout or a media query must be resolved in a layout
 *    effect so the browser has already laid out the node, and it must return a
 *    stable server-rendered default first so hydration never mismatches.
 */

import { useEffect, useLayoutEffect, useState } from "react";

/** `useLayoutEffect` in the browser, `useEffect` on the server (avoids React warnings). */
export const useIsomorphicLayoutEffect: typeof useLayoutEffect =
  typeof window !== "undefined" && typeof window.document !== "undefined"
    ? useLayoutEffect
    : useEffect;

/** True when running in a browser-like environment with a live DOM. */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}

/**
 * Subscribe to a CSS media query, SSR safe.
 *
 * Returns `defaultMatches` during render and on the server so that markup is
 * identical between server and client, then syncs in an effect.
 */
export function useMediaQuery(query: string, defaultMatches = false): boolean {
  const [matches, setMatches] = useState(defaultMatches);

  useIsomorphicLayoutEffect(() => {
    if (!isBrowser() || typeof window.matchMedia !== "function") return;

    const list = window.matchMedia(query);
    const update = (event: MediaQueryList | MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    update(list);

    if (typeof list.addEventListener === "function") {
      list.addEventListener("change", update);
      return () => list.removeEventListener("change", update);
    }

    // Safari < 14 and jsdom fallback.
    list.addListener(update);
    return () => list.removeListener(update);
  }, [query, setMatches]);

  return matches;
}
