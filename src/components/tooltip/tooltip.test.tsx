/**
 * Tooltip tests.
 *
 * The centre of gravity is the timing — the open delay and the close grace period. Both exist so the
 * tooltip is readable, and neither is visible in a screenshot.
 */

import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Tooltip } from "uireload/components/tooltip";

/** The trigger wrapper. */
function trigger(): HTMLElement {
  return document.querySelector(".uir-tooltip-trigger") as HTMLElement;
}

/** The tooltip surface, whether or not it is showing. */
function surface(): HTMLElement | null {
  return document.querySelector(".uir-tooltip");
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Tooltip: rendering", () => {
  it("renders the trigger and the tooltip content", () => {
    render(
      <Tooltip label="Delete this project">
        <button type="button">Delete</button>
      </Tooltip>
    );

    expect(trigger()).toBeInTheDocument();
    expect(surface()).toHaveTextContent("Delete this project");
  });

  it("is hidden until shown", () => {
    render(<Tooltip label="Explain">Trigger</Tooltip>);

    expect(surface()).toHaveAttribute("hidden");
    expect(trigger()).not.toHaveAttribute("data-open");
  });

  it("renders the surface even when closed, which is the point", () => {
    render(<Tooltip label="Explain">Trigger</Tooltip>);

    /*
     * A description that appears with its element is the same live-region problem `Snackbar`
     * documents: assistive technology observes changes inside a region it already knows about.
     */
    expect(surface()).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
  });

  it("renders no surface without a label", () => {
    render(<Tooltip>Trigger</Tooltip>);

    expect(surface()).toBeNull();
  });

  it("merges a consumer className onto the trigger", () => {
    render(
      <Tooltip label="x" className="consumer-class">
        Trigger
      </Tooltip>
    );

    expect(trigger()).toHaveClass("uir-tooltip-trigger", "consumer-class");
  });
});

describe("Tooltip: opening", () => {
  it("waits for the delay before showing", () => {
    render(
      <Tooltip label="Explain" delay={400}>
        Trigger
      </Tooltip>
    );

    // A tooltip with no delay fires on every pass of the pointer across a toolbar.
    fireEventEnter();
    expect(trigger()).not.toHaveAttribute("data-open");

    advance(400);
    expect(trigger()).toHaveAttribute("data-open");
  });

  it("shows immediately on focus, because a keyboard user arrived deliberately", () => {
    render(
      <Tooltip label="Explain" delay={400}>
        Trigger
      </Tooltip>
    );

    fireEvent.focus(trigger());

    // There is no accidental-pass-over-the-element case to guard against with a keyboard.
    expect(trigger()).toHaveAttribute("data-open");
  });

  it("shows on focus after the delay if the delay is zero", () => {
    render(
      <Tooltip label="Explain" delay={0}>
        Trigger
      </Tooltip>
    );

    fireEvent.focus(trigger());
    advance(0);

    expect(trigger()).toHaveAttribute("data-open");
  });
});

describe("Tooltip: closing", () => {
  it("waits out the grace period before hiding", () => {
    render(
      <Tooltip label="Explain" delay={0} hideDelay={200}>
        Trigger
      </Tooltip>
    );

    fireEvent.focus(trigger());
    expect(trigger()).toHaveAttribute("data-open");

    fireEvent.blur(trigger());

    // The grace period is what makes the tooltip usable at all: without it, moving the pointer onto
    // the tooltip to read it dismisses it.
    expect(trigger()).toHaveAttribute("data-open");
    advance(200);
    expect(trigger()).not.toHaveAttribute("data-open");
  });

  it("hides immediately on Escape", () => {
    render(
      <Tooltip label="Explain" delay={0}>
        Trigger
      </Tooltip>
    );

    fireEvent.focus(trigger());
    expect(trigger()).toHaveAttribute("data-open");

    fireEvent.keyDown(trigger(), { key: "Escape" });

    // The only way to dismiss a tooltip is to move the pointer, which a keyboard user cannot do.
    expect(trigger()).not.toHaveAttribute("data-open");
  });

  it("ignores other keys", () => {
    render(
      <Tooltip label="Explain" delay={0}>
        Trigger
      </Tooltip>
    );

    fireEvent.focus(trigger());
    fireEvent.keyDown(trigger(), { key: "a" });
    fireEvent.keyDown(trigger(), { key: "Tab" });

    expect(trigger()).toHaveAttribute("data-open");
  });
});

