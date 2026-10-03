/**
 * Pagination tests.
 *
 * The centre of gravity is the status region, because it is the only part that is not a row of
 * buttons: without it a screen reader user presses a page number, a pressed state moves and content
 * loads, and they are told nothing.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Pagination } from "uireload/components/pagination";

/** Every page button, by accessible name. */
function pages(): HTMLElement[] {
  return screen.getAllByRole("button", { name: /^Page \d+$/ });
}

describe("Pagination: rendering", () => {
  it("is a named navigation landmark", () => {
    render(<Pagination pageCount={12} page={2} />);

    // A `<nav>` with no name is announced as "navigation" alongside every other one on the page.
    expect(screen.getByRole("navigation", { name: "Pages" })).toBeInTheDocument();
  });

  it("shows one-based page numbers", () => {
    render(<Pagination pageCount={12} page={0} />);

    // The prop is a zero-based index; the user counts from one. A control that shows "0" is a bug the
    // consumer then works around by adding one everywhere.
    expect(pages()[0]).toHaveTextContent("1");
  });

  it("marks the current page with aria-current, not aria-pressed", () => {
    render(<Pagination pageCount={12} page={2} />);

    const current = screen.getByRole("button", { name: "Page 3" });
    expect(current).toHaveAttribute("aria-current", "page");
    /*
     * `aria-current` is a claim about the collection — "this is where you are". `aria-pressed` is a
     * claim about the control — "this button is on" — and it is the wrong one for a page number the
     * user cannot press to get anywhere else.
     */
    expect(current).not.toHaveAttribute("aria-pressed");
  });

  it("marks exactly one page as current", () => {
    render(<Pagination pageCount={12} page={4} />);

    const marked = pages().filter((page) => page.hasAttribute("aria-current"));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent("5");
  });

  it("renders the edge controls", () => {
    render(<Pagination pageCount={12} page={4} />);

    expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last page" })).toBeInTheDocument();
  });

  it("hides the edge controls when asked", () => {
    render(<Pagination pageCount={12} page={4} showEdges={false} />);

    expect(screen.queryByRole("button", { name: "First page" })).not.toBeInTheDocument();
    expect(pages().length).toBeGreaterThan(0);
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(<Pagination pageCount={12} page={1} size="lg" />);

    const root = container.querySelector(".uir-pagination") as HTMLElement;
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root.className).not.toMatch(/lg/);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Pagination pageCount={12} className="consumer-class" />);

    expect(container.querySelector(".uir-pagination")).toHaveClass(
      "uir-pagination",
      "consumer-class"
    );
  });
});

describe("Pagination: when there is nothing to page", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pagination pageCount={1} page={0} />);

    // A control taking space on screen with nothing to say is worse than no control.
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for no pages", () => {
    const { container } = render(<Pagination pageCount={0} page={0} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("Pagination: the window", () => {
  it("shows a window around the current page with both ends", () => {
    render(<Pagination pageCount={20} page={10} />);

    const labels = pages().map((page) => page.textContent);
    // First and last are always one click away, which is the thing a page-number row exists for.
    expect(labels).toContain("1");
    expect(labels).toContain("20");
    expect(labels).toContain("11");
    expect(labels.length).toBeLessThan(20);
  });

  it("compresses the gap and hides it from assistive technology", () => {
    const { container } = render(<Pagination pageCount={20} page={10} />);

    const gap = container.querySelector(".uir-pagination__gap");
    expect(gap).toBeInTheDocument();
    /*
     * The gap is a visual compression of a range. Announcing "ellipsis" announces a piece of CSS, and
     * a screen reader user gets the page count from the status region instead.
     */
    expect(gap).toHaveAttribute("aria-hidden", "true");
  });

  it("does not focus the gap", () => {
    const { container } = render(<Pagination pageCount={20} page={10} />);

    const gap = container.querySelector(".uir-pagination__gap") as HTMLElement;
    expect(gap.tagName).toBe("SPAN");
    expect(gap).not.toHaveAttribute("tabindex");
  });

  it("shows every page when asked", () => {
    render(<Pagination pageCount={12} page={4} siblingCount="all" />);

    expect(pages()).toHaveLength(12);
  });

  it("shows every page when the collection is short", () => {
    render(<Pagination pageCount={4} page={1} />);

    // Below five there is nothing to compress, so the window rule does not apply.
    expect(pages()).toHaveLength(4);
  });

  it("never opens a gap before the first page", () => {
    render(<Pagination pageCount={20} page={0} />);

    // A gap at position zero would render an ellipsis before page 1, which is not a compression of
    // anything.
    expect(pages()[0]).toHaveTextContent("1");
  });
});

describe("Pagination: moving", () => {
  it("reports a page change", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} page={4} onPageChange={onPageChange} />);

    // Page 6 is inside the window at page 5. Page 8 is not rendered at all — from page 5 you can only
    // step, which is the entire reason the ellipsis exists.
    await user.click(screen.getByRole("button", { name: "Page 6" }));

    expect(onPageChange).toHaveBeenCalledWith(5);
    expect(screen.queryByRole("button", { name: "Page 8" })).not.toBeInTheDocument();
  });

  it("steps with next and previous", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} page={4} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(5);

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("jumps with first and last", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} page={4} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "First page" }));
    expect(onPageChange).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole("button", { name: "Last page" }));
    expect(onPageChange).toHaveBeenCalledWith(11);
  });

  it("does not report a click on the current page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} page={4} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Page 5" }));

    // A control that reports a change it did not make is a control a consumer has to defensively
    // filter.
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("disables previous on the first page", () => {
    render(<Pagination pageCount={12} page={0} />);

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).not.toBeDisabled();
  });

  it("disables next on the last page", () => {
    render(<Pagination pageCount={12} page={11} />);

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).not.toBeDisabled();
  });

  it("clamps a page beyond the end", () => {
    render(<Pagination pageCount={12} page={99} />);

    // A consumer whose total shrank under a stale index would otherwise get a control with nothing
    // pressed and every button pointing at a page that does not exist.
    expect(screen.getByRole("button", { name: "Page 12" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} page={4} disabled onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Page 6" }));

    expect(onPageChange).not.toHaveBeenCalled();
  });
});

describe("Pagination: announcing", () => {
  it("states the position in a live region", () => {
    render(<Pagination pageCount={12} page={2} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Page 3 of 12");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("updates the position when the page changes", () => {
    const { rerender } = render(<Pagination pageCount={12} page={2} />);
    rerender(<Pagination pageCount={12} page={3} />);

    expect(screen.getByRole("status")).toHaveTextContent("Page 4 of 12");
  });

  it("is polite, never assertive", () => {
    render(<Pagination pageCount={12} page={2} />);

    // A page change is announced after whatever the user is reading rather than cutting it off.
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("can be turned off", () => {
    render(<Pagination announcePosition={false} pageCount={12} page={2} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("accepts custom labels", () => {
    render(
      <Pagination
        pageCount={12}
        page={2}
        pageLabel="Side"
        nextLabel="Next side"
        previousLabel="Previous side"
        firstLabel="First side"
        lastLabel="Last side"
      />
    );

    expect(screen.getByRole("button", { name: "Next side" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Side 3" })).toBeInTheDocument();
  });
});

describe("Pagination: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Pagination pageCount={12} page={2} />, { dir: "rtl" });

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Pagination pageCount={12} page={4} />, { scheme });

      expect(screen.getByRole("navigation", { name: "Pages" }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
