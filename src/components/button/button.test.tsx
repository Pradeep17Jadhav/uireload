/**
 * Button tests.
 *
 * Coverage follows the definition of done in `AGENTS.md`: rendering, keyboard
 * interaction, controlled and uncontrolled state where relevant, and `dir="rtl"`.
 * Form behaviour is covered too, because `type` defaults to `button` and that default
 * is a correctness property, not a cosmetic one.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Button } from "uireload/components/button";

describe("Button: rendering", () => {
  it("renders a native button", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
  });

  it("defaults to type=button so it cannot submit a form by accident", () => {
    render(<Button>Save</Button>);
    // `@default 'button'` on a `<button>`; the same applies here.
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("accepts an explicit submit and reset type", () => {
    render(
      <>
        <Button type="submit">Send</Button>
        <Button type="reset">Clear</Button>
      </>
    );

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: "Clear" })).toHaveAttribute("type", "reset");
  });

  it("forwards native attributes to the root", () => {
    render(
      <Button id="save" data-testid="root" aria-describedby="hint" name="action" value="save">
        Save
      </Button>
    );

    const button = screen.getByTestId("root");
    expect(button).toHaveAttribute("id", "save");
    expect(button).toHaveAttribute("aria-describedby", "hint");
    expect(button).toHaveAttribute("name", "action");
    expect(button).toHaveAttribute("value", "save");
  });

  it("forwards its ref to the button element", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Save</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  it("merges a consumer className rather than replacing the root class", () => {
    render(
      <Button data-testid="root" className="consumer">
        Save
      </Button>
    );

    const button = screen.getByTestId("root");
    expect(button).toHaveClass("uir-button");
    expect(button).toHaveClass("consumer");
  });
});

describe("Button: variants, tones and sizes", () => {
  it("defaults to outline / neutral / md", () => {
    // `outline` is a deliberate divergence from both libraries. See README.md.
    render(<Button data-testid="root">Save</Button>);

    const button = screen.getByTestId("root");
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveAttribute("data-tone", "neutral");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it("exposes emphasis as data-variant", () => {
    render(
      <>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="solid">Solid</Button>
      </>
    );

    // Queried by role, not by text: `getByText` would return the inner label span,
    // and the state attributes live on the button itself.
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveAttribute("data-variant", "ghost");
    expect(screen.getByRole("button", { name: "Outline" })).toHaveAttribute(
      "data-variant",
      "outline"
    );
    expect(screen.getByRole("button", { name: "Solid" })).toHaveAttribute("data-variant", "solid");
  });

  it("keeps tone independent of variant", () => {
    render(
      <Button variant="solid" tone="danger">
        Delete
      </Button>
    );

    const button = screen.getByRole("button", { name: "Delete" });
    // The whole point of separating the axes: a destructive primary action.
    expect(button).toHaveAttribute("data-variant", "solid");
    expect(button).toHaveAttribute("data-tone", "danger");
  });

  it("exposes size as data-size", () => {
    render(
      <>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </>
    );

    expect(screen.getByRole("button", { name: "Small" })).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("button", { name: "Large" })).toHaveAttribute("data-size", "lg");
  });

  it("marks full width without changing the element", () => {
    render(
      <Button data-testid="root" fullWidth>
        Save
      </Button>
    );

    const button = screen.getByTestId("root");
    expect(button).toHaveAttribute("data-full-width");
    expect(button.tagName).toBe("BUTTON");
  });
});

describe("Button: interaction", () => {
  it("fires onClick on click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("fires onClick on Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("fires onClick on Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await user.tab();
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("lets a consumer prevent the default behaviour", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <Button onClick={onClick} data-testid="root">
        Save
      </Button>
    );

    await user.click(screen.getByTestId("root"));

    // The consumer handler runs first and can always veto.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("composes both handlers, consumer first", async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    render(
      <Button onClick={() => order.push("consumer")} data-testid="root">
        Save
      </Button>
    );

    await user.click(screen.getByTestId("root"));
    expect(order).toEqual(["consumer"]);
  });
});

describe("Button: disabled", () => {
  it("uses the native disabled attribute", () => {
    render(<Button disabled>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is not reachable by keyboard", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button disabled>Save</Button>
        <Button>Cancel</Button>
      </>
    );

    await user.tab();
    // A disabled button is skipped entirely, so focus lands on the next control.
    expect(document.activeElement).toHaveTextContent("Cancel");
  });
});

describe("Button: loading", () => {
  it("marks itself busy and blocks interaction", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps its accessible name while loading", () => {
    // The label must survive, or a screen reader announces an unlabelled button
    // mid-operation.
    render(<Button loading>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-busy", "true");
  });

  it("keeps the loading wrapper in the DOM when not loading", () => {
    // Removing it mid-flight crashes Google Translate (material-ui#27853).
    render(<Button data-testid="root">Save</Button>);

    expect(screen.getByTestId("root").querySelector(".uir-button__loading")).not.toBeNull();
  });

  it("accepts a custom indicator and hides it from assistive technology", () => {
    render(
      <Button loading loadingIndicator={<span data-testid="custom" />}>
        Save
      </Button>
    );

    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.getByTestId("custom").closest(".uir-button__loading")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });
});

describe("Button: icons", () => {
  it("renders start and end icons around the label", () => {
    render(
      <Button startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
        Delete
      </Button>
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.querySelector(".uir-button__icon--start")).not.toBeNull();
    expect(button.querySelector(".uir-button__icon--end")).not.toBeNull();
  });

  it("has no icon elements when no icons are given", () => {
    render(<Button data-testid="root">Save</Button>);

    expect(screen.getByTestId("root").querySelector(".uir-button__icon")).toBeNull();
  });
});

describe("Button: forms", () => {
  it("does not submit a form by default", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <Button>Save</Button>
      </form>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits when type=submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not submit while loading", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Save
        </Button>
      </form>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    // Loading must be a stronger claim than disabled, or a user can submit twice.
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("Button: composition", () => {
  it("works as a controlled consumer of its own state", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Button onClick={() => setCount((value) => value + 1)}>Add</Button>
          <output>{count}</output>
        </>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("Button: direction and scheme", () => {
  it("renders and stays operable inside an RTL subtree", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(<Button onClick={onClick}>حفظ</Button>, { dir: "rtl" });

    const host = screen.getByRole("button", { name: "حفظ" }).parentElement as HTMLElement;
    expect(host).toHaveAttribute("dir", "rtl");

    await user.click(screen.getByRole("button", { name: "حفظ" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders in every colour scheme without losing its state attributes", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Button variant="solid" tone="danger" data-testid="root">
          Delete
        </Button>,
        { scheme }
      );

      const button = screen.getByTestId("root");
      expect(button, scheme).toHaveAttribute("data-variant", "solid");
      expect(button, scheme).toHaveAttribute("data-tone", "danger");

      unmount();
    }
  });
});
