import { afterEach, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// `expect.extend` rather than importing "@testing-library/jest-dom" directly: the
// bare import registers itself against `expect` only when a global `expect` exists,
// which is not the case under Vitest's module-scoped runner.
expect.extend(matchers);

// jsdom does not implement these, and several components depend on them existing.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

if (typeof globalThis.DOMRect === "undefined") {
  globalThis.DOMRect = class DOMRect {
    constructor(
      public x = 0,
      public y = 0,
      public width = 0,
      public height = 0
    ) {}
    get top(): number {
      return this.y;
    }
    get left(): number {
      return this.x;
    }
    get right(): number {
      return this.x + this.width;
    }
    get bottom(): number {
      return this.y + this.height;
    }
  } as unknown as typeof DOMRect;
}

// jsdom does no layout and has no concept of scrolling, but `Select` calls
// `scrollIntoView` to keep the roving-highlighted option visible in a long list. Without this the
// method is `undefined` and every arrow-key test throws instead of asserting behaviour.
if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {};
}

// `matchMedia` is used by responsive components and by Storybook's toolbar. jsdom
// ships a stub that returns `matches: false` for everything, which silently hides
// SSR/hydration bugs. This default keeps tests deterministic.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}

if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) =>
    clearTimeout(id)) as typeof cancelAnimationFrame;
}

afterEach(() => {
  // Every test renders into `document.body`. Leaking nodes between tests causes
  // false positives in `getByRole` queries, so reset explicitly.
  document.body.innerHTML = "";
});