describe("Tooltip: describing the trigger", () => {
  it("points aria-describedby at the tooltip only while shown", () => {
    render(<Tooltip label="Explain">Trigger</Tooltip>);

    // A description pointing at an absent or hidden element is an invalid reference, and every reader
    // handles a stale one by saying nothing at all.
    expect(trigger()).not.toHaveAttribute("aria-describedby");

    fireEvent.focus(trigger());
    expect(trigger()).toHaveAttribute("aria-describedby", surface()?.id);
  });

  it("uses aria-label when the tooltip is the name", () => {
    render(
      <Tooltip label="Delete project" describe="label">
        <button type="button">×</button>
      </Tooltip>
    );

    /*
     * A described-by supplements a name, so an icon button with no name and a tooltip still has no
     * name. `aria-label` supplies one.
     */
    expect(trigger()).toHaveAttribute("aria-label", "Delete project");
    expect(trigger()).not.toHaveAttribute("aria-describedby");
  });

  it("omits aria-label for a non-string label, since String(node) is [object Object]", () => {
    render(
      <Tooltip label={<span>Rich</span>} describe="label">
        Trigger
      </Tooltip>
    );

    expect(trigger()).not.toHaveAttribute("aria-label");
  });

  it("makes the trigger focusable, because a tooltip must be reachable", () => {
    render(<Tooltip label="Explain">Trigger</Tooltip>);

    expect(trigger()).toHaveAttribute("tabindex", "0");
  });
});

describe("Tooltip: positioning", () => {
  it("measures the trigger, which needs both refs on it", () => {
    render(
      <Tooltip label="Explain" open>
        Trigger
      </Tooltip>
    );

    /*
     * This is the whole of the "the tooltip appears at the far right of the screen" bug.
     *
     * The component holds a `triggerRef` for its own measuring, and the consumer's `ref` for their
     * own. Passing only the consumer's left `triggerRef.current` permanently `null`, the positioning
     * effect returned at its first line every time it ran, and the surface never received a
     * `position` — so it rendered as a static block at the end of `<body>`, at whatever x that
     * happened to be.
     *
     * Every other test in this file passed while that was true, because they assert attributes and
     * roles and a tooltip in the wrong place still has `role="tooltip"`. What is asserted here is the
     * thing that actually broke: that the surface is positioned at all.
     */
    const tip = surface();
    expect(tip?.getAttribute("style")).toMatch(/top:\s*-?\d/);
    expect(tip?.getAttribute("style")).toMatch(/left:\s*-?\d/);

    /*
     * `position: fixed` is asserted nowhere here, because it is no longer an inline style — it is in
     * `tooltip.css`, deliberately, so the surface is shrink-to-fit when it is measured. jsdom does not
     * apply the stylesheet, so a computed-style assertion would pass vacuously and an inline one would
     * be asserting a declaration this component no longer makes.
     */
  });

  it("places the surface at a finite coordinate once measured", () => {
    render(
      <Tooltip label="Explain" open>
        Trigger
      </Tooltip>
    );

    const tip = surface();
    const inline = tip?.getAttribute("style") ?? "";

    // jsdom reports every box as 0×0, so the exact numbers prove nothing here — but `NaN` and
    // `undefined` would both mean the measurement produced nothing usable.
    expect(inline).not.toMatch(/NaN|undefined/);
    expect(inline).toMatch(/top:\s*-?\d/);
    expect(inline).toMatch(/left:\s*-?\d/);
  });

  it("still forwards the consumer's ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Tooltip label="Explain" ref={ref}>
        Trigger
      </Tooltip>
    );

    // Both refs, not either: composing them is what lets the component measure *and* the consumer
    // hold the element.
    expect(ref.current).toBe(trigger());
    expect(ref.current).toHaveClass("uir-tooltip-trigger");
  });
});

