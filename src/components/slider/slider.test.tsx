/**
 * Slider tests.
 *
 * The centre of gravity is the keyboard contract and the range invariant — a two-thumb slider whose
 * thumbs can cross reports a minimum above its maximum, which is the kind of bug that renders fine
 * and lies to everyone else.
 */

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Slider } from "uireload/components/slider";

/** Every thumb, by role. */
function thumbs(): HTMLInputElement[] {
  return screen.getAllByRole("slider") as HTMLInputElement[];
}

/**
 * One thumb by position.
 *
 * Returns the input rather than a bare `HTMLElement` because the value lives on the element as a
 * property — a native range input derives its accessibility value from `value` and writes no
 * `aria-valuenow` attribute to assert against.
 */
function thumb(index: number): HTMLInputElement {
  const found = thumbs()[index];
  if (found === undefined) throw new Error(`no slider thumb at index ${index}`);
  return found;
}

/**
 * Press a key that `user-event` mishandles on a range input.
 *
 * `user-event`'s own key behaviour for `Home`, `End`, `PageUp` and `PageDown` calls
 * `setSelectionRange`, which jsdom throws "Not implemented" for on any input that is not a text-entry
 * type. The library cannot be blamed for that, and the alternative — not testing the keys at all —
 * would leave the half of the keyboard contract this component implements itself unproven.
 *
 * A dispatched `keydown` reaches the component's handler exactly as the real event would, and the
 * setup file's range-input shim still does the platform's stepping.
 */
function pressKey(key: string): void {
  fireEvent.keyDown(document.activeElement ?? document.body, { key });
}

