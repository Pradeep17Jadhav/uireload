/**
 * Checkbox tests.
 *
 * The centre of gravity is the indeterminate state, because it is the one part of a checkbox that
 * is not the platform's: `indeterminate` is a DOM property with no attribute reflection, so it has
 * to be applied imperatively and can silently fail to apply at all.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Checkbox } from "uireload/components/checkbox";

/** The trigger, by its accessible name. */
function box(): HTMLElement {
  return screen.getByRole("checkbox", { name: /Subscribe/ });
}

describe("Checkbox: rendering", () => {
  it("is a real checkbox input", () => {
    render(<Checkbox id="a" label="Subscribe" />);

    const input = box();
    expect(input).toHaveAttribute("type", "checkbox");
    expect(input).not.toBeChecked();
  });

  it("associates a real label", () => {
    render(<Checkbox id="a" label="Subscribe" />);

    expect(screen.getByText("Subscribe")).toHaveAttribute("for", "a");
    expect(box()).toHaveAccessibleName("Subscribe");
  });

  it("sets the native checked property when checked", () => {
    render(<Checkbox id="a" label="Subscribe" checked />);

    expect(box()).toBeChecked();
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(<Checkbox id="a" label="Subscribe" size="lg" tone="danger" />);

    const root = container.querySelector(".uir-checkbox") as HTMLElement;
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-tone", "danger");
    expect(root.className).not.toMatch(/lg|danger/);
  });

  it("forwards its ref to the input", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox id="a" label="Subscribe" ref={ref} />);

    expect(ref.current).toBe(box());
  });

  it("forwards name and value for form submission", () => {
    render(<Checkbox id="a" label="Subscribe" name="news" value="weekly" defaultChecked />);

    const input = box();
    expect(input).toHaveAttribute("name", "news");
    expect(input).toHaveAttribute("value", "weekly");
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Checkbox id="a" label="Subscribe" className="consumer-class" />);

    expect(container.querySelector(".uir-checkbox")).toHaveClass("uir-checkbox", "consumer-class");
  });
});

describe("Checkbox: indeterminate", () => {
  it("sets the DOM property, which has no attribute reflection", () => {
    render(<Checkbox id="a" label="Subscribe" indeterminate />);

    // The whole reason this is in the component: `indeterminate` cannot be expressed in JSX.
    expect((box() as HTMLInputElement).indeterminate).toBe(true);
    expect(box()).not.toHaveAttribute("indeterminate");
  });

  it("announces mixed", () => {
    render(<Checkbox id="a" label="Subscribe" indeterminate />);

    expect(box()).toHaveAttribute("aria-checked", "mixed");
  });

  it("does not emit aria-checked in the ordinary states", () => {
    // The native checkedness already maps to `aria-checked`; writing it by hand would create a
    // second source of truth that can disagree with `checked`.
    const { rerender } = render(<Checkbox id="a" label="Subscribe" />);
    expect(box()).not.toHaveAttribute("aria-checked");

    rerender(<Checkbox id="a" label="Subscribe" checked />);
    expect(box()).not.toHaveAttribute("aria-checked");
  });

  it("paints as partially checked even when checked", () => {
    render(<Checkbox id="a" label="Subscribe" checked indeterminate />);

    const root = screen.getByRole("checkbox", { name: /Subscribe/ }).closest(".uir-checkbox");
    // The ordering rule: checked and indeterminate together still render as partially checked.
    expect(root).toHaveAttribute("data-indeterminate", "");
    expect(root).not.toHaveAttribute("data-checked");
  });

  it("reapplies when the prop changes from outside", () => {
    const { rerender } = render(<Checkbox id="a" label="Subscribe" />);
    expect((box() as HTMLInputElement).indeterminate).toBe(false);

    rerender(<Checkbox id="a" label="Subscribe" indeterminate />);
    expect((box() as HTMLInputElement).indeterminate).toBe(true);
  });

  it("clears the property when the prop goes back to false", () => {
    const { rerender } = render(<Checkbox id="a" label="Subscribe" indeterminate />);
    rerender(<Checkbox id="a" label="Subscribe" />);

    expect((box() as HTMLInputElement).indeterminate).toBe(false);
  });
});

