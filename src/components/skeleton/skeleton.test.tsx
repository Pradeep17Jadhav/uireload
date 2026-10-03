/**
 * Skeleton tests.
 *
 * The centre of gravity is that the skeleton announces nothing about its own shape. A screen reader
 * reading "grey rectangle" has told the user nothing they did not already know, so the bars are hidden
 * and a status region carries the meaning.
 */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Skeleton } from "uireload/components/skeleton";

describe("Skeleton: rendering", () => {
  it("is a busy status region", () => {
    render(<Skeleton />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
  });

  it("is polite by default, not assertive", () => {
    render(<Skeleton />);

    // A loading placeholder interrupting a screen reader mid-sentence would be absurd.
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("hides every bar from assistive technology", () => {
    const { container } = render(<Skeleton lines={4} />);

    const bars = container.querySelectorAll(".uir-skeleton__bar");
    expect(bars).toHaveLength(4);
    for (const bar of bars) {
      /*
       * The whole point. A screen reader describing each grey rectangle is the failure `role="status"`
       * exists to prevent.
       */
      expect(bar).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("is named Loading by default", () => {
    render(<Skeleton />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Loading");
  });

  it("accepts a custom label", () => {
    render(<Skeleton label="Loading your projects" />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Loading your projects");
  });

  it("renders one line by default", () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelectorAll(".uir-skeleton__bar")).toHaveLength(1);
  });

  it("renders the requested number of lines", () => {
    const { container } = render(<Skeleton lines={6} />);

    expect(container.querySelectorAll(".uir-skeleton__bar")).toHaveLength(6);
    expect(screen.getByRole("status")).toHaveAttribute("data-lines", "6");
  });

  it("clamps lines to at least one", () => {
    const { container } = render(<Skeleton lines={0} />);

    /*
     * Zero lines renders an empty status region that announces nothing and occupies no height — so the
     * content arrives from nothing, which is the layout shift the component exists to prevent.
     */
    expect(container.querySelectorAll(".uir-skeleton__bar")).toHaveLength(1);
  });

  it("shortens only the last line of a multi-line skeleton", () => {
    const { container } = render(<Skeleton lines={3} />);

    const bars = [...container.querySelectorAll<HTMLElement>(".uir-skeleton__bar")];
    expect(bars[0]?.style.inlineSize).toBe("");
    expect(bars[1]?.style.inlineSize).toBe("");
    expect(bars[2]?.style.inlineSize).not.toBe("");
  });

  it("does not shorten a single line, which would leave a stub", () => {
    const { container } = render(<Skeleton lines={1} />);

    const bar = container.querySelector<HTMLElement>(".uir-skeleton__bar");
    expect(bar?.style.inlineSize).toBe("");
  });
});

describe("Skeleton: shape", () => {
  it("renders bars for text and a shape for the others", () => {
    const { container: text } = render(<Skeleton />);
    expect(text.querySelectorAll(".uir-skeleton__bar")).toHaveLength(1);

    const { container: block } = render(<Skeleton variant="rounded" />);
    expect(block.querySelectorAll(".uir-skeleton__bar")).toHaveLength(0);
    expect(block.querySelectorAll(".uir-skeleton__shape")).toHaveLength(1);
  });

  it("renders a circular shape", () => {
    const { container } = render(<Skeleton variant="circular" />);

    expect(screen.getByRole("status")).toHaveAttribute("data-variant", "circular");
    expect(container.querySelector(".uir-skeleton__shape")).toBeInTheDocument();
  });

  it("exposes the variant as a data attribute", () => {
    const { container } = render(<Skeleton variant="rounded" />);

    expect(screen.getByRole("status")).toHaveAttribute("data-variant", "rounded");
    expect(container.querySelector(".uir-skeleton")).not.toHaveClass(/rounded/);
  });

  it("applies a numeric width as pixels", () => {
    render(<Skeleton width={240} />);

    // A number becomes pixels and a string passes through, so `width={240}` and `width="50%"` both
    // work — a component that silently ignored one of them would be the alternative.
    expect(screen.getByRole("status")).toHaveStyle({ inlineSize: "240px" });
  });

  it("passes a CSS length through unchanged", () => {
    render(<Skeleton width="50%" />);

    expect(screen.getByRole("status")).toHaveStyle({ inlineSize: "50%" });
  });

  it("applies height as well as width", () => {
    render(<Skeleton variant="rounded" width="100%" height={120} />);

    expect(screen.getByRole("status")).toHaveStyle({ blockSize: "120px" });
  });

  it("fills its container by default, because a shrinking placeholder stands in for nothing", () => {
    const { container } = render(<Skeleton />);

    const root = container.querySelector(".uir-skeleton") as HTMLElement;
    expect(root.className).toContain("uir-skeleton");
    // The width comes from the stylesheet's `inline-size: 100%`, asserted here so a change is visible.
    expect(root).not.toHaveAttribute("style");
  });
});

describe("Skeleton: animation", () => {
  it("animates by default", () => {
    render(<Skeleton />);

    expect(screen.getByRole("status")).toHaveAttribute("data-animate", "");
  });

  it("does not animate when asked not to", () => {
    render(<Skeleton animate={false} />);

    expect(screen.getByRole("status")).not.toHaveAttribute("data-animate");
  });
});

describe("Skeleton: forwarding", () => {
  it("merges a consumer className onto the root", () => {
    render(<Skeleton className="consumer-class" />);

    expect(screen.getByRole("status")).toHaveClass("uir-skeleton", "consumer-class");
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);

    // The element a consumer measures: a skeleton whose box is not the box the content will occupy is
    // not doing its job.
    expect(ref.current).toBe(screen.getByRole("status"));
  });
});

describe("Skeleton: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Skeleton lines={3} />, { dir: "rtl" });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders in every colour scheme and variant", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      for (const variant of ["text", "rounded", "circular"] as const) {
        const { unmount } = renderWithProviders(<Skeleton variant={variant} lines={2} />, {
          scheme,
        });

        expect(screen.getByRole("status"), `${scheme}/${variant}`).toBeInTheDocument();
        unmount();
      }
    }
  });
});
