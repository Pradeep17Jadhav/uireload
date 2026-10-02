/**
 * Chip tests.
 *
 * The centre of gravity is `intent`, because that is the whole of the component: it decides which
 * element is rendered, which means which role, which name and how many tab stops exist. A chip that
 * renders the wrong element for its intent looks right and is unusable with a keyboard.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Chip } from "uireload/components/chip";

describe("Chip: rendering", () => {
  it("is a span when it is a static label", () => {
    const { container } = render(<Chip>Weekly</Chip>);

    const root = container.querySelector(".uir-chip") as HTMLElement;
    expect(root.tagName).toBe("SPAN");
  });

  it("has no role at all when static", () => {
    render(<Chip>Weekly</Chip>);

    /*
     * A span with no role is announced by its contents, which is right for a label. Giving it a role
     * would add a thing for a screen reader to say that says nothing.
     */
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("is not focusable when static", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Chip>Weekly</Chip>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("is a button when activatable", () => {
    render(<Chip intent="button">Weekly</Chip>);

    expect(screen.getByRole("button", { name: "Weekly" })).toBeInTheDocument();
  });

  it("is type=button when activatable, never submit", () => {
    render(<Chip intent="button">Weekly</Chip>);

    /*
     * A chip inside a form that defaulted to `submit` would submit the form. Activating a chip is
     * never that.
     */
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("is focusable when activatable", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Chip intent="button">Weekly</Chip>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Weekly");
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("renders the label text", () => {
    render(<Chip>Weekly</Chip>);

    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("renders a leading icon, hidden from assistive technology", () => {
    const { container } = render(<Chip icon={<span data-testid="i" />}>Weekly</Chip>);

    const icon = container.querySelector(".uir-chip__icon") as HTMLElement;
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(
      <Chip size="lg" tone="danger" variant="outlined">
        Weekly
      </Chip>
    );

    const root = container.querySelector(".uir-chip") as HTMLElement;
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-tone", "danger");
    expect(root).toHaveAttribute("data-variant", "outlined");
    expect(root.className).not.toMatch(/lg|danger|outlined/);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Chip className="consumer-class">Weekly</Chip>);

    expect(container.querySelector(".uir-chip")).toHaveClass("uir-chip", "consumer-class");
  });
});

describe("Chip: activation", () => {
  it("calls onClick when activated", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Chip intent="button" onClick={onClick}>
        Weekly
      </Chip>
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("activates with Space and Enter, natively", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Chip intent="button" onClick={onClick}>
        Weekly
      </Chip>
    );

    screen.getByRole("button").focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("calls onClick exactly once, not composed twice", async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    render(
      <Chip
        intent="button"
        onClick={() => {
          order.push("click");
        }}
      >
        Weekly
      </Chip>
    );

    await user.click(screen.getByRole("button"));

    /*
     * A chip has no internal click behaviour to compose with, so it forwards the handler rather than
     * composing it. Composing here would call it twice.
     */
    expect(order).toEqual(["click"]);
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Chip intent="button" disabled onClick={onClick}>
        Weekly
      </Chip>
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("is skipped by Tab when disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Chip intent="button" disabled>
          Weekly
        </Chip>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });
});

describe("Chip: remove intent", () => {
  it("renders a separate remove button, not a nested one", () => {
    render(
      <Chip intent="remove" onRemove={() => undefined}>
        Weekly
      </Chip>
    );

    /*
     * A button inside a button is invalid HTML and an unlabelled one to a screen reader. The two
     * halves are siblings and only the control is focusable.
     */
    const button = screen.getByRole("button");
    expect(button.querySelector("button")).toBeNull();
    expect(button.className).toBe("uir-chip__remove");
  });

  it("names the remove button with the chip's own text", () => {
    render(
      <Chip intent="remove" onRemove={() => undefined}>
        Weekly
      </Chip>
    );

    // "Remove" alone would announce as "Remove button" and say nothing about what is removed.
    expect(screen.getByRole("button", { name: "Weekly Remove" })).toBeInTheDocument();
  });

  it("accepts an explicit remove label", () => {
    render(
      <Chip intent="remove" removeLabel="Remove the Weekly filter" onRemove={() => undefined}>
        Weekly
      </Chip>
    );

    expect(screen.getByRole("button", { name: "Remove the Weekly filter" })).toBeInTheDocument();
  });

  it("falls back to plain Remove for a non-text label", () => {
    render(
      <Chip intent="remove" onRemove={() => undefined}>
        <strong>Weekly</strong>
      </Chip>
    );

    // Arbitrary content yields no usable name to compose with, so the word stands alone.
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("calls onRemove when the control is activated", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Chip intent="remove" onRemove={onRemove}>
        Weekly
      </Chip>
    );

    await user.click(screen.getByRole("button"));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not remove itself, because the list is the consumer's state", async () => {
    const user = userEvent.setup();
    render(
      <Chip intent="remove" onRemove={() => undefined}>
        Weekly
      </Chip>
    );

    await user.click(screen.getByRole("button"));

    /*
     * A component that deleted its own row without telling the caller would leave the model and the
     * view disagreeing. The chip reports and stays.
     */
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("renders no remove control without an onRemove", () => {
    render(<Chip intent="remove">Weekly</Chip>);

    // A cross that does nothing is worse than no cross.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not also fire the chip's own click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(
      <Chip intent="remove" onClick={onClick} onRemove={onRemove}>
        Weekly
      </Chip>
    );

    await user.click(screen.getByRole("button"));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disables the remove control with the chip", () => {
    render(
      <Chip intent="remove" disabled onRemove={() => undefined}>
        Weekly
      </Chip>
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is one tab stop, for the remove control only", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Chip intent="remove" onRemove={() => undefined}>
          Weekly
        </Chip>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    // The focused element is the cross, which is empty by design — it carries the chip's text in its
    // accessible name rather than in its own content.
    expect(document.activeElement).toHaveClass("uir-chip__remove");
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });
});

describe("Chip: controlled use", () => {
  it("removes from a list when the consumer updates it", async () => {
    const user = userEvent.setup();

    function Filters() {
      const [items, setItems] = useState(["Weekly", "Monthly"]);
      return (
        <ul>
          {items.map((item) => (
            <li key={item}>
              <Chip
                intent="remove"
                removeLabel={`Remove ${item}`}
                onRemove={() => setItems((current) => current.filter((x) => x !== item))}
              >
                {item}
              </Chip>
            </li>
          ))}
        </ul>
      );
    }

    render(<Filters />);
    await user.click(screen.getByRole("button", { name: "Remove Weekly" }));

    expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });
});

describe("Chip: naming", () => {
  it("takes an explicit button label for rich content", () => {
    render(
      <Chip intent="button" buttonLabel="Filter by Weekly">
        <strong>Weekly</strong>
      </Chip>
    );

    expect(screen.getByRole("button", { name: "Filter by Weekly" })).toBeInTheDocument();
  });

  it("falls back to the children when they are plain text", () => {
    render(
      <Chip intent="button">
        <strong>Weekly</strong>
      </Chip>
    );

    // The accessible name is derived from the content, which for plain-ish content is fine.
    expect(screen.getByRole("button")).toHaveAccessibleName("Weekly");
  });
});

describe("Chip: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(
      <Chip intent="remove" onRemove={() => undefined}>
        أسبوعي
      </Chip>,
      {
        dir: "rtl",
      }
    );

    expect(screen.getByRole("button", { name: "أسبوعي Remove" })).toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Chip tone="danger">Weekly</Chip>, { scheme });

      expect(screen.getByText("Weekly"), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