describe("Slider: rendering", () => {
  it("is a real range input", () => {
    render(<Slider label="Volume" />);

    expect(thumbs()).toHaveLength(1);
    expect(thumb(0)).toHaveAttribute("type", "range");
  });

  it("names the control with a real label", () => {
    render(<Slider id="vol" label="Volume" />);

    expect(screen.getByText("Volume").tagName).toBe("LABEL");
    expect(thumb(0)).toHaveAccessibleName("Volume");
  });

  /*
   * The value is read off the `value` property rather than `aria-valuenow`.
   *
   * A native `<input type="range">` derives its accessibility value from `value`; there is no
   * `aria-valuenow` attribute in the DOM to assert against, because a browser writes none. That is
   * the point of using real inputs: the announced number is the form value by construction, so it
   * cannot drift from what is submitted. `min` and `max` *are* attributes and are asserted.
   */
  it("exposes the range bounds as attributes and the value as the form value", () => {
    render(<Slider label="Volume" defaultValue={[40]} min={0} max={100} />);

    expect(thumb(0)).toHaveAttribute("min", "0");
    expect(thumb(0)).toHaveAttribute("max", "100");
    expect(thumb(0)).toHaveValue("40");
  });

  it("renders one thumb per value", () => {
    render(<Slider label="Price range" defaultValue={[10, 80]} />);

    expect(thumbs()).toHaveLength(2);
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(
      <Slider label="Volume" size="lg" tone="danger" defaultValue={[40, 80]} />
    );

    const root = container.querySelector(".uir-slider") as HTMLElement;
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-tone", "danger");
    expect(root).toHaveAttribute("data-range", "");
    expect(root.className).not.toMatch(/lg|danger/);
  });

  it("shows the value beside the label", () => {
    render(<Slider label="Volume" defaultValue={[40]} />);

    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("shows both values for a range", () => {
    render(<Slider label="Price" defaultValue={[10, 80]} />);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("can hide the readout", () => {
    render(<Slider label="Volume" defaultValue={[40]} hideValueText />);

    expect(screen.queryByText("40")).not.toBeInTheDocument();
  });

  it("forwards its ref to the first thumb", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Slider label="Volume" ref={ref} />);

    expect(ref.current).toBe(thumb(0));
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Slider label="Volume" className="consumer-class" />);

    expect(container.querySelector(".uir-slider")).toHaveClass("uir-slider", "consumer-class");
  });

  it("passes name to a single thumb, and names both for a range", () => {
    const { unmount } = render(<Slider label="Volume" name="volume" />);
    expect(thumb(0)).toHaveAttribute("name", "volume");
    unmount();

    render(<Slider label="Price" name="price" defaultValue={[10, 80]} />);
    expect(thumb(0)).toHaveAttribute("name", "price[0]");
    expect(thumb(1)).toHaveAttribute("name", "price[1]");
  });
});

describe("Slider: step", () => {
  it("snaps to the step grid", async () => {
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={[50]} step={25} min={0} max={100} />);

    thumb(0).focus();
    await user.keyboard("{ArrowRight}");

    // 50 + 25 = 75, on the grid.
    expect(thumb(0)).toHaveValue("75");
  });

  it("never snaps past max, even when max is not a whole number of steps", () => {
    render(<Slider label="Volume" defaultValue={[80]} step={7} min={0} max={10} />);

    thumb(0).focus();
    pressKey("End");

    /*
     * `Math.round(10 / 7)` is 1, so a naive snap gives 7 and a naive "keep stepping" gives 14,
     * which is outside the slider. Clamping after snapping is what keeps it at 10.
     */
    expect(thumb(0)).toHaveValue("10");
  });

  it("rounds a continuous value to two decimals", () => {
    render(<Slider label="Opacity" defaultValue={[0.1 + 0.2]} step={null} min={0} max={1} />);

    // `0.1 + 0.2` is not `0.3`, and a slider reporting floating-point noise as data is a lie.
    expect(thumb(0)).toHaveValue("0.3");
  });

  it("sets step=any on the input for a continuous slider", () => {
    render(<Slider label="Opacity" step={null} />);

    expect(thumb(0)).toHaveAttribute("step", "any");
  });

  it("reports a zero step in development and keeps working", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<Slider label="Volume" defaultValue={[50]} step={0} />);

    const messages = error.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("step` is 0"))).toBe(true);
    // Treated as the default rather than throwing: a bad prop value is a mistake, not a crash.
    expect(thumb(0)).toHaveValue("50");
    error.mockRestore();
  });

  it("clamps a defaultValue outside the range", () => {
    render(<Slider label="Volume" defaultValue={[500]} min={0} max={100} />);

    expect(thumb(0)).toHaveValue("100");
  });

  it("orders an out-of-order value array", () => {
    render(<Slider label="Price" defaultValue={[80, 10]} />);

    // Sorted rather than rendered crossed: two thumbs on one track cannot be in two orders.
    expect(thumb(0)).toHaveValue("10");
    expect(thumb(1)).toHaveValue("80");
  });

  it("keeps two thumbs that meet at the same value", () => {
    render(<Slider label="Price" defaultValue={[50, 50]} />);

    /*
     * A collapsed range keeps both thumbs.
     *
     * Dropping one would make the control change shape mid-gesture — and an uncontrolled slider
     * would then be stuck at a single thumb with no way back to a range. The two thumbs overlap,
     * which is the honest picture of "minimum equals maximum".
     */
    expect(thumbs()).toHaveLength(2);
    expect(thumb(0)).toHaveValue("50");
    expect(thumb(1)).toHaveValue("50");
  });
});

