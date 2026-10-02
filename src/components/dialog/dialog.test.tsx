/**
 * Dialog tests.
 *
 * The centre of gravity is modality: focus goes in, focus stays in, and focus comes back out.
 * Those are the three behaviours that make a dialog usable with a keyboard, and each is a separate
 * failure mode — a dialog that never receives focus, one that leaks focus to the page behind, and
 * one that strands the user on `<body>` after closing.
 */

import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Dialog } from "uireload/components/dialog";

/** A trigger plus an open dialog, which is the only shape that makes sense. */
function Harness({ defaultOpen = true, ...props }: Partial<React.ComponentProps<typeof Dialog>>) {
  return (
    <>
      <button type="button">Trigger</button>
      <Dialog
        {...props}
        id="surface"
        title="Confirm"
        footer={
          <>
            <button type="button">Cancel</button>
            <button type="button">Confirm</button>
          </>
        }
        defaultOpen={defaultOpen}
      >
        <p>Are you sure?</p>
      </Dialog>
    </>
  );
}

describe("Dialog: rendering", () => {
  it("renders nothing when closed", () => {
    render(<Harness open={false} />);

    // Not a hidden surface: an inert node is still reachable by some assistive technology.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a modal dialog when open", () => {
    render(<Harness />);

    const surface = screen.getByRole("dialog", { name: "Confirm" });
    expect(surface).toHaveAttribute("aria-modal", "true");
  });

  it("is portalled to the body, out of the trigger's subtree", () => {
    const { container } = render(<Harness />);

    const surface = screen.getByRole("dialog");
    expect(container.contains(surface)).toBe(false);
    expect(document.body.contains(surface)).toBe(true);
  });

  it("names itself from the title, which is a visible heading", () => {
    render(<Harness />);

    const surface = screen.getByRole("dialog");
    const heading = document.getElementById(surface.getAttribute("aria-labelledby") as string);

    expect(heading).toHaveTextContent("Confirm");
  });

  it("takes role=alertdialog when urgent", () => {
    render(<Harness urgency="alert" />);

    // An `alertdialog` is an assertive live region: it is announced as soon as it appears rather
    // than waiting to be read. That is right for a destructive confirmation and wrong otherwise.
    expect(screen.getByRole("alertdialog", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a plain dialog when not urgent", () => {
    render(<Harness />);

    expect(screen.getByRole("dialog")).toHaveAttribute("data-urgency", "normal");
  });

  it("renders header, content and footer regions", () => {
    render(<Harness />);

    const surface = screen.getByRole("dialog");
    expect(surface.querySelector(".uir-dialog__header")).not.toBeNull();
    expect(surface.querySelector(".uir-dialog__content")).not.toBeNull();
    expect(surface.querySelector(".uir-dialog__footer")).not.toBeNull();

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("merges a consumer className onto the surface", () => {
    render(<Harness className="consumer-class" />);

    expect(screen.getByRole("dialog")).toHaveClass("uir-dialog", "consumer-class");
  });

  it("keeps a consumer's own aria-label rather than clobbering it", () => {
    render(<Dialog defaultOpen id="surface" aria-label="Session details" />);

    /*
     * `aria-label` is written after `{...rest}` in the JSX, so the naive expression silently
     * overwrote a consumer's value with `label` (undefined here) and left an unnamed
     * `role="dialog"`. Found by the axe suite; `Popover` had the identical bug and the identical
     * fix.
     */
    expect(screen.getByRole("dialog", { name: "Session details" })).toHaveAttribute(
      "aria-label",
      "Session details"
    );
  });

  it("prefers the title heading over a consumer's aria-label", () => {
    render(<Dialog defaultOpen id="surface" title="Confirm" aria-label="Ignored" />);

    const surface = screen.getByRole("dialog", { name: "Confirm" });
    expect(surface).toHaveAttribute("aria-labelledby");
    // A visible heading is a better name than a label that is nowhere on screen.
    expect(surface).not.toHaveAttribute("aria-label");
  });

  it("renders a blocking backdrop", () => {
    render(<Harness />);

    expect(document.querySelector(".uir-dialog__backdrop")).not.toBeNull();
  });

  it("hides the backdrop from assistive technology", () => {
    render(<Harness />);

    // An unnamed, unlabelled interactive element is an axe violation and a tab stop nobody can
    // name. The backdrop is not a control; Escape and the click below are the controls.
    expect(document.querySelector(".uir-dialog__backdrop")).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards its ref to the surface", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Harness ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("dialog"));
  });

  it("exposes size, tone and urgency as data attributes", () => {
    render(<Harness size="lg" tone="danger" urgency="alert" />);

    const surface = screen.getByRole("alertdialog");
    expect(surface).toHaveAttribute("data-size", "lg");
    expect(surface).toHaveAttribute("data-tone", "danger");
    expect(surface).toHaveAttribute("data-urgency", "alert");
  });
});

describe("Dialog: the close button", () => {
  it("renders no close button by default", () => {
    render(<Harness />);

    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders a named, focusable close button when asked", () => {
    render(<Harness showCloseButton />);

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeInTheDocument();
    // Not `aria-hidden`: a keyboard user with no other route out needs it.
    expect(button).not.toHaveAttribute("aria-hidden");
  });

  it("closes when the close button is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness showCloseButton />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("accepts a custom label", () => {
    render(<Harness showCloseButton closeButtonLabel="Dismiss" />);

    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });
});

describe("Dialog: focus", () => {
  it("moves focus inside on open", async () => {
    render(<Harness />);

    // A dialog that appears while focus stays behind it gives a keyboard user no idea where they
    // are. This is the single most important behaviour in the component.
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button type="button">Behind</button>
      </>
    );

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }))
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Confirm" }));

    // Wraps rather than escaping to the page behind. `useFocusTrap` is what enforces this.
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Confirm" }));
  });

  it("focuses the surface itself when initialFocus is container", async () => {
    render(<Harness initialFocus="container" />);

    // For a destructive confirmation, where focusing the first button would put a keyboard user
    // one keystroke from the dangerous action.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("dialog")));
  });

  it("gives an empty dialog a tab stop, so focus cannot escape", async () => {
    render(
      <Dialog open id="empty" title="Notice" initialFocus="container">
        <p>Nothing to interact with.</p>
      </Dialog>
    );

    // `useFocusTrap` sets `tabindex="-1"` on a container with nothing tabbable, which is what
    // stops the very first Tab from leaving the dialog.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("dialog")));
  });

  it("restores focus to the trigger when it closes", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Trigger
          </button>
          <Dialog open={open} onOpenChange={setOpen} id="s" title="Confirm">
            <button type="button">Inside</button>
          </Dialog>
        </>
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Trigger" }));
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inside" }))
    );

    await user.keyboard("{Escape}");

    // Focus returning to the trigger is what makes Escape feel like undoing rather than
    // teleporting the user to the top of the document.
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Trigger" }))
    );
  });

  it("leaves focus alone when restoreFocus is false", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Trigger
          </button>
          <Dialog open={open} onOpenChange={setOpen} id="s" title="Confirm" restoreFocus={false}>
            <button type="button">Inside</button>
          </Dialog>
        </>
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Trigger" }));
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inside" }))
    );

    await user.keyboard("{Escape}");

    // The trigger no longer exists in this case, so restoring focus to it would be a focus trap of
    // its own.
    expect(document.activeElement).toBe(document.body);
  });
});

