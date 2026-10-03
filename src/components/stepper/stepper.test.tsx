/**
 * Stepper tests.
 *
 * The centre of gravity is the linear/non-linear fork, because it decides which steps exist as
 * *buttons* — and therefore what the strip's tab stops are. The bug this guards against is the
 * mirror image: a stepper that makes unreachable steps focusable, so `Tab` lands on something inert.
 */

import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Stepper, type StepperStep } from "uireload/components/stepper";

/** Four steps: two behind the current one, the current one, one ahead. */
const STEPS: StepperStep[] = [
  { id: "a", label: "Account" },
  { id: "b", label: "Profile", description: "Name and photo" },
  { id: "c", label: "Billing" },
  { id: "d", label: "Review" },
];

/** Every step header, in order. */
function headers(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(".uir-stepper__step")];
}

/**
 * One step header by position.
 *
 * Throwing rather than returning `HTMLElement | undefined`, because a missing header is a broken
 * component and a test that compares `undefined` against `"BUTTON"` reports a type mismatch instead
 * of saying which step was not rendered.
 */
function header(index: number): HTMLElement {
  const node = headers()[index];
  if (node === undefined) throw new Error(`no step header at index ${index}`);
  return node;
}

/** Just the visible label of each step, so a marker's number does not leak into the comparison. */
function labels(): (string | null)[] {
  return [...document.querySelectorAll(".uir-stepper__label")].map((node) => node.textContent);
}

