/**
 * IconButton tests.
 *
 * The accessibility point of this component is that it has no visible label, so most
 * of these tests are about the accessible name and the interaction contract it
 * inherits from `Button`.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { IconButton } from "uireload/components/icon-button";

/** A stand-in for a consumer's SVG. */
function Glyph({ testId = "glyph" }: { testId?: string }) {
  return (
    <svg data-testid={testId} aria-hidden="true" focusable="false">
      <path d="M0 0h4v4H0z" />
    </svg>
  );
}

describe("IconButton: accessible name", () => {
  it("is named by aria-label", () => {
    render(
      <IconButton aria-label="Delete">
        <Glyph />
      </IconButton>
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("is named by visually hidden text when that is used instead", () => {
    render(
      <IconButton>
        <Glyph />
        <span className="uir-visually-hidden">Delete</span>
      </IconButton>
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});

describe("IconButton: rendering", () => {
  it("renders a native button", () => {
    render(
      <IconButton aria-label="Delete">
        <Glyph />
      </IconButton>
    );

    expect(screen.getByRole("button").tagName).toBe("BUTTON");
  });

  it("defaults to type=button", () => {
    render(
      <IconButton aria-label="Delete">
        <Glyph />
      </IconButton>
    );

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("carries both the Button and IconButton class names", () => {
    render(
      <IconButton aria-label="Delete" data-testid="root" className="consumer">
        <Glyph />
      </IconButton>
    );

    const button = screen.getByTestId("root");
    expect(button).toHaveClass("uir-button");
    expect(button).toHaveClass("uir-icon-button");
    expect(button).toHaveClass("consumer");
  });

  it("wraps its children in a sized icon slot", () => {
    render(
      <IconButton aria-label="Delete" data-testid="root">
        <Glyph />
      </IconButton>
    );

    expect(screen.getByTestId("root").querySelector(".uir-icon-button__icon")).not.toBeNull();
  });

  it("forwards its ref to the button element", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <IconButton ref={ref} aria-label="Delete">
        <Glyph />
      </IconButton>
    );

    expect(ref.current?.tagName).toBe("BUTTON");
  });
});

describe("IconButton: variants, tones and sizes", () => {
  it("defaults to ghost / neutral / md", () => {
    // `ghost`, not Button's `outline`: an icon has no label to read as an affordance,
    // so a border would be the only cue that it is interactive.
    render(
      <IconButton aria-label="Delete" data-testid="root">
        <Glyph />
      </IconButton>
    );

    const button = screen.getByTestId("root");
    expect(button).toHaveAttribute("data-variant", "ghost");
    expect(button).toHaveAttribute("data-tone", "neutral");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it("accepts variant, tone and size", () => {
    render(
      <IconButton variant="outline" tone="danger" size="sm" aria-label="Delete">
        <Glyph />
      </IconButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveAttribute("data-tone", "danger");
    expect(button).toHaveAttribute("data-size", "sm");
  });
});

describe("IconButton: interaction", () => {
  it("fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Delete" onClick={onClick}>
        <Glyph />
      </IconButton>
    );

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is reachable and activatable by keyboard", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Delete" onClick={onClick}>
        <Glyph />
      </IconButton>
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button"));

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Delete" disabled onClick={onClick}>
        <Glyph />
      </IconButton>
    );

    expect(screen.getByRole("button")).toBeDisabled();
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps its name while loading and blocks interaction", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Delete" loading onClick={onClick}>
        <Glyph />
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("IconButton: edge", () => {
  it("has no edge attribute by default", () => {
    render(
      <IconButton aria-label="Delete" data-testid="root">
        <Glyph />
      </IconButton>
    );

    expect(screen.getByTestId("root")).not.toHaveAttribute("data-edge");
  });

  it("records a logical start or end edge", () => {
    const { rerender } = render(
      <IconButton aria-label="Delete" data-testid="root" edge="start">
        <Glyph />
      </IconButton>
    );
    expect(screen.getByTestId("root")).toHaveAttribute("data-edge", "start");

    rerender(
      <IconButton aria-label="Delete" data-testid="root" edge="end">
        <Glyph />
      </IconButton>
    );
    expect(screen.getByTestId("root")).toHaveAttribute("data-edge", "end");
  });
});

describe("IconButton: direction and scheme", () => {
  it("renders and operates inside an RTL subtree", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <IconButton aria-label="حذف" onClick={onClick}>
        <Glyph />
      </IconButton>,
      { dir: "rtl" }
    );

    const button = screen.getByRole("button", { name: "حذف" });
    expect(button.parentElement).toHaveAttribute("dir", "rtl");

    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <IconButton aria-label="Delete" tone="danger">
          <Glyph />
        </IconButton>,
        { scheme }
      );

      expect(screen.getByRole("button", { name: "Delete" }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
