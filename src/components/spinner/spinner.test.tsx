import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Spinner } from "uireload/components/spinner";

describe("Spinner", () => {
  it("renders a track and an arc, because one ring cannot show rotation", () => {
    const { container } = render(<Spinner data-testid="root" />);

    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(container.querySelector(".uir-spinner__track")).not.toBeNull();
    expect(container.querySelector(".uir-spinner__arc")).not.toBeNull();
  });

  it("forwards native attributes to the root", () => {
    render(<Spinner data-testid="root" id="my-spinner" lang="en" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("id", "my-spinner");
    expect(root).toHaveAttribute("lang", "en");
  });

  it("merges a consumer className rather than replacing ours", () => {
    render(<Spinner data-testid="root" className="consumer-class" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveClass("uir-spinner");
    expect(root).toHaveClass("consumer-class");
  });

  it("forwards its ref to the root element", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} data-testid="root" />);

    expect(ref.current).toBe(screen.getByTestId("root"));
  });

  describe("state is exposed as data attributes, not class names", () => {
    it("defaults size, thickness and tone", () => {
      render(<Spinner data-testid="root" />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("data-size", "md");
      expect(root).toHaveAttribute("data-thickness", "md");
      expect(root).toHaveAttribute("data-tone", "accent");
    });

    it("exposes each supplied value", () => {
      render(<Spinner data-testid="root" size="lg" thickness="thick" tone="positive" />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("data-size", "lg");
      expect(root).toHaveAttribute("data-thickness", "thick");
      expect(root).toHaveAttribute("data-tone", "positive");
    });

    it("keeps the state out of the class name", () => {
      render(<Spinner data-testid="root" size="lg" tone="danger" />);

      const root = screen.getByTestId("root");
      expect(root.className).not.toMatch(/size|tone|thickness/);
    });

    it("covers every tone in the shared vocabulary", () => {
      for (const tone of ["neutral", "accent", "positive", "danger"] as const) {
        const { unmount } = render(<Spinner tone={tone} />);
        expect(document.querySelector(`.uir-spinner[data-tone="${tone}"]`)).not.toBeNull();
        unmount();
      }
    });
  });

  /*
   * The load-bearing pair of tests in this suite.
   *
   * `label` is not a caption: it decides whether the spinner reaches the accessibility tree at all. An
   * unlabelled `progressbar` is an accessibility failure, so the decorative form must be *absent* from
   * the tree rather than present and nameless — and `aria-hidden` is how it is absent, because
   * `display: none` would be overridden by any consumer rule and `visibility: hidden` is not honoured
   * consistently by assistive technology.
   */
  describe("accessibility form", () => {
    it("is hidden from assistive technology when no label is given", () => {
      render(<Spinner data-testid="root" />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-hidden", "true");
      expect(root).not.toHaveAttribute("role");
    });

    it("becomes a labelled progressbar when a label is given", () => {
      render(<Spinner data-testid="root" label="Loading your projects" />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("role", "progressbar");
      expect(root).toHaveAttribute("aria-label", "Loading your projects");
      expect(root).not.toHaveAttribute("aria-hidden");
    });

    it("carries no aria-valuenow, because the value is unknown", () => {
      render(<Spinner data-testid="root" label="Loading" />);

      /*
       * `role="progressbar"` with no `aria-valuenow` is the specified indeterminate form. Reporting `0`
       * would claim "nothing done yet", which is a different fact from "we do not know".
       */
      expect(screen.getByTestId("root")).not.toHaveAttribute("aria-valuenow");
    });

    it("carries no aria-valuetext either, for the same reason", () => {
      render(<Spinner data-testid="root" label="Loading" />);

      expect(screen.getByTestId("root")).not.toHaveAttribute("aria-valuetext");
    });

    it("treats an empty label as decorative rather than as an unlabelled progressbar", () => {
      /*
       * `label=""` is the trap. Falsy, so a naive `label ? ... : ...` check would fall through to the
       * labelled branch and produce a progressbar whose accessible name is the empty string — the exact
       * failure the prop exists to prevent. Decorative is the safe reading of "no name given".
       */
      render(<Spinner data-testid="root" label="" />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-hidden", "true");
      expect(root).not.toHaveAttribute("role");
    });

    it("treats a whitespace-only label as decorative", () => {
      render(<Spinner data-testid="root" label="   " />);

      const root = screen.getByTestId("root");
      expect(root).toHaveAttribute("aria-hidden", "true");
      expect(root).not.toHaveAttribute("role");
    });

    it("trims a label before using it as the accessible name", () => {
      render(<Spinner data-testid="root" label="  Loading your projects  " />);

      expect(screen.getByTestId("root")).toHaveAttribute("aria-label", "Loading your projects");
    });
  });

  it("has no keyboard interaction", () => {
    /*
     * A spinner has no tab stop. Asserted against the rendered DOM rather than by inspecting the source,
     * because "there is nothing focusable" is a claim about the page, not about the markup.
     */
    const { container } = render(<Spinner label="Loading" />);

    expect(container.querySelectorAll("button, a, input, [tabindex]")).toHaveLength(0);
  });

  it("renders the same markup in an RTL subtree", () => {
    renderWithProviders(<Spinner data-testid="root" label="Loading" />, { dir: "rtl" });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("dir", "rtl");
    expect(screen.getByTestId("root")).toHaveAttribute("role", "progressbar");
  });

  it("renders correctly under the high-contrast scheme", () => {
    renderWithProviders(<Spinner data-testid="root" label="Loading" />, {
      scheme: "high-contrast",
    });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("data-uir-scheme", "high-contrast");
    expect(screen.getByTestId("root")).toHaveAttribute("data-tone", "accent");
  });
});
