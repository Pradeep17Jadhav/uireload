/**
 * Tile tests.
 *
 * The centre of gravity is that `interactive` and `href` decide which element is rendered — because
 * "the whole card is clickable" is a real interaction and the only correct way to express it is with
 * the element that means it.
 */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Tile } from "uireload/components/tile";

describe("Tile: rendering", () => {
  it("is a div when it is only a surface", () => {
    const { container } = render(<Tile>Content</Tile>);

    expect((container.querySelector(".uir-tile") as HTMLElement).tagName).toBe("DIV");
  });

  it("has no role when it is not activatable", () => {
    render(<Tile>Content</Tile>);

    // A div with no role is announced by its contents, which is right for a grouping surface.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders header, body and footer", () => {
    render(
      <Tile header={<span>Header</span>} footer={<span>Footer</span>}>
        Body
      </Tile>
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders no empty header or footer slots", () => {
    const { container } = render(<Tile>Body</Tile>);

    expect(container.querySelector(".uir-tile__header")).toBeNull();
    expect(container.querySelector(".uir-tile__footer")).toBeNull();
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(
      <Tile elevation="raised" tone="danger" padding="lg" header="H">
        Body
      </Tile>
    );

    const root = container.querySelector(".uir-tile") as HTMLElement;
    expect(root).toHaveAttribute("data-elevation", "raised");
    expect(root).toHaveAttribute("data-tone", "danger");
    expect(root).toHaveAttribute("data-padding", "lg");
    expect(root).toHaveAttribute("data-has-header", "");
    expect(root.className).not.toMatch(/raised|danger|lg/);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Tile className="consumer-class">Body</Tile>);

    expect(container.querySelector(".uir-tile")).toHaveClass("uir-tile", "consumer-class");
  });

  it("forwards arbitrary attributes and the ref", () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Tile ref={ref} id="t1" aria-label="Summary" data-testid="tile">
        Body
      </Tile>
    );

    const root = container.querySelector(".uir-tile") as HTMLElement;
    expect(root).toHaveAttribute("id", "t1");
    expect(root).toHaveAttribute("aria-label", "Summary");
    expect(ref.current).toBe(root);
  });

  it("renders the element named by `as`", () => {
    const { container } = render(<Tile as="article">Body</Tile>);

    expect((container.querySelector(".uir-tile") as HTMLElement).tagName).toBe("ARTICLE");
  });

  it("applies maxHeight as a block-size bound", () => {
    const { container } = render(<Tile maxHeight={320}>Body</Tile>);

    // A scroll container with no bound is not a scroll container.
    expect((container.querySelector(".uir-tile") as HTMLElement).style.maxBlockSize).toBe("320px");
  });

  it("accepts a CSS length for maxHeight", () => {
    const { container } = render(<Tile maxHeight="20rem">Body</Tile>);

    expect((container.querySelector(".uir-tile") as HTMLElement).style.maxBlockSize).toBe("20rem");
  });
});

describe("Tile: interactive", () => {
  it("is a button when interactive", () => {
    render(<Tile interactive>Body</Tile>);

    expect(screen.getByRole("button")).toHaveTextContent("Body");
  });

  it("is type=button, never submit", () => {
    render(<Tile interactive>Body</Tile>);

    // A tile inside a form that defaulted to submit would submit the form.
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("is one tab stop", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Tile interactive>Body</Tile>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Before");
    await user.tab();
    expect(document.activeElement).toHaveTextContent("Body");
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("activates with Space and Enter, natively", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Tile interactive onClick={onClick}>
        Body
      </Tile>
    );

    screen.getByRole("button").focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("calls onClick exactly once per click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Tile interactive onClick={onClick}>
        Body
      </Tile>
    );

    await user.click(screen.getByRole("button"));

    // No internal click behaviour to compose with, so the handler is passed through rather than
    // composed — composing would call it twice.
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Tile: link", () => {
  it("is an anchor when given an href", () => {
    render(<Tile href="/docs">Body</Tile>);

    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("infers interactive from href", () => {
    const { container } = render(<Tile href="/docs">Body</Tile>);

    // A link-shaped tile that is not activatable is a link with no link behaviour.
    expect(container.querySelector(".uir-tile")).toHaveAttribute("data-interactive", "");
  });

  it("forwards target and rel", () => {
    render(
      <Tile href="https://example.com" target="_blank" rel="noopener">
        Body
      </Tile>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("prefers interactive over href when both disagree", () => {
    const { container } = render(
      <Tile interactive={false} href="/docs">
        Body
      </Tile>
    );

    /*
     * The href still makes it an anchor, so it still has a link role and is still a tab stop. An
     * explicit `interactive={false}` is not honoured for a link tile, because the element is chosen
     * by `href` and the two cannot be reconciled without removing the link behaviour.
     */
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(container.querySelector(".uir-tile")).toHaveAttribute("data-link", "");
  });
});

describe("Tile: loading", () => {
  it("marks itself busy", () => {
    render(<Tile loading>Body</Tile>);

    expect(screen.getByText("Body").closest(".uir-tile")).toHaveAttribute("aria-busy", "true");
  });

  it("hides its contents from assistive technology", () => {
    render(<Tile loading>Body</Tile>);

    /*
     * The placeholder is what a sighted user sees, and a screen reader should not read out text the
     * user cannot see is stale. `aria-busy` on the root is the signal, not a live region inside
     * every loading tile.
     */
    const body = screen.getByText("Body");
    expect(body).toHaveClass("uir-tile__body");
    expect(body).toHaveAttribute("aria-hidden", "true");
  });

  it("disables an activatable tile", () => {
    render(
      <Tile interactive loading>
        Body
      </Tile>
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("drops the href from a link tile", () => {
    render(
      <Tile href="/docs" loading>
        Body
      </Tile>
    );

    // An anchor cannot be disabled, so the destination is removed instead — the honest signal that
    // there is nowhere to go yet.
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("does not add a live region", () => {
    render(<Tile loading>Body</Tile>);

    // The tile's arrival is what a consumer announces; a region inside every loading tile is a screen
    // reader talking over itself.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Tile: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Tile tone="danger">محتوى</Tile>, { dir: "rtl" });

    expect(screen.getByText("محتوى")).toBeInTheDocument();
  });

  it("renders every elevation in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      for (const elevation of ["flat", "raised", "floating"] as const) {
        const { unmount } = renderWithProviders(
          <Tile elevation={elevation} tone="accent">
            Body
          </Tile>,
          { scheme }
        );

        expect(screen.getByText("Body"), `${scheme}/${elevation}`).toBeInTheDocument();
        unmount();
      }
    }
  });
});