describe("Stepper: rendering", () => {
  it("renders every step in order", () => {
    render(<Stepper steps={STEPS} active={2} />);

    expect(labels()).toEqual(["Account", "Profile", "Billing", "Review"]);
  });

  it("is an ordered list", () => {
    render(<Stepper steps={STEPS} active={2} />);

    // "list, 4 items" before each one is information — it is the difference between "step 2 of 4"
    // read as an isolated fragment and read as the second of four things.
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(document.querySelectorAll(".uir-stepper__item")).toHaveLength(4);
  });

  it("renders a description when there is one", () => {
    render(<Stepper steps={STEPS} active={2} />);

    expect(screen.getByText("Name and photo")).toBeInTheDocument();
  });

  it("marks the current step with aria-current=step", () => {
    render(<Stepper steps={STEPS} active={2} />);

    expect(header(2)).toHaveAttribute("aria-current", "step");
  });

  it("marks the current step with aria-current even when it is not a button", () => {
    render(<Stepper steps={STEPS} active={2} />);

    /*
     * The case that is easy to get wrong: the current step is never enterable, so an implementation
     * that puts `aria-current` on the button emits it in exactly the case where there is no button —
     * and the one thing the component communicates disappears in its default mode.
     */
    expect(header(2).tagName).toBe("DIV");
    expect(header(2)).toHaveAttribute("aria-current", "step");
  });

  it("marks exactly one step as current", () => {
    render(<Stepper steps={STEPS} active={1} />);

    const current = headers().filter((node) => node.hasAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Profile");
  });

  it("does not use aria-selected or aria-pressed", () => {
    render(<Stepper steps={STEPS} active={2} />);

    // A stepper is a position indicator, not a set of toggles.
    const current = header(2);
    expect(current).not.toHaveAttribute("aria-selected");
    expect(current).not.toHaveAttribute("aria-pressed");
  });

  it("numbers the markers from one, skipping the completed ones", () => {
    render(<Stepper steps={STEPS} active={2} />);

    // Steps one and two are completed and carry a tick instead, so the numbers that do appear are
    // "3" and "4" — counting from one, not from the position in the strip.
    const numbers = [...document.querySelectorAll(".uir-stepper__number")];
    expect(numbers.map((node) => node.textContent)).toEqual(["3", "4"]);
  });

  it("puts a tick on completed steps instead of a number", () => {
    render(<Stepper steps={STEPS} active={2} />);

    expect(document.querySelectorAll(".uir-stepper__tick")).toHaveLength(2);
  });

  it("hides every marker from assistive technology", () => {
    render(<Stepper steps={STEPS} active={2} />);

    // A screen reader describing "a circle with a tick in it" tells the user nothing about where they
    // are; the status region and the step's own name carry the meaning instead.
    for (const node of document.querySelectorAll(".uir-stepper__marker")) {
      expect(node).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("exposes the state as data attributes, not class names", () => {
    const { container } = render(
      <Stepper steps={[{ label: "A", optional: true, tone: "danger" }]} active={0} />
    );

    const root = container.querySelector(".uir-stepper") as HTMLElement;
    expect(root).toHaveAttribute("data-orientation", "horizontal");
    expect(root).toHaveAttribute("data-navigation", "linear");
    expect(root.className).not.toMatch(/horizontal|linear/);

    const step = document.querySelector(".uir-stepper__step") as HTMLElement;
    expect(step).toHaveAttribute("data-state", "current");
    expect(step).toHaveAttribute("data-optional", "");
    expect(step).toHaveAttribute("data-tone", "danger");
  });

  it("marks which steps are actionable", () => {
    render(<Stepper steps={STEPS} active={2} />);

    // The strip's tab stops are exactly its reachable steps, and this is the attribute that says so.
    const actionable = headers().map((header) => header.hasAttribute("data-actionable"));
    expect(actionable).toEqual([true, true, false, false]);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Stepper className="consumer-class" steps={STEPS} active={0} />);

    expect(container.querySelector(".uir-stepper")).toHaveClass("uir-stepper", "consumer-class");
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stepper ref={ref} steps={STEPS} active={0} />);

    expect(ref.current).toBe(document.querySelector(".uir-stepper"));
  });

  it("takes an accessible name", () => {
    render(<Stepper label="Checkout" steps={STEPS} active={0} />);

    expect(screen.getByLabelText("Checkout")).toBeInTheDocument();
  });
});

describe("Stepper: linear navigation", () => {
  it("makes a completed step's header a button, because going back is allowed", () => {
    render(<Stepper steps={STEPS} active={2} />);

    // A wizard you cannot return to in order to fix the address you typed two steps ago is a wizard
    // people abandon.
    expect(header(0).tagName).toBe("BUTTON");
    expect(header(1).tagName).toBe("BUTTON");
  });

  it("leaves an upcoming step's header a div, so Tab never lands on something inert", () => {
    render(<Stepper steps={STEPS} active={2} />);

    expect(header(3).tagName).toBe("DIV");
  });

  it("leaves the current step's header a div", () => {
    render(<Stepper steps={STEPS} active={2} />);

    // Activating it would report a move that did not happen.
    expect(header(2).tagName).toBe("DIV");
  });

  it("tab-reaches exactly the reachable steps, and no more", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Stepper steps={STEPS} active={2} />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveAccessibleName("Step 1: Account");

    await user.tab();
    expect(document.activeElement).toHaveAccessibleName("Step 2: Profile");

    // Steps 3 and 4 are past the current one, so Tab moves on rather than stopping at nothing.
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("reports going back to a completed step", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(<Stepper onStepChange={onStepChange} steps={STEPS} active={2} />);

    await user.click(screen.getByRole("button", { name: "Step 1: Account" }));

    expect(onStepChange).toHaveBeenCalledWith(0);
  });

  it("reports nothing for a step ahead, because there is no control to press", () => {
    const onStepChange = vi.fn();
    render(<Stepper onStepChange={onStepChange} steps={STEPS} active={2} />);

    expect(screen.queryByRole("button", { name: "Step 4: Review" })).not.toBeInTheDocument();
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("makes every non-current step a button in non-linear mode", () => {
    render(<Stepper navigation="non-linear" steps={STEPS} active={2} />);

    // Forward ones included — the whole point of non-linear is that the user chooses.
    expect(header(0).tagName).toBe("BUTTON");
    expect(header(3).tagName).toBe("BUTTON");
  });

  it("still leaves the current step a div, because it is not a destination", () => {
    render(<Stepper navigation="non-linear" steps={STEPS} active={2} />);

    expect(header(2).tagName).toBe("DIV");
  });

  it("gives an actionable step an accessible name from its label", () => {
    render(<Stepper navigation="non-linear" steps={STEPS} active={2} />);

    expect(screen.getByRole("button", { name: "Step 1: Account" })).toBeInTheDocument();
  });

  it("gives a non-string label a name from the number alone", () => {
    render(
      <Stepper
        navigation="non-linear"
        steps={[{ label: <span data-testid="node">Rich</span> }, { label: "Next" }]}
        active={1}
      />
    );

    // `String(node)` is `"[object Object]"`, which is a worse name than none.
    expect(screen.getByRole("button", { name: "Step 1" })).toBeInTheDocument();
  });
});

describe("Stepper: changing step", () => {
  it("reports a step change from a completed step", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <Stepper navigation="non-linear" onStepChange={onStepChange} steps={STEPS} active={3} />
    );

    await user.click(screen.getByRole("button", { name: "Step 1: Account" }));

    expect(onStepChange).toHaveBeenCalledWith(0);
  });

  it("reports a forward step change in non-linear mode", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <Stepper navigation="non-linear" onStepChange={onStepChange} steps={STEPS} active={0} />
    );

    await user.click(screen.getByRole("button", { name: "Step 3: Billing" }));

    expect(onStepChange).toHaveBeenCalledWith(2);
  });

  it("never moves itself, even when nothing is wired up", async () => {
    const user = userEvent.setup();
    render(<Stepper navigation="non-linear" steps={STEPS} active={0} />);

    await user.click(screen.getByRole("button", { name: "Step 2: Profile" }));

    // A stepper that advances on its own is a wizard that has decided the user is finished, and
    // "finished" is the one judgement this component has no basis to make.
    expect(header(0)).toHaveAttribute("aria-current", "step");
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [active, setActive] = useState(3);
      return (
        <Stepper navigation="non-linear" active={active} onStepChange={setActive} steps={STEPS} />
      );
    }

    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Step 1: Account" }));

    // Going *back* un-completes everything: the strip describes where the user is, not what they have
    // submitted.
    expect(header(0)).toHaveAttribute("aria-current", "step");
    expect(header(1)).toHaveAttribute("data-state", "upcoming");
    expect(
      headers().filter((node) => node.getAttribute("data-state") === "completed")
    ).toHaveLength(0);
  });

  it("does not act on a disabled step", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <Stepper
        navigation="non-linear"
        onStepChange={onStepChange}
        steps={[{ label: "Locked", disabled: true }, { label: "Open" }, { label: "Third" }]}
        active={1}
      />
    );

    await user.click(screen.getByRole("button", { name: "Step 3: Third" }));
    expect(onStepChange).toHaveBeenCalledWith(2);

    // A locked step is a `<div>` rather than a disabled button, so there is nothing to click — and
    // nothing for Tab to stop on.
    expect(header(0).tagName).toBe("DIV");
    onStepChange.mockClear();
    await user.click(header(0));
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("leaves a disabled step's error readable", () => {
    render(
      <Stepper
        navigation="non-linear"
        steps={[{ label: "Locked", disabled: true, errorText: "Locked because billing failed" }]}
        active={1}
      />
    );

    // The step cannot be entered, but the reason it is stuck is exactly what the user needs to know.
    expect(screen.getByText("Locked because billing failed")).toBeInTheDocument();
  });

  it("acts on nothing when the whole stepper is disabled", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <Stepper
        disabled
        navigation="non-linear"
        onStepChange={onStepChange}
        steps={STEPS}
        active={3}
      />
    );

    // Nothing was pressed: `disabled` is a flag, not an attribute on the headers, so there is no
    // control to aim at.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(header(0).tagName).toBe("DIV");
    await user.click(header(0));
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("renders nothing actionable for a zero-step stepper", () => {
    const { container } = render(<Stepper steps={[]} active={0} />);

    expect(headers()).toHaveLength(0);
    expect(container.querySelector(".uir-stepper")).toBeInTheDocument();
  });

  it("clamps an active index past the end", () => {
    render(<Stepper steps={STEPS} active={99} />);

    // A consumer whose step list shrank under a stale index would otherwise get a strip where nothing
    // is current and every header sits ahead of the user.
    expect(header(3)).toHaveAttribute("aria-current", "step");
  });
});