describe("Slider: keyboard", () => {
  it("moves by one step with the arrows", async () => {
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={[50]} step={5} />);

    thumb(0).focus();
    await user.keyboard("{ArrowRight}");
    expect(thumb(0)).toHaveValue("55");

    await user.keyboard("{ArrowLeft}");
    expect(thumb(0)).toHaveValue("50");
  });

  it("moves with the other arrow axis too, like a native range input", async () => {
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={[50]} step={5} />);

    thumb(0).focus();
    await user.keyboard("{ArrowUp}");
    expect(thumb(0)).toHaveValue("55");
  });

  it("jumps to the ends with Home and End", () => {
    render(<Slider label="Volume" defaultValue={[50]} />);

    thumb(0).focus();
    pressKey("End");
    expect(thumb(0)).toHaveValue("100");

    pressKey("Home");
    expect(thumb(0)).toHaveValue("0");
  });

  it("moves a tenth of the range with PageUp and PageDown", () => {
    render(<Slider label="Volume" defaultValue={[50]} min={0} max={100} />);

    thumb(0).focus();
    pressKey("PageUp");
    expect(thumb(0)).toHaveValue("60");

    pressKey("PageDown");
    expect(thumb(0)).toHaveValue("50");
  });

  it("accepts plus and minus", async () => {
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={[50]} step={5} />);

    thumb(0).focus();
    await user.keyboard("+");
    expect(thumb(0)).toHaveValue("55");

    await user.keyboard("-");
    expect(thumb(0)).toHaveValue("50");
  });

  it("stops at the ends rather than wrapping", () => {
    render(<Slider label="Volume" defaultValue={[100]} />);

    thumb(0).focus();
    pressKey("End");

    // A slider has ends. Wrapping would make 100 mean 0.
    expect(thumb(0)).toHaveValue("100");
  });

  it("resets to the value from before the interaction on Escape", async () => {
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={[50]} step={5} />);

    thumb(0).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(thumb(0)).toHaveValue("60");

    pressKey("Escape");
    expect(thumb(0)).toHaveValue("50");
  });

  it("is reachable by Tab", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Slider label="Volume" />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Before");
    await user.tab();
    expect(document.activeElement).toBe(thumb(0));
  });

  it("makes every thumb a tab stop", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Slider label="Price" defaultValue={[10, 80]} />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toBe(thumb(0));
    await user.tab();
    expect(document.activeElement).toBe(thumb(1));
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("is skipped by Tab when disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Slider label="Volume" disabled />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("moves only the focused thumb", async () => {
    const user = userEvent.setup();
    render(<Slider label="Price" defaultValue={[10, 80]} step={5} />);

    thumb(1).focus();
    await user.keyboard("{ArrowRight}");

    expect(thumb(0)).toHaveValue("10");
    expect(thumb(1)).toHaveValue("85");
  });
});

describe("Slider: the range invariant", () => {
  it("does not let the thumbs cross", () => {
    render(<Slider label="Price" defaultValue={[10, 80]} step={10} />);

    thumb(1).focus();
    pressKey("End");

    // The high thumb stops at the range max; it cannot pass the low one.
    expect(thumb(1)).toHaveValue("100");
    expect(Number(thumb(0).value)).toBeLessThanOrEqual(Number(thumb(1).value));
  });

  it("does not let the low thumb pass the high one", () => {
    render(<Slider label="Price" defaultValue={[10, 80]} step={10} />);

    thumb(0).focus();
    pressKey("Home");
    expect(thumb(0)).toHaveValue("0");

    /*
     * `End` asks the low thumb for 100. It stops on its neighbour instead, and the range collapses
     * to a single value rather than inverting: a minimum of 80 above a maximum of 80 is a control
     * reporting a range that cannot exist.
     */
    pressKey("End");
    expect(thumb(0)).toHaveValue("80");
    expect(Number(thumb(0).value)).toBeLessThanOrEqual(Number(thumb(1).value));
    expect(thumbs()).toHaveLength(2);
  });
});

