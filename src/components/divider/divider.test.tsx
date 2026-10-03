/**
 * Divider tests.
 *
 * The centre of gravity is the accessibility tree, because a divider renders identically whether or
 * not it is in it — which means a rule that should be announced and is not looks exactly the same on
 * screen as one that should not be.
 */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Divider } from "uireload/components/divider";

describe("Divider: rendering", () => {
  it("is a separator by default", () => {
    render(<Divider />);

    /*
     * `role="separator"` is the only role it ever needs, and its absence is invisible: a plain div and
     * a separator look identical and are announced completely differently.
     */
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("is horizontal by default and does not say so", () => {
    render(<Divider />);

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
    // `horizontal` is the default value; stating it is redundant markup on every rule in an app.
    expect(separator).not.toHaveAttribute("aria-orientation");
  });

  it("states aria-orientation when vertical", () => {
    render(<Divider orientation="vertical" />);

    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(<Divider orientation="vertical" weight="thick" />);

    const root = container.querySelector(".uir-divider") as HTMLElement;
    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(root).toHaveAttribute("data-weight", "thick");
    expect(root.className).not.toMatch(/vertical|thick/);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Divider className="consumer-class" />);

    expect(container.querySelector(".uir-divider")).toHaveClass("uir-divider", "consumer-class");
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Divider ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("separator"));
  });

  it("forwards arbitrary attributes", () => {
    render(<Divider id="rule" data-testid="d" />);

    expect(screen.getByRole("separator")).toHaveAttribute("id", "rule");
  });
});

describe("Divider: decorative", () => {
  it("is removed from the tree when decorative", () => {
    render(<Divider decorative />);

    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("uses role=presentation rather than aria-hidden", () => {
    const { container } = render(<Divider decorative />);

    /*
     * `aria-hidden` still lets some screen readers announce a hidden element when focus lands inside
     * it. The role-based way to remove decoration is to say it has no role at all.
     */
    const root = container.querySelector(".uir-divider") as HTMLElement;
    expect(root).toHaveAttribute("role", "presentation");
    expect(root).not.toHaveAttribute("aria-hidden");
  });

  it("renders visibly either way, which is the trap", () => {
    const { container: plain } = render(<Divider />);
    const { container: decorative } = render(<Divider decorative />);

    const a = plain.querySelector(".uir-divider") as HTMLElement;
    const b = decorative.querySelector(".uir-divider") as HTMLElement;

    // Same tag, same classes, same data attributes — the only difference is the role.
    expect(b.tagName).toBe(a.tagName);
    expect(b.className).toBe(a.className);
    expect(b.getAttribute("data-orientation")).toBe(a.getAttribute("data-orientation"));
  });
});

describe("Divider: label", () => {
  it("renders the label inside the separator", () => {
    render(<Divider label="or" />);

    expect(screen.getByRole("separator")).toHaveTextContent("or");
  });

  it("part of the separator's accessible name", () => {
    render(<Divider label="or continue with" />);

    // Inside the separator, not beside it — a label in a sibling is loose text the reader meets first.
    expect(screen.getByRole("separator")).toHaveAccessibleName("or continue with");
  });

  it("coerces to horizontal, because a vertical labelled rule has nowhere to put the text", () => {
    const { container } = render(<Divider orientation="vertical" label="or" />);

    const root = container.querySelector(".uir-divider") as HTMLElement;
    /*
     * The type says the combination does not exist. Coercing rather than throwing means a consumer
     * who flips `orientation` with a label present gets a usable rule; the coercion is silent, so it is
     * asserted here rather than left to be discovered.
     */
    expect(root).toHaveAttribute("data-orientation", "horizontal");
    expect(root).toHaveAttribute("data-labelled", "");
  });

  it("renders no label element when there is no label", () => {
    const { container } = render(<Divider />);

    expect(container.querySelector(".uir-divider__label")).toBeNull();
    expect(container.querySelector(".uir-divider")).not.toHaveAttribute("data-labelled");
  });
});

describe("Divider: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Divider orientation="vertical" />, { dir: "rtl" });

    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Divider label="or" />, { scheme });

      expect(screen.getByRole("separator"), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