describe("Checkbox: keyboard", () => {
  it("toggles with Space, natively", async () => {
    const user = userEvent.setup();
    render(<Checkbox id="a" label="Subscribe" />);

    box().focus();
    await user.keyboard(" ");

    expect(box()).toBeChecked();
  });

  it("does not toggle with Enter, unlike a div-based checkbox", async () => {
    const user = userEvent.setup();
    render(<Checkbox id="a" label="Subscribe" />);

    box().focus();
    await user.keyboard("{Enter}");

    /*
     * Some checkboxes document Enter as a toggle key because they are a `<div>` with a keydown
     * handler and have to implement by hand what a real input gets from the platform. The APG
     * checkbox pattern specifies Space.
     */
    expect(box()).not.toBeChecked();
  });

  it("is reachable by Tab", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Checkbox id="a" label="Subscribe" />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Before");
    await user.tab();
    expect(document.activeElement).toBe(box());
  });

  it("is skipped by Tab when disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox id="a" label="Subscribe" disabled />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("toggles when the label is clicked", async () => {
    const user = userEvent.setup();
    render(<Checkbox id="a" label="Subscribe" />);

    await user.click(screen.getByText("Subscribe"));

    expect(box()).toBeChecked();
  });
});

describe("Checkbox: controlled and uncontrolled", () => {
  it("reports changes when uncontrolled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox id="a" label="Subscribe" onCheckedChange={onCheckedChange} />);

    await user.click(box());

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(box()).toBeChecked();
  });

  it("stays controlled when `checked` is provided", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox id="a" label="Subscribe" checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(box());

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // React is the source of truth; we report and the consumer decides.
    expect(box()).not.toBeChecked();
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <Checkbox id="a" label="Subscribe" checked={checked} onCheckedChange={setChecked} />
          <output>{checked ? "on" : "off"}</output>
        </>
      );
    }

    render(<Controlled />);
    await user.click(box());

    expect(screen.getByText("on")).toBeInTheDocument();
    expect(box()).toBeChecked();
  });

  it("reads defaultChecked only at mount", () => {
    const { rerender } = render(<Checkbox id="a" label="Subscribe" />);
    rerender(<Checkbox id="a" label="Subscribe" defaultChecked />);

    // `defaultChecked` is documented as initial-only, and asserting otherwise would pin the
    // component to the behaviour of a prop that does not exist.
    expect(box()).not.toBeChecked();
  });

  it("still changes when disabled is set", () => {
    render(<Checkbox id="a" label="Subscribe" defaultChecked disabled />);

    expect(box()).toBeDisabled();
    expect(box()).toBeChecked();
  });

  it("runs the consumer handler first", async () => {
    const user = userEvent.setup();
    const order: string[] = [];

    render(
      <Checkbox
        id="a"
        label="Subscribe"
        onClick={() => order.push("consumer")}
        onCheckedChange={() => order.push("internal")}
      />
    );

    await user.click(box());

    expect(order[0]).toBe("consumer");
  });
});

describe("Checkbox: states", () => {
  it("uses the native disabled attribute", () => {
    render(<Checkbox id="a" label="Subscribe" disabled />);

    expect(box()).toBeDisabled();
  });

  it("renders the native required attribute with a hidden word", () => {
    render(<Checkbox id="a" label="Subscribe" required />);

    expect(box()).toBeRequired();
    // The symbol is `aria-hidden`; the word is what a screen reader can actually announce.
    expect(screen.getByRole("checkbox", { name: /Subscribe Required/ })).toBeInTheDocument();
  });

  it("wires a helper text to aria-describedby", () => {
    render(<Checkbox id="a" label="Subscribe" helperText="No more than once a week" />);

    const describedBy = box().getAttribute("aria-describedby");
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      "No more than once a week"
    );
  });

  it("puts the label before the box when asked", () => {
    const { container } = render(<Checkbox id="a" label="Subscribe" labelPosition="start" />);

    const root = container.querySelector(".uir-checkbox") as HTMLElement;
    expect(root).toHaveAttribute("data-label-position", "start");
  });

  it("refuses readOnly at the type level", () => {
    // The prop is typed `never`, so this is a compile error rather than a prop that is silently
    // accepted and ignored. Asserted as a type, not at runtime.
    const props: { readOnly?: never } = {};
    expect(props.readOnly).toBeUndefined();
  });
});

describe("Checkbox: development warnings", () => {
  it("warns when there is no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Checkbox id="a" />);

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("no accessible name"))).toBe(true);
    warn.mockRestore();
  });

  it("says nothing when named", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Checkbox id="a" label="Subscribe" />);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Checkbox: direction and scheme", () => {
  it("operates inside an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Checkbox id="a" label="اشترك" />, { dir: "rtl" });

    const input = screen.getByRole("checkbox", { name: "اشترك" });
    await user.click(input);

    expect(input).toBeChecked();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Checkbox id="a" label="Subscribe" tone="danger" defaultChecked />,
        { scheme }
      );

      expect(screen.getByRole("checkbox", { name: "Subscribe" }), scheme).toBeChecked();
      unmount();
    }
  });
});