describe("Slider: controlled and uncontrolled", () => {
  it("reports each arrow press", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="Volume" defaultValue={[50]} step={5} onValueChange={onValueChange} />);

    thumb(0).focus();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenCalledWith([55]);
  });

  it("stays controlled when value is provided", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="Volume" value={[50]} step={5} onValueChange={onValueChange} />);

    thumb(0).focus();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenCalledWith([55]);
    // React is the source of truth; we report and the consumer decides.
    expect(thumb(0)).toHaveValue("50");
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState([50]);
      return (
        <>
          <Slider label="Volume" value={value} onValueChange={setValue} step={5} />
          <output aria-label="Current">{value.join("-")}</output>
        </>
      );
    }

    render(<Controlled />);
    thumb(0).focus();
    await user.keyboard("{ArrowRight}");

    // Scoped to the `<output>`, because the slider's own readout also renders "55".
    expect(screen.getByLabelText("Current")).toHaveTextContent("55");
    expect(thumb(0)).toHaveValue("55");
  });

  it("reads defaultValue only at mount", () => {
    const { rerender } = render(<Slider label="Volume" defaultValue={[20]} />);
    rerender(<Slider label="Volume" defaultValue={[80]} />);

    expect(thumb(0)).toHaveValue("20");
  });

  it("grows a thumb when a controlled value array grows", () => {
    const { rerender } = render(<Slider label="Price" value={[40]} />);
    expect(thumbs()).toHaveLength(1);

    rerender(<Slider label="Price" value={[10, 80]} />);

    /*
     * The thumb count is derived from the normalised value on every render, so a consumer that
     * promotes a single-thumb slider into a range in controlled mode gets two thumbs without a
     * separate prop to keep in step.
     */
    expect(thumbs()).toHaveLength(2);
    expect(thumb(0)).toHaveValue("10");
    expect(thumb(1)).toHaveValue("80");
  });

  it("does not change thumb count when defaultValue changes", () => {
    const { rerender } = render(<Slider label="Price" defaultValue={[40]} />);
    rerender(<Slider label="Price" defaultValue={[10, 80]} />);

    // `defaultValue` is initial-only, like every other `default*` prop; the assertion documents that
    // rather than pinning the component to behaviour the prop does not promise.
    expect(thumbs()).toHaveLength(1);
    expect(thumb(0)).toHaveValue("40");
  });

  it("reports a commit separately from a change", async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(<Slider label="Volume" defaultValue={[50]} step={5} onValueCommit={onValueCommit} />);

    thumb(0).focus();
    await user.keyboard("{ArrowRight}");

    expect(onValueCommit).toHaveBeenCalledWith([55]);
  });

  it("runs the consumer handler first", async () => {
    const user = userEvent.setup();
    const order: string[] = [];

    render(
      <Slider
        label="Volume"
        defaultValue={[50]}
        step={5}
        onChange={() => order.push("consumer")}
        onValueChange={() => order.push("internal")}
      />
    );

    thumb(0).focus();
    await user.keyboard("{ArrowRight}");

    expect(order[0]).toBe("consumer");
  });
});

describe("Slider: states", () => {
  it("uses the native disabled attribute on every thumb", () => {
    render(<Slider label="Price" defaultValue={[10, 80]} disabled />);

    for (const input of thumbs()) expect(input).toBeDisabled();
  });

  it("gives each thumb its own accessible name in a range", () => {
    render(
      <Slider
        label="Price range"
        defaultValue={[10, 80]}
        getAriaValueText={(value, index) => `${index === 0 ? "Minimum" : "Maximum"} $${value}`}
      />
    );

    // Both share the label; the value text is what distinguishes them.
    expect(thumb(0)).toHaveAttribute("aria-valuetext", "Minimum $10");
    expect(thumb(1)).toHaveAttribute("aria-valuetext", "Maximum $80");
  });

  it("uses the value text for the readout too", () => {
    render(<Slider label="Price" defaultValue={[40]} getAriaValueText={(value) => `$${value}`} />);

    expect(screen.getByText("$40")).toBeInTheDocument();
  });

  it("wires a helper text to aria-describedby", () => {
    render(<Slider id="vol" label="Volume" helperText="Applies to every device" />);

    const describedBy = thumb(0).getAttribute("aria-describedby");
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      "Applies to every device"
    );
  });

  it("draws marks", () => {
    const { container } = render(
      <Slider
        label="Volume"
        defaultValue={[50]}
        marks={[
          { value: 0, label: "0" },
          { value: 100, label: "100" },
        ]}
      />
    );

    expect(container.querySelectorAll(".uir-slider__mark")).toHaveLength(2);
  });

  it("draws tick marks without labels when asked", () => {
    const { container } = render(
      <Slider
        label="Volume"
        defaultValue={[50]}
        showLabels={false}
        marks={[
          { value: 0, label: "0" },
          { value: 100, label: "100" },
        ]}
      />
    );

    expect(container.querySelectorAll(".uir-slider__mark-label")).toHaveLength(0);
    expect(container.querySelectorAll(".uir-slider__mark")).toHaveLength(2);
  });

  it("draws no value bubble by default", () => {
    const { container } = render(<Slider label="Volume" defaultValue={[50]} />);

    expect(container.querySelectorAll(".uir-slider__value-label")).toHaveLength(0);
  });

  it("draws a value bubble when asked", () => {
    const { container } = render(
      <Slider label="Volume" defaultValue={[50]} valueLabelDisplay="on" />
    );

    expect(container.querySelectorAll(".uir-slider__value-label")).toHaveLength(1);
  });

  it("reports the requested track even when a single thumb cannot be inverted", () => {
    const { container } = render(<Slider label="Volume" defaultValue={[50]} track="inverted" />);

    const root = container.querySelector(".uir-slider") as HTMLElement;
    // The attribute reports the prop, so a consumer styling by it is not misled.
    expect(root).toHaveAttribute("data-track", "inverted");
  });
});

