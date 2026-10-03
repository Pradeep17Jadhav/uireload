import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Loader } from "uireload/components/loader";

/*
 * Read the fill's inline custom property rather than its computed width: jsdom performs no layout, so a
 * computed `width` would be `0px` for every value and every assertion about it would pass for the wrong
 * reason.
 */
const percentOf = (element: Element | null): string | undefined =>
  (element as HTMLElement | null)?.style.getPropertyValue("--uir-loader-percent");

const fillOf = (root: HTMLElement): HTMLElement | null =>
  root.querySelector<HTMLElement>(".uir-loader__fill");

describe("Loader", () => {
  it("renders a track and a fill", () => {
    render(<Loader data-testid="root" />);

    const root = screen.getByTestId("root");
    expect(root.querySelector(".uir-loader__track")).not.toBeNull();
    expect(fillOf(root)).not.toBeNull();
  });

  it("forwards native attributes to the root", () => {
    render(<Loader data-testid="root" id="my-loader" lang="en" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("id", "my-loader");
    expect(root).toHaveAttribute("lang", "en");
  });

  it("merges a consumer className rather than replacing ours", () => {
    render(<Loader data-testid="root" className="consumer-class" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveClass("uir-loader");
    expect(root).toHaveClass("consumer-class");
  });

  it("forwards its ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Loader ref={ref} data-testid="root" />);

    expect(ref.current).toBe(screen.getByTestId("root"));
  });

  describe("state is exposed as data attributes, not class names", () => {
    it("defaults size and tone", () => {
      render(<Loader data-testid="root" />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("data-size", "md");
      expect(root).toHaveAttribute("data-tone", "accent");
    });

    it("exposes each supplied value", () => {
      render(<Loader data-testid="root" size="lg" tone="positive" value={30} />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("data-size", "lg");
      expect(root).toHaveAttribute("data-tone", "positive");
    });

    it("marks itself determinate only when a value is present", () => {
      const { rerender } = render(<Loader data-testid="root" />);
      expect(screen.getByTestId("root")).not.toHaveAttribute("data-determinate");

      rerender(<Loader data-testid="root" value={10} />);
      expect(screen.getByTestId("root")).toHaveAttribute("data-determinate", "");
    });
  });

  /*
   * The distinction the component exists to make.
   *
   * `role="progressbar"` with no `aria-valuenow` is the specified indeterminate form. Defaulting `value`
   * to `0` instead would make every caller announce "nothing done yet" when the truth is "unknown", so
   * these tests exist to pin the absent case rather than the present one.
   */
  describe("determinate and indeterminate", () => {
    it("is a progressbar either way", () => {
      const { rerender } = render(<Loader data-testid="root" />);
      expect(screen.getByTestId("root")).toHaveAttribute("role", "progressbar");

      rerender(<Loader data-testid="root" value={50} />);
      expect(screen.getByTestId("root")).toHaveAttribute("role", "progressbar");
    });

    it("reports the range when determinate", () => {
      render(<Loader data-testid="root" value={40} />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-valuenow", "40");
      expect(root).toHaveAttribute("aria-valuemin", "0");
      expect(root).toHaveAttribute("aria-valuemax", "100");
    });

    it("reports no range at all when indeterminate", () => {
      render(<Loader data-testid="root" />);

      const root = screen.getByTestId("root");
      expect(root).not.toHaveAttribute("aria-valuenow");
      expect(root).not.toHaveAttribute("aria-valuemin");
      expect(root).not.toHaveAttribute("aria-valuemax");
    });

    it("scales the fill to the value", () => {
      render(<Loader data-testid="root" value={40} />);
      expect(percentOf(fillOf(screen.getByTestId("root")))).toBe("40%");
    });

    it("scales against max rather than against a fixed 100", () => {
      render(<Loader data-testid="root" value={3} max={12} />);

      const root = screen.getByTestId("root");
      expect(percentOf(fillOf(root))).toBe("25%");
      expect(root).toHaveAttribute("aria-valuemax", "12");
      expect(root).toHaveAttribute("aria-valuenow", "3");
    });

    it("sets no inline percent when indeterminate, so the sweep rule owns the width", () => {
      render(<Loader data-testid="root" />);
      expect(percentOf(fillOf(screen.getByTestId("root")))).toBe("");
    });
  });

  /*
   * Clamping is done in JS rather than CSS because CSS can correct what is drawn and has no way to
   * correct what is announced — a bar clipped at 100% while announcing 140 would be two different lies
   * about the same number.
   */
  describe("out-of-range values", () => {
    it("clamps above max, and announces the clamped value", () => {
      render(<Loader data-testid="root" value={140} showValue />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-valuenow", "100");
      expect(percentOf(fillOf(root))).toBe("100%");
      expect(root).toHaveTextContent("100%");
    });

    it("clamps below zero", () => {
      render(<Loader data-testid="root" value={-20} showValue />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-valuenow", "0");
      expect(percentOf(fillOf(root))).toBe("0%");
    });

    it("reads a non-finite value as zero rather than rendering NaN", () => {
      render(<Loader data-testid="root" value={Number.NaN} showValue />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-valuenow", "0");
      expect(percentOf(fillOf(root))).toBe("0%");
      expect(root).not.toHaveTextContent("NaN");
    });

    it("does not divide by zero when max is zero", () => {
      render(<Loader data-testid="root" value={5} max={0} showValue />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-valuenow", "0");
      expect(percentOf(fillOf(root))).toBe("0%");
    });
  });

  describe("the accessible name", () => {
    it("defaults to the catalogue's Loading, because an unlabelled progressbar is a failure", () => {
      render(<Loader data-testid="root" />);
      expect(screen.getByTestId("root")).toHaveAttribute("aria-label", "Loading");
    });

    it("uses a supplied label", () => {
      render(<Loader data-testid="root" label="Loading your projects" />);
      expect(screen.getByTestId("root")).toHaveAttribute("aria-label", "Loading your projects");
    });
  });

  /*
   * `showValue` is about sight only. The *accessible* value must not be gated on it, or a progress bar
   * would print its value beside itself while refusing to report it to a screen reader.
   */
  describe("the visible value", () => {
    it("is absent by default", () => {
      render(<Loader data-testid="root" value={40} />);
      expect(screen.getByTestId("root").querySelector(".uir-loader__value")).toBeNull();
    });

    it("shows a rounded percentage when asked", () => {
      render(<Loader data-testid="root" value={40} showValue />);
      expect(screen.getByTestId("root")).toHaveTextContent("40%");
    });

    it("rounds rather than truncating", () => {
      render(<Loader data-testid="root" value={66.6} showValue />);
      expect(screen.getByTestId("root")).toHaveTextContent("67%");
    });

    it("renders no number when indeterminate, even with showValue", () => {
      /*
       * Showing "0%" for an unknown value would be the same lie as defaulting `value` to `0`: it tells the
       * user the work has not started. The row stays empty instead.
       */
      const { container } = render(<Loader data-testid="root" showValue />);

      expect(container.querySelector(".uir-loader__value")).toHaveTextContent("");
    });

    it("shows a valueLabel in place of the number", () => {
      render(
        <Loader data-testid="root" value={20} valueLabel="Step 2 of 7 - verifying" showValue />
      );

      const root = screen.getByTestId("root");
      expect(root).toHaveTextContent("Step 2 of 7 - verifying");
      expect(root).not.toHaveTextContent("20%");
    });

    it("shows a valueLabel even when showValue is off, since it carries the meaning", () => {
      render(<Loader data-testid="root" value={20} valueLabel="Verifying" />);
      expect(screen.getByTestId("root")).toHaveTextContent("Verifying");
    });
  });

  describe("aria-valuetext", () => {
    it("carries the valueLabel so a percentage is not all that is announced", () => {
      render(<Loader data-testid="root" value={20} valueLabel="Step 2 of 7" />);

      expect(screen.getByTestId("root")).toHaveAttribute("aria-valuetext", "Step 2 of 7");
    });

    it("is absent when there is no valueLabel", () => {
      render(<Loader data-testid="root" value={20} showValue />);
      expect(screen.getByTestId("root")).not.toHaveAttribute("aria-valuetext");
    });
  });

  it("renders children below the bar", () => {
    render(
      <Loader data-testid="root" value={50}>
        <span>Uploading 3 of 6 files</span>
      </Loader>
    );

    expect(screen.getByTestId("root")).toHaveTextContent("Uploading 3 of 6 files");
  });

  it("renders the same markup in an RTL subtree", () => {
    renderWithProviders(<Loader data-testid="root" value={40} showValue />, { dir: "rtl" });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("dir", "rtl");
    expect(screen.getByTestId("root")).toHaveAttribute("aria-valuenow", "40");
  });

  it("renders correctly under the high-contrast scheme", () => {
    renderWithProviders(<Loader data-testid="root" value={40} />, { scheme: "high-contrast" });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("data-uir-scheme", "high-contrast");
    expect(screen.getByTestId("root")).toHaveAttribute("aria-valuenow", "40");
  });
});