describe("Dialog: dismissal", () => {
  it("closes on Escape", async () => {
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

    expect(onClose).toHaveBeenCalledWith("escape");
  });

  it("stays open when closeOnEscape is false", async () => {
    const user = userEvent.setup();
    render(<Harness closeOnEscape={false} />);

    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on a backdrop press", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    const backdrop = document.querySelector(".uir-dialog__backdrop") as HTMLElement;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledWith("backdrop-press");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays open on a backdrop press when that is turned off", async () => {
    const user = userEvent.setup();
    render(<Harness closeOnBackdropPress={false} />);

    const backdrop = document.querySelector(".uir-dialog__backdrop") as HTMLElement;
    await user.click(backdrop);

    // For a destructive confirmation: a stray click should not discard the user's work.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not close when the dialog itself is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes exactly once per Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.keyboard("{Escape}");

    // One event, one close. `useDismiss`'s outside-press check would fire for the same press if it
    // were enabled here.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays controlled when `open` is provided", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} />);

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // React is the source of truth; we report and the consumer decides.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("lets a consumer veto a close by staying controlled", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog
          open={open}
          onOpenChange={() => undefined}
          onClose={(reason) => {
            onClose(reason);
            // Refuse: the work would be lost.
            if (reason === "escape") setOpen(true);
          }}
          id="s"
          title="Unsaved"
          closeOnBackdropPress={false}
        >
          <button type="button">Inside</button>
        </Dialog>
      );
    }

    render(<Controlled />);
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledWith("escape");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("Dialog: scroll lock", () => {
  it("locks the page while open", async () => {
    const { unmount } = render(<Harness />);

    await waitFor(() => expect(document.documentElement.style.overflow).toBe("hidden"));
    unmount();

    await waitFor(() => expect(document.documentElement.style.overflow).not.toBe("hidden"));
  });

  it("does not lock the page when closed", () => {
    render(<Harness open={false} />);

    expect(document.documentElement.style.overflow).not.toBe("hidden");
  });
});

describe("Dialog: development warnings", () => {
  it("warns about a nameless dialog", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Dialog open id="s" />);

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

describe("Dialog: no DOM leakage", () => {
  it("renders no attribute the dialog does not own", () => {
    render(<Harness open onClose={() => undefined} tone="danger" size="lg" urgency="alert" />);

    const surface = screen.getByRole("alertdialog");
    const allowed = new Set([
      "aria-labelledby",
      "aria-modal",
      "class",
      "data-size",
      "data-tone",
      "data-urgency",
      "id",
      "role",
      // Set by the component so the surface is programmatically focusable; not a leaked prop.
      "tabindex",
    ]);

    for (const name of surface.getAttributeNames()) {
      expect(
        allowed.has(name),
        `unexpected attribute ${name}="${surface.getAttribute(name)}"`
      ).toBe(true);
    }
  });
});

describe("Dialog: direction and scheme", () => {
  it("operates inside an RTL subtree", async () => {
    const user = userEvent.setup();

    // Written out rather than using `Harness`, whose own `title` prop wins over a spread one, and
    // uncontrolled rather than `open` — a controlled dialog with no `onOpenChange` correctly
    // refuses to close, which is asserted separately.
    renderWithProviders(
      <Dialog defaultOpen id="s" title="تأكيد">
        <button type="button">داخلي</button>
      </Dialog>,
      { dir: "rtl" }
    );

    expect(screen.getByRole("dialog", { name: "تأكيد" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Harness tone="danger" />, { scheme });

      expect(screen.getByRole("dialog"), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