describe("Slider: the pointer target", () => {
  /*
   * Wiring, not behaviour.
   *
   * The gesture itself cannot be exercised here: `jsdom` has no `PointerEvent` and no
   * `setPointerCapture`, and `fireEvent.pointerDown(el, { clientX })` arrives with `clientX` as `NaN`.
   * So a DOM-level gesture test passes or fails for reasons that have nothing to do with the code — one
   * did exactly that, "passing" because `NaN !== 25`.
   *
   * What is asserted instead is the shape that made the bug possible, because that *is* checkable: the
   * pointer handlers live on the **rail**, not on the root and not on the inputs. Each input being a
   * full-length native control over one rail is what put one of them on top and gave it every gesture, and
   * asserting the handlers are on the rail fails the moment anyone moves them back.
   *
   * The geometry they call is tested exactly, in `src/internal/track.test.ts`.
   */
  function handlersOn(element: HTMLElement): string[] {
    const key = Object.keys(element).find((k) => k.startsWith("__reactProps"));
    const props = key === undefined ? {} : (element as unknown as Record<string, unknown>)[key];

    return Object.keys(props as object).filter((name) => name.startsWith("onPointer"));
  }

  it("puts the pointer handlers on the rail", () => {
    const { container } = render(<Slider label="Volume" defaultValue={[40]} />);

    const rail = container.querySelector(".uir-slider__rail") as HTMLElement;
    const root = container.querySelector(".uir-slider") as HTMLElement;

    expect(handlersOn(rail).sort()).toEqual([
      "onPointerCancel",
      "onPointerDown",
      "onPointerMove",
      "onPointerUp",
    ]);

    // The root keeps the keyboard and nothing else: a pointer gesture that reaches the root has bypassed
    // the rail, which is the whole bug.
    expect(handlersOn(root)).toEqual([]);
  });

  it("keeps the inputs out of the pointer path", () => {
    const { container } = render(<Slider label="Price" defaultValue={[25, 75]} />);

    const inputs = [...container.querySelectorAll("input[type=range]")] as HTMLInputElement[];

    expect(inputs).toHaveLength(2);

    for (const input of inputs) {
      /*
       * No pointer handlers on the input, and one input per thumb spanning the same rail. Together those
       * are what put a single input on top of the whole rail and gave it every gesture — so a press on the
       * left thumb moved the right one.
       */
      expect(handlersOn(input)).toEqual([]);
      expect(input.className).toContain("uir-slider__input");
    }

    // The drawn thumb is what the pointer is really aimed at, and it is decorative.
    const thumbs = [...container.querySelectorAll(".uir-slider__thumb")];
    expect(thumbs).toHaveLength(2);
    for (const thumb of thumbs) expect(thumb).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Slider: development warnings", () => {
  it("reports an inverted range", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<Slider label="Volume" min={100} max={0} />);

    const messages = error.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("greater than"))).toBe(true);
    error.mockRestore();
  });
});

describe("Slider: direction and scheme", () => {
  it("works in an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Slider label="الحجم" defaultValue={[50]} step={5} />, { dir: "rtl" });

    const input = screen.getByRole("slider", { name: "الحجم" });
    input.focus();
    await user.keyboard("{ArrowRight}");

    // ArrowRight increases in both directions: the platform's own behaviour, not a mirrored one.
    expect(input).toHaveValue("55");
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Slider label="Volume" defaultValue={[40]} tone="danger" />,
        { scheme }
      );

      expect(screen.getByRole("slider", { name: "Volume" }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
