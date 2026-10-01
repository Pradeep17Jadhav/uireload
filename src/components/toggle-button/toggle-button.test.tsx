/**
 * ToggleButton tests.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { ToggleButton } from "uireload/components/toggle-button";

describe("ToggleButton: pressed state", () => {
  it("is a button with aria-pressed by default", () => {
    render(<ToggleButton>Bold</ToggleButton>);

    const button = screen.getByRole("button", { name: "Bold" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    // `undefined` means uncontrolled, so there must be no `data-pressed` at rest.
    expect(button).not.toHaveAttribute("data-pressed");
  });

  it("reflects defaultPressed", () => {
    render(<ToggleButton defaultPressed>Bold</ToggleButton>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles on click when uncontrolled", async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Bold</ToggleButton>);

    const button = screen.getByRole("button", { name: "Bold" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles with Space, as a button must", async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Bold</ToggleButton>);

    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("stays controlled when `pressed` is provided", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <ToggleButton pressed={false} onPressedChange={onPressedChange}>
        Bold
      </ToggleButton>
    );

    await user.click(screen.getByRole("button"));

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("marks state for CSS with data-pressed", () => {
    render(
      <ToggleButton defaultPressed data-testid="root">
        Bold
      </ToggleButton>
    );
    expect(screen.getByTestId("root")).toHaveAttribute("data-pressed", "");
  });

  it("lets a consumer veto the toggle with preventDefault", async () => {
    const user = userEvent.setup();
    render(<ToggleButton onClick={(event) => event.preventDefault()}>Bold</ToggleButton>);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });
});

describe("ToggleButton: radio role", () => {
  it("uses aria-checked and drops aria-pressed when it is a radio", () => {
    render(
      <ToggleButton role="radio" defaultPressed>
        Grid
      </ToggleButton>
    );

    const radio = screen.getByRole("radio", { name: "Grid" });
    expect(radio).toHaveAttribute("aria-checked", "true");
    // Emitting both is an ARIA conflict: `aria-pressed` is ignored on a radio.
    expect(radio).not.toHaveAttribute("aria-pressed");
  });

  it("uses aria-pressed when it is a plain button", () => {
    render(
      <ToggleButton role="button" defaultPressed>
        Grid
      </ToggleButton>
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ToggleButton: variants and states", () => {
  it("inherits Button's default variant and tone", () => {
    render(<ToggleButton data-testid="root">Bold</ToggleButton>);

    const button = screen.getByTestId("root");
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveAttribute("data-tone", "neutral");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it("accepts variant, tone and size", () => {
    render(
      <ToggleButton variant="solid" tone="accent" size="lg">
        Bold
      </ToggleButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "solid");
    expect(button).toHaveAttribute("data-tone", "accent");
    expect(button).toHaveAttribute("data-size", "lg");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(<ToggleButton disabled>Bold</ToggleButton>);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("renders a start icon", () => {
    render(<ToggleButton startIcon={<span data-testid="icon" />}>Bold</ToggleButton>);

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});

describe("ToggleButton: direction and scheme", () => {
  it("renders and toggles inside an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ToggleButton>غامق</ToggleButton>, { dir: "rtl" });

    const button = screen.getByRole("button", { name: "غامق" });
    expect(button.parentElement).toHaveAttribute("dir", "rtl");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps its pressed state in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<ToggleButton defaultPressed>Bold</ToggleButton>, {
        scheme,
      });

      expect(screen.getByRole("button"), scheme).toHaveAttribute("aria-pressed", "true");
      unmount();
    }
  });
});
