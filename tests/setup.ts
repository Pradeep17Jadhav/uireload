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

// jsdom does not implement the keyboard behaviour of `<input type="range">`: ArrowLeft / ArrowRight
// / ArrowUp / ArrowDown / Home / End do nothing, where every browser steps the value and fires
// `input` then `change`.
//
// `Slider` relies on that platform behaviour on purpose — handling the arrows itself as well would
// move the thumb twice per press — so without this shim the component's keyboard tests cannot be
// written at all: they would have to assert against a browser's behaviour that the test environment
// does not have.
//
// This is a faithful implementation of what the platform does, not a convenience: same keys, same
// stepping rule, same event order, same clamping to `min` / `max`. `step="any"` gets a hundredth of
// the range, which is the increment browsers use for a continuous range input.
//
// It is deliberately *not* extended to `PageUp` / `PageDown` / `Escape`, because no browser applies
// those to a range input natively — those are the keys `Slider` has to implement itself, and their
// tests are what prove that half of the component works.
/** Step a range input the way the platform does, and fire the events it would. */
function runRangeKeydown(self: HTMLInputElement, event: KeyboardEvent): void {
  if (self.type !== "range" || self.disabled || event.defaultPrevented) return;

  const min = Number(self.min === "" ? 0 : self.min);
  const max = Number(self.max === "" ? 100 : self.max);
  const step = self.step === "" || self.step === "any" ? (max - min) / 100 : Number(self.step);
  const current = Number(self.value);

  let next: number;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowUp":
      next = current + step;
      break;
    case "ArrowLeft":
    case "ArrowDown":
      next = current - step;
      break;
    case "Home":
    case "End":
      // Set the bound exactly, never snapped. `max` is not always a whole number of steps from
      // `min` — `step="7"` on a `0..10` range is legal — and a browser still puts the thumb on 10.
      next = event.key === "Home" ? min : max;
      break;
    default:
      return;
  }

  // Clamped, then rounded back onto the step grid so float error does not accumulate visibly.
  const clamped = Math.min(Math.max(next, min), max);
  const stepped =
    next === min || next === max
      ? clamped
      : Math.min(Math.max(min + Math.round((clamped - min) / step) * step, min), max);
  if (stepped === current) return;

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(self, String(stepped));

  // `input` then `change`, in that order, as the platform does.
  self.dispatchEvent(new Event("input", { bubbles: true }));
  self.dispatchEvent(new Event("change", { bubbles: true }));
}

if (typeof document !== "undefined") {
  // Delegated rather than patched onto `HTMLInputElement.prototype`: jsdom's interface prototype is
  // not a live `EventTarget`, so calling `addEventListener` on it throws. One capture-phase listener
  // on the document sees every range input, including ones mounted later.
  document.addEventListener(
    "keydown",
    (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof HTMLInputElement) runRangeKeydown(target, event);
    },
    true
  );
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