describe("Stepper: announcing", () => {
  it("states the position in a live region", () => {
    render(<Stepper steps={STEPS} active={1} />);

    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 4");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("updates the position when the step changes", () => {
    const { rerender } = render(<Stepper steps={STEPS} active={1} />);
    rerender(<Stepper steps={STEPS} active={2} />);

    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 4");
  });

  it("can be turned off", () => {
    render(<Stepper announcePosition={false} steps={STEPS} active={1} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("accepts a custom noun", () => {
    render(<Stepper stepLabel="Stage" steps={STEPS} active={1} />);

    expect(screen.getByRole("status")).toHaveTextContent("Stage 2 of 4");
  });
});

describe("Stepper: errors", () => {
  it("renders an error message", () => {
    render(
      <Stepper steps={[{ label: "Billing", errorText: "Card number is invalid" }]} active={0} />
    );

    expect(screen.getByText("Card number is invalid")).toBeInTheDocument();
  });

  it("points an actionable step's aria-describedby at its error", () => {
    render(
      <Stepper
        navigation="non-linear"
        steps={[{ label: "Billing", errorText: "Card number is invalid" }, { label: "Review" }]}
        active={1}
      />
    );

    // A step in an error state that a screen reader cannot hear about is an error a screen reader
    // user cannot fix.
    const button = screen.getByRole("button", { name: "Step 1: Billing" });
    const id = button.getAttribute("aria-describedby");
    expect(id).not.toBeNull();
    expect(document.getElementById(id as string)).toHaveTextContent("Card number is invalid");
  });

  it("gives every stepper instance its own error ids", () => {
    render(
      <>
        <Stepper
          navigation="non-linear"
          steps={[{ label: "A", errorText: "First error" }, { label: "B" }]}
          active={1}
        />
        <Stepper
          navigation="non-linear"
          steps={[{ label: "A", errorText: "Second error" }, { label: "B" }]}
          active={1}
        />
      </>
    );

    // A collided id points `aria-describedby` at the *other* stepper's error, which announces the
    // wrong step's failure.
    const buttons = screen.getAllByRole("button", { name: "Step 1: A" });
    const first = document.getElementById(buttons[0]?.getAttribute("aria-describedby") as string);
    const second = document.getElementById(buttons[1]?.getAttribute("aria-describedby") as string);

    expect(first).toHaveTextContent("First error");
    expect(second).toHaveTextContent("Second error");
  });

  it("describes no step when there is no error", () => {
    render(<Stepper navigation="non-linear" steps={STEPS} active={3} />);

    expect(screen.getByRole("button", { name: "Step 1: Account" })).not.toHaveAttribute(
      "aria-describedby"
    );
  });
});

describe("Stepper: content", () => {
  it("renders no content by default", () => {
    const { container } = render(<Stepper steps={STEPS} active={0} />);

    expect(container.querySelector(".uir-stepper__content")).toBeNull();
  });

  it("renders content when asked", () => {
    render(
      <Stepper showContent steps={STEPS} active={0}>
        <p>Step body</p>
      </Stepper>
    );

    expect(screen.getByText("Step body")).toBeInTheDocument();
  });

  it("does not render content when showContent is false, even if children are passed", () => {
    const { container } = render(
      <Stepper steps={STEPS} active={0}>
        <p>Step body</p>
      </Stepper>
    );

    expect(container.querySelector(".uir-stepper__content")).toBeNull();
    expect(screen.queryByText("Step body")).not.toBeInTheDocument();
  });
});

describe("Stepper: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Stepper steps={STEPS} active={2} />, { dir: "rtl" });

    // The connector is drawn with logical properties, so it mirrors without a second rule.
    expect(document.querySelector(".uir-stepper")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  it("renders both orientations in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      for (const orientation of ["horizontal", "vertical"] as const) {
        const { unmount } = renderWithProviders(
          <Stepper navigation="non-linear" orientation={orientation} steps={STEPS} active={2} />,
          { scheme }
        );

        expect(document.querySelector(".uir-stepper"), `${scheme}/${orientation}`).toHaveAttribute(
          "data-orientation",
          orientation
        );
        unmount();
      }
    }
  });
});
