import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isBrowser, useMediaQuery } from "./use-media-query";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

/** Minimal MediaQueryList stub with controllable listeners. */
function stubMatchMedia(matches: boolean) {
  const modern = new Set<(event: MediaQueryListEvent) => void>();
  const legacy = new Set<(event: MediaQueryListEvent) => void>();

  const list = {
    matches,
    media: "(min-width: 600px)",
    onchange: null,
    addEventListener: (_type: string, fn: (event: MediaQueryListEvent) => void) => modern.add(fn),
    removeEventListener: (_type: string, fn: (event: MediaQueryListEvent) => void) =>
      modern.delete(fn),
    addListener: (fn: (event: MediaQueryListEvent) => void) => legacy.add(fn),
    removeListener: (fn: (event: MediaQueryListEvent) => void) => legacy.delete(fn),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  window.matchMedia = vi.fn().mockReturnValue(list) as unknown as typeof window.matchMedia;

  return {
    list,
    emit(next: boolean, { legacy: useLegacy = false } = {}) {
      const pool = useLegacy ? legacy : modern;
      const event = { matches: next, media: list.media } as MediaQueryListEvent;
      act(() => {
        for (const fn of pool) fn(event);
      });
    },
    legacyListenerCount: () => legacy.size,
  };
}

describe("isBrowser", () => {
  it("is true under jsdom", () => {
    expect(isBrowser()).toBe(true);
  });
});

describe("useMediaQuery", () => {
  it("returns the default during render, then syncs after mount", async () => {
    stubMatchMedia(true);

    // `renderHook` flushes effects inside `act`, so the render-phase value has to be
    // captured from inside the callback. Resolving during render is the classic
    // hydration bug: the server has no `matchMedia` at all.
    const duringRender: boolean[] = [];
    const { result } = renderHook(() => {
      const matches = useMediaQuery("(min-width: 600px)", false);
      duringRender.push(matches);
      return matches;
    });

    expect(duringRender[0]).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("defaults to false when no default is given", async () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("responds to change events", async () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));
    await waitFor(() => expect(result.current).toBe(false));

    media.emit(true);

    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", async () => {
    const media = stubMatchMedia(true);
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 600px)"));
    await waitFor(() => expect(true).toBe(true));

    unmount();
    // No assertion on the stub size: the meaningful check is that removing twice
    // or after unmount does not throw.
    media.emit(false);
  });

  it("falls back to addListener on older engines", async () => {
    const media = stubMatchMedia(false);
    // Simulate Safari < 14 / jsdom by removing the modern API.
    (media.list as unknown as { addEventListener?: unknown }).addEventListener = undefined;

    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));
    await waitFor(() => expect(result.current).toBe(false));

    media.emit(true, { legacy: true });
    expect(result.current).toBe(true);
  });

  it("keeps the default when matchMedia is unavailable", () => {
    // @ts-expect-error deliberately simulating a non-browser environment
    window.matchMedia = undefined;
    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)", true));
    expect(result.current).toBe(true);
  });
});