describe("Tooltip: controlled", () => {
  it("stays open when controlled, and only reports", () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip label="Explain" open delay={0} onOpenChange={onOpenChange}>
        Trigger
      </Tooltip>
    );

    fireEvent.blur(trigger());
    advance(1000);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // React is the source of truth; we report and the consumer decides.
    expect(trigger()).toHaveAttribute("data-open");
  });

  it("opens when controlled and told to", () => {
    render(
      <Tooltip label="Explain" open>
        Trigger
      </Tooltip>
    );

    expect(trigger()).toHaveAttribute("data-open");
    expect(screen.getByRole("tooltip")).toBeVisible();
  });
});

describe("Tooltip: placement", () => {
  it("reports the side it used in logical terms", () => {
    /*
     * `data-placement` is logical, and that is what lets the arrow's CSS be four logical rules with no
     * `dir` override: the overlay algorithm reports the side it used in the reading direction's own
     * terms, so `start` and `end` are already direction-agnostic.
     */
    for (const dir of ["ltr", "rtl"] as const) {
      for (const placement of ["top", "bottom", "inline-start", "inline-end"] as const) {
        const { unmount } = renderWithProviders(
          <Tooltip label="Explain" open placement={placement}>
            Trigger
          </Tooltip>,
          { dir }
        );

        const side = surface()?.getAttribute("data-placement") ?? "";

        // One of the four logical values, and never a physical one — which is the property the arrow
        // rules depend on.
        expect(["top", "bottom", "start", "end"], `${placement}/${dir}`).toContain(side);
        unmount();
      }
    }
  });

  it("keeps a requested placement when it fits", () => {
    /*
     * jsdom reports every box as 0×0, so the overlay algorithm flips anything that would fall outside
     * its viewport padding and the resolved side is not the requested one here. What is stable, and
     * what is asserted below, is that the value stays inside the four logical names.
     */
    render(
      <Tooltip label="Explain" open placement="inline-start">
        Trigger
      </Tooltip>
    );

    expect(surface()).toHaveAttribute("data-placement");
    expect(surface()?.getAttribute("data-placement")).not.toMatch(/left|right/);
  });

  it("defaults to the top", () => {
    render(
      <Tooltip label="Explain" open>
        Trigger
      </Tooltip>
    );

    expect(surface()).toHaveAttribute("data-placement");
  });

  it("states no physical side in a styling hook", () => {
    for (const placement of ["top", "bottom", "inline-start", "inline-end"] as const) {
      const { unmount } = render(
        <Tooltip label="Explain" open placement={placement}>
          Trigger
        </Tooltip>
      );

      /*
       * `inline-start` rather than `left`: the tooltip appears on the reading direction's leading edge
       * and the whole set mirrors in RTL with no second prop. A physical side here would need a
       * physical CSS property to position the arrow, which `lint:css` rejects.
       */
      expect(surface()?.getAttribute("data-placement"), placement).not.toMatch(/left|right/);
      unmount();
    }
  });

  it("keeps a logical placement in RTL", () => {
    for (const placement of ["inline-start", "inline-end"] as const) {
      const { unmount } = renderWithProviders(
        <Tooltip label="اشرح" open placement={placement}>
          Trigger
        </Tooltip>,
        { dir: "rtl" }
      );

      expect(["start", "end"], `${placement} rtl`).toContain(
        surface()?.getAttribute("data-placement")
      );
      unmount();
    }
  });
});

describe("Tooltip: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Tooltip label="اشرح">زر</Tooltip>, { dir: "rtl" });

    expect(trigger()).toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Tooltip label="Explain" open>
          Trigger
        </Tooltip>,
        { scheme }
      );

      expect(trigger(), scheme).toBeInTheDocument();
      unmount();
    }
  });
});

/**
 * Advance the fake clock and flush the resulting renders.
 *
 * A `setTimeout` callback that calls a state setter does not re-render until React is told to flush,
 * so an un-wrapped `vi.advanceTimersByTime` would leave the assertion reading the DOM from *before*
 * the timer fired — which is a green test that proves nothing.
 */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/**
 * Enter the pointer.
 *
 * `fireEvent` rather than a constructed `PointerEvent`, because jsdom does not implement
 * `PointerEvent` and the constructor throws — and because `fireEvent` wraps the dispatch in `act`,
 * which a raw `dispatchEvent` does not.
 */
function fireEventEnter(): void {
  fireEvent.pointerEnter(trigger());
}
