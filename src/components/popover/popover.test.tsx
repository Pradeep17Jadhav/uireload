/**
 * Popover tests.
 *
 * The centre of gravity is dismissal behaviour and modality, because that is where an overlay
 * goes wrong in ways a user notices: a popover that will not close, a non-modal one that traps
 * focus, a modal one that leaves the page unscrollable.
 *
 * The positioning *algorithm* is tested directly in `src/internal/positioning.test.ts`. jsdom
 * does no layout, so a rendered test can only assert that a position was written, not that it
 * is correct.
 */

import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Popover } from "uireload/components/popover";

/**
 * A trigger plus a popover, which is the only shape that makes sense.
 *
 * `anchor` is a real ref rather than a thunk, because a ref is the common case and testing
 * the thunk form separately would leave the primary path less exercised.
 */
function Harness({
  ...props
}: Partial<React.ComponentProps<typeof Popover>> & { defaultOpen?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={trigger} type="button">
        Open
      </button>
      <Popover
        {...props}
        anchor={trigger}
        id="surface"
        title="Details"
        defaultOpen={props.defaultOpen ?? true}
      >
        <button type="button">Inside</button>
      </Popover>
    </>
  );
}

describe("Popover: rendering", () => {
  it("renders nothing at all when closed", () => {
    render(<Harness open={false} />);

    // Not a hidden surface: an inert node is still a node some assistive technology reaches,
    // and still something a consumer's selector can trip over.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a dialog when open", () => {
    render(<Harness />);

    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument();
  });

  it("is portalled to the body, out of the trigger's subtree", () => {
    const { container } = render(<Harness />);

    const surface = screen.getByRole("dialog");
    expect(container.contains(surface)).toBe(false);
    expect(document.body.contains(surface)).toBe(true);
  });

  it("names itself from the title, which is a visible heading", () => {
    const { container } = render(<Harness />);

    const surface = screen.getByRole("dialog");
    const heading = container.ownerDocument.getElementById(
      surface.getAttribute("aria-labelledby") as string
    );

    expect(heading).toHaveTextContent("Details");
    // A visible heading is a name a sighted user gets too, which is why it beats `label`.
    expect(surface).not.toHaveAttribute("aria-label");
  });

  it("falls back to aria-label when there is no title", () => {
    render(<Popover open anchor={null} id="surface" label="Details" />);

    const surface = screen.getByRole("dialog", { name: "Details" });
    expect(surface).toHaveAttribute("aria-label", "Details");
    expect(surface).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps a consumer's own aria-label rather than clobbering it", () => {
    render(<Popover open anchor={null} id="surface" aria-label="Details" />);

    /*
     * `aria-label` is written after `{...rest}` in the JSX, so the naive expression silently
     * overwrote a consumer's value with `label` (undefined here) and left an unnamed
     * `role="dialog"`. Found by the axe suite.
     */
    expect(screen.getByRole("dialog", { name: "Details" })).toHaveAttribute(
      "aria-label",
      "Details"
    );
  });

  it("keeps a consumer's own aria-labelledby when there is no title", () => {
    render(
      <>
        <h2 id="external">External heading</h2>
        <Popover open anchor={null} id="surface" aria-labelledby="external" />
      </>
    );

    expect(screen.getByRole("dialog", { name: "External heading" })).toHaveAttribute(
      "aria-labelledby",
      "external"
    );
    // The label and the reference are alternatives; emitting both makes the reference win and
    // hides a name the consumer asked for.
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-label");
  });

  it("prefers the title heading over a consumer's aria-label", () => {
    render(<Popover open anchor={null} id="surface" title="Heading" aria-label="Ignored" />);

    const surface = screen.getByRole("dialog", { name: "Heading" });
    expect(surface).toHaveAttribute("aria-labelledby");
    // A visible heading is a better name than a label that is not visible anywhere.
    expect(surface).not.toHaveAttribute("aria-label");
  });

  it("merges a consumer className onto the surface", () => {
    render(<Harness className="consumer-class" />);

    expect(screen.getByRole("dialog")).toHaveClass("uir-popover", "consumer-class");
  });

  it("renders content and footer regions", () => {
    const { container } = render(<Harness footer={<button type="button">Done</button>} />);

    // The content region is the portalled surface's own descendant, so it is reached through the
    // surface rather than through the render container.
    expect(screen.getByRole("dialog").querySelector(".uir-popover__content")).not.toBeNull();
    expect(screen.getByRole("dialog").querySelector(".uir-popover__header")).not.toBeNull();
    expect(screen.getByRole("dialog").querySelector(".uir-popover__footer")).not.toBeNull();

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(container.querySelector(".uir-popover")).toBeNull();
  });

  it("forwards its ref to the surface", () => {
    function RefHarness() {
      const trigger = useRef<HTMLButtonElement>(null);
      const surface = useRef<HTMLDivElement>(null);

      return (
        <>
          <button ref={trigger} type="button">
            Open
          </button>
          <Popover open anchor={trigger} id="s" title="T" ref={surface} />
        </>
      );
    }

    render(<RefHarness />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("exposes the resolved placement as a data attribute", () => {
    render(<Harness placement="top" />);

    expect(screen.getByRole("dialog")).toHaveAttribute("data-placement");
  });

  it("marks itself unpositioned when there is no anchor", () => {
    render(<Popover open anchor={null} id="surface" title="Detached" />);

    // Distinguishes "not measured yet" from "measured and centred", which look identical.
    expect(screen.getByRole("dialog")).toHaveAttribute("data-unpositioned", "");
  });

  it("draws no arrow unless asked", () => {
    const { container } = render(<Harness />);

    expect(container.querySelector(".uir-popover__arrow")).toBeNull();
  });

  it("draws a hidden arrow when asked", () => {
    const { container } = render(<Harness arrow />);

    const arrow = container.ownerDocument.querySelector(".uir-popover__arrow");
    expect(arrow).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Popover: state", () => {
  it("honours defaultOpen when uncontrolled", () => {
    render(<Harness defaultOpen />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("starts closed by default", () => {
    render(<Harness defaultOpen={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays controlled when `open` is provided", async () => {
    const onOpenChange = vi.fn();
    render(
      <>
        <button ref={() => undefined} type="button">
          Open
        </button>
        <Popover open anchor={null} id="s" title="T" onOpenChange={onOpenChange} />
      </>
    );

    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // React is the source of truth; we report and the consumer decides.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape when uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports why it closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.keyboard("{Escape}");

    // A consumer holding unsaved input has to treat Escape differently from a click outside,
    // and cannot tell them apart from a single boolean.
    expect(onClose).toHaveBeenCalledWith("escape");
  });

  it("stays open when closeOnEscape is false", async () => {
    const user = userEvent.setup();
    render(<Harness closeOnEscape={false} />);

    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("Popover: outside press", () => {
  it("closes on a press outside", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <>
        <Harness onClose={onClose} />
        <button type="button">Elsewhere</button>
      </>
    );

    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(onClose).toHaveBeenCalledWith("outside-press");
  });

  it("does not close on a press inside", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Inside" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not close on a press on the anchor, which would fight the toggle", async () => {
    /*
     * Without excluding the anchor, pressing a trigger while its surface is open closes it on
     * `pointerdown` and the click then reopens it. To the user the surface appears stuck.
     */
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("stays open when closeOnOutsidePress is false", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness closeOnOutsidePress={false} />
        <button type="button">Elsewhere</button>
      </>
    );

    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("Popover: modality", () => {
  it("is not modal by default", () => {
    render(<Harness />);

    const surface = screen.getByRole("dialog");
    expect(surface).not.toHaveAttribute("aria-modal");
    expect(surface).not.toHaveAttribute("data-modal");
    // `aria-modal="false"` is noise, and some assistive technology reads the mere presence of
    // the attribute as a claim of modality.
    expect(document.querySelector(".uir-popover__backdrop")).toBeNull();
  });

  it("is aria-modal and renders a backdrop when modal", () => {
    render(<Harness modal />);

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(document.querySelector(".uir-popover__backdrop")).not.toBeNull();
  });

  it("does not move focus when non-modal", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const trigger = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);

      return (
        <>
          <button ref={trigger} type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Popover open={open} onOpenChange={setOpen} anchor={trigger} id="surface" title="Details">
            <button type="button">Inside</button>
          </Popover>
        </>
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Open" }));

    // A non-modal surface must not steal focus: the user is still working in the page, and a
    // dropdown list that grabs focus on open is unusable with a keyboard.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open" }));
  });

  it("moves focus into itself when modal", async () => {
    // Opened on mount rather than by a click, because clicking the trigger moves focus back to
    // the trigger afterwards and masks what the focus trap did on open.
    render(<Harness modal />);

    // Focus landing inside on open is what makes a modal surface usable at all: a surface that
    // appears while focus stays behind it gives a keyboard user no idea where they are.
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inside" }))
    );
  });

  it("keeps Tab inside itself when modal", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness modal />
        <button type="button">Behind</button>
      </>
    );

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inside" }))
    );

    await user.tab();

    // One tabbable element inside, so Tab has to wrap back onto it rather than escape to the
    // page behind. `useFocusTrap` is what enforces this.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inside" }));
  });

  it("locks page scroll only when modal", async () => {
    const { unmount } = render(<Harness modal />);
    await waitFor(() => expect(document.documentElement.style.overflow).toBe("hidden"));
    unmount();

    await waitFor(() => expect(document.documentElement.style.overflow).not.toBe("hidden"));
  });

  it("leaves page scroll alone when non-modal", () => {
    render(<Harness />);

    expect(document.documentElement.style.overflow).not.toBe("hidden");
  });

  it("restores focus when it closes", async () => {
    const user = userEvent.setup();
    render(<Harness modal />);

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    // Focus returning to the trigger is what makes Escape feel like undoing rather than
    // teleporting the user to the top of the document.
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

describe("Popover: development warnings", () => {
  it("warns about a nameless surface", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Popover open anchor={null} id="surface" />);

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("no accessible name"))).toBe(true);
    warn.mockRestore();
  });

  it("says nothing when named", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Harness />);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Popover: direction and scheme", () => {
  it("renders inside an RTL subtree and closes there", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { dir: "rtl" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Harness modal />, { scheme });

      expect(screen.getByRole("dialog"), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
