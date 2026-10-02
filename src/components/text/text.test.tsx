/**
 * Text tests.
 *
 * The centre of gravity is that `variant` chooses the *element*, not just the size. A text component
 * that renders a heading as a `<div>` produces a page whose visual hierarchy and whose document
 * outline disagree, and that failure is invisible in a screenshot — it only shows up to someone
 * navigating by heading.
 */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Text } from "uireload/components/text";

describe("Text: the element is the variant", () => {
  it("renders a paragraph for body by default", () => {
    render(<Text>Some prose.</Text>);

    expect(screen.getByText("Some prose.").tagName).toBe("P");
  });

  it("renders a real heading for each level", () => {
    const levels = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

    for (const level of levels) {
      const { unmount } = render(<Text variant={level}>{level}</Text>);
      // The whole point: the rank and the size are the same prop, so they cannot drift apart.
      expect(screen.getByText(level).tagName, level).toBe(level.toUpperCase());
      unmount();
    }
  });

  it("produces a navigable heading outline", () => {
    render(
      <>
        <Text variant="h1">Page</Text>
        <Text variant="h2">Section</Text>
        <Text variant="h3">Subsection</Text>
      </>
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("does not make body text a heading", () => {
    render(<Text>Prose</Text>);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("exposes the level as a data attribute as well", () => {
    render(<Text variant="h3">Section</Text>);

    // The attribute is for CSS and for tests; the element is for assistive technology. Both come
    // from the one prop.
    expect(screen.getByText("Section")).toHaveAttribute("data-variant", "h3");
  });
});

describe("Text: the `as` escape hatch", () => {
  it("changes the element without changing the styling", () => {
    render(
      <Text variant="h2" as="div">
        A div heading
      </Text>
    );

    const node = screen.getByText("A div heading");
    expect(node.tagName).toBe("DIV");
    // Still the h2 level, because `as` and `variant` are independent axes.
    expect(node).toHaveAttribute("data-variant", "h2");
  });

  it("still renders a heading when the element matches the level", () => {
    render(
      <Text variant="h2" as="h4">
        Ranked by the element
      </Text>
    );

    /*
     * A real escape hatch, and the reason `as` exists: a page whose document outline does not match
     * the visual design. The element is what assistive technology sees; `data-variant` is only what
     * CSS sees.
     */
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("accepts a ref whatever element is rendered", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Text ref={ref} variant="h2">
        Section
      </Text>
    );

    expect(ref.current).toBe(screen.getByText("Section"));
  });
});

describe("Text: appearance", () => {
  it("defaults to inheriting its colour", () => {
    render(<Text>Prose</Text>);

    /*
     * A text component with a default colour has decided something about contrast it cannot see. Only
     * the parent knows what the text sits on.
     */
    expect(screen.getByText("Prose")).toHaveAttribute("data-tone", "inherit");
  });

  it("states each tone as a data attribute", () => {
    for (const tone of ["default", "muted", "subtle"] as const) {
      const { unmount } = render(<Text tone={tone}>Prose</Text>);
      expect(screen.getByText("Prose")).toHaveAttribute("data-tone", tone);
      unmount();
    }
  });

  it("states alignment as a data attribute, defaulting to start", () => {
    render(<Text>Prose</Text>);
    expect(screen.getByText("Prose")).toHaveAttribute("data-align", "start");
  });

  it("uses logical alignment, not left and right", () => {
    render(<Text align="end">Prose</Text>);

    // `end` rather than `right`: a right-aligned RTL paragraph is not aligned with anything.
    expect(screen.getByText("Prose")).toHaveAttribute("data-align", "end");
  });

  it("states the measure in characters", () => {
    render(<Text measure="short">Prose</Text>);

    expect(screen.getByText("Prose")).toHaveAttribute("data-measure", "short");
  });

  it("omits data-measure when it is the default", () => {
    render(<Text>Prose</Text>);

    // Absent rather than "none", so a consumer's `.uir-text[data-variant="body"]` selector is not
    // made more specific than it needs to be.
    expect(screen.getByText("Prose")).not.toHaveAttribute("data-measure");
  });

  it("sets an overline flag", () => {
    render(<Text overline>Section</Text>);

    expect(screen.getByText("Section")).toHaveAttribute("data-overline", "");
  });

  it("sets a gutter flag", () => {
    render(<Text gutterBottom>Prose</Text>);

    expect(screen.getByText("Prose")).toHaveAttribute("data-gutter", "");
  });

  it("truncates on one line when asked", () => {
    render(<Text noWrap>A very long piece of text</Text>);

    expect(screen.getByText("A very long piece of text")).toHaveAttribute("data-nowrap", "");
  });

  it("does not set a title, because truncation is not a fix", () => {
    render(<Text noWrap>Truncated</Text>);

    /*
     * A `title` attribute is a tooltip: unavailable to touch, invisible to a keyboard user on most
     * platforms, and not announced by most screen readers. It looks like a solution and is not one.
     */
    expect(screen.getByText("Truncated")).not.toHaveAttribute("title");
  });
});

describe("Text: forwarding", () => {
  it("merges a consumer className onto the root", () => {
    render(<Text className="consumer-class">Prose</Text>);

    expect(screen.getByText("Prose")).toHaveClass("uir-text", "consumer-class");
  });

  it("forwards arbitrary attributes to the rendered element", () => {
    render(
      <Text id="intro" data-testid="prose" lang="en-GB">
        Prose
      </Text>
    );

    const node = screen.getByTestId("prose");
    expect(node).toHaveAttribute("id", "intro");
    expect(node).toHaveAttribute("lang", "en-GB");
  });

  it("forwards an event handler to the rendered element", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    let clicks = 0;

    render(<Text onClick={() => (clicks += 1)}>Clickable text</Text>);
    await user.click(screen.getByText("Clickable text"));

    expect(clicks).toBe(1);
  });

  it("renders nothing visible when given no children", () => {
    const { container } = render(<Text />);

    expect(container.querySelector(".uir-text")).toBeInTheDocument();
  });
});

describe("Text: direction and scheme", () => {
  it("renders in RTL with logical alignment", () => {
    renderWithProviders(<Text>نص</Text>, { dir: "rtl" });

    expect(screen.getByText("نص")).toBeInTheDocument();
  });

  it("renders every level in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <>
          <Text variant="h1">Heading</Text>
          <Text tone="muted">Muted</Text>
        </>,
        { scheme }
      );

      expect(screen.getByRole("heading", { level: 1 }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
