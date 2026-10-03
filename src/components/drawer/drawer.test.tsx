/**
 * Drawer tests.
 *
 * The centre of gravity is that modal is *off* by default, and what each mode does about focus. The
 * non-modal path is the one that gets skipped in implementations, and it is the reason a non-modal
 * drawer is often unreachable with a keyboard.
 */

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Drawer } from "uireload/components/drawer";

describe("Drawer: rendering", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<Drawer title="Navigation">Body</Drawer>);

    /*
     * A drawer that is always in the DOM and merely hidden puts a `role="dialog"` in the
     * accessibility tree for a panel nobody is looking at. Unlike a tooltip's description, a dialog's
     * existence is announced the moment it appears.
     */
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a dialog when open", () => {
    render(
      <Drawer open title="Navigation">
        Body
      </Drawer>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("is portalled to the end of the body", () => {
    const { container } = render(
      <Drawer open title="Navigation">
        Body
      </Drawer>
    );

    // A drawer rendered inside a container with `overflow: hidden` or a stacking context would be
    // clipped by it; a panel overlaying the page is a property of the page.
    expect(container).toBeEmptyDOMElement();
    expect(document.body.querySelector(".uir-drawer")).toBeInTheDocument();
  });

  it("is a dialog but not modal by default", () => {
    render(
      <Drawer open title="Navigation">
        Body
      </Drawer>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // `aria-modal` is a promise about the rest of the page, and this component only makes it when it
    // has trapped focus and locked scrolling to keep it.
    expect(dialog).not.toHaveAttribute("aria-modal");
  });

  it("states aria-modal only when modal", () => {
    render(
      <Drawer open modal title="Navigation">
        Body
      </Drawer>
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("names itself from the title", () => {
    render(
      <Drawer open title="Navigation">
        Body
      </Drawer>
    );

    // `aria-labelledby` to a real `<h2>`, so the drawer appears in a heading list.
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Navigation");
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("falls back to an aria-label when there is no title", () => {
    render(
      <Drawer open aria-label="Filters">
        Body
      </Drawer>
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Filters");
  });

  it("renders header, body and footer", () => {
    render(
      <Drawer open header={<span>Header</span>} footer={<span>Footer</span>} title="Nav">
        Body
      </Drawer>
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});

describe("Drawer: backdrop", () => {
  it("renders no backdrop when not modal", () => {
    render(
      <Drawer open title="Nav">
        Body
      </Drawer>
    );

    // A non-modal drawer has no backdrop; the page beside it stays usable and visible.
    expect(document.querySelector(".uir-drawer__backdrop")).toBeNull();
  });

  it("renders a backdrop when modal", () => {
    render(
      <Drawer open modal title="Nav">
        Body
      </Drawer>
    );

    const backdrop = document.querySelector(".uir-drawer__backdrop");
    expect(backdrop).toBeInTheDocument();
    // A backdrop in the accessibility tree is a focusable stop that goes nowhere.
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
  });

  it("dismisses on a backdrop click when asked", () => {
    const onClose = vi.fn();
    render(
      <Drawer open modal title="Nav" onClose={onClose}>
        Body
      </Drawer>
    );

    fireEvent.pointerDown(document.querySelector(".uir-drawer__backdrop") as Element);

    expect(onClose).toHaveBeenCalledWith("dismiss");
  });

  it("ignores a backdrop click when asked not to", () => {
    const onClose = vi.fn();
    render(
      <Drawer open modal dismissOnBackdropClick={false} title="Nav" onClose={onClose}>
        Body
      </Drawer>
    );

    fireEvent.pointerDown(document.querySelector(".uir-drawer__backdrop") as Element);

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Drawer: dismissal", () => {
  it("dismisses with Escape", () => {
    const onClose = vi.fn();
    render(
      <Drawer open title="Nav" onClose={onClose}>
        Body
      </Drawer>
    );

    screen
      .getByRole("dialog")
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(onClose).toHaveBeenCalledWith("escape");
  });

  it("dismisses with the close control", () => {
    const onClose = vi.fn();
    render(
      <Drawer open title="Nav" onClose={onClose}>
        Body
      </Drawer>
    );

    screen.getByRole("button", { name: "Close" }).click();

    expect(onClose).toHaveBeenCalledWith("dismiss");
  });

  it("hides the close control when asked", () => {
    render(
      <Drawer open showClose={false} title="Nav">
        Body
      </Drawer>
    );

    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("accepts a custom close label", () => {
    render(
      <Drawer open closeLabel="Close navigation" title="Nav">
        Body
      </Drawer>
    );

    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
  });

  it("reports the reason on onDismiss as well", () => {
    const onClose = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Drawer open title="Nav" onClose={onClose} onDismiss={onDismiss}>
        Body
      </Drawer>
    );

    screen.getByRole("button", { name: "Close" }).click();

    // `onClose` is the request; `onDismiss` is the fact. Both fire, so a consumer can rely on one
    // having happened by the time the drawer is gone.
    expect(onClose).toHaveBeenCalledWith("dismiss");
    expect(onDismiss).toHaveBeenCalledWith("dismiss");
  });
});

describe("Drawer: controlled and uncontrolled", () => {
  it("stays open when controlled, and only reports", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Drawer open title="Nav" onClose={onClose}>
        Body
      </Drawer>
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledWith("escape");
    // React is the source of truth; we report and the consumer decides.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes itself when uncontrolled", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen title="Nav">
        Body
      </Drawer>
    );

    // `Portal` renders `null` on its first pass so the server and client markup match, so a portalled
    // surface only exists after the mount effect has run.
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes itself with the close control when uncontrolled", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen title="Nav">
        Body
      </Drawer>
    );

    await user.click(await screen.findByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Drawer open={open} title="Nav" onClose={() => setOpen(false)}>
            Body
          </Drawer>
          <button type="button">Elsewhere</button>
        </>
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Drawer: focus", () => {
  it("focuses the panel when it is not modal, so a keyboard user can get in", () => {
    render(
      <Drawer open title="Nav">
        <button type="button">Inside</button>
      </Drawer>
    );

    /*
     * The case that gets skipped and is the reason a non-modal drawer is often unreachable: without
     * this, `Tab` from the page goes to the next page element and there is no way in.
     */
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("does not put the panel in the tab order itself", () => {
    render(
      <Drawer open title="Nav">
        <button type="button">Inside</button>
      </Drawer>
    );

    // `tabIndex={-1}` makes it programmatically focusable without adding a stop for content inside.
    expect(screen.getByRole("dialog")).toHaveAttribute("tabindex", "-1");
  });
});

describe("Drawer: presentation", () => {
  it("exposes state as data attributes, not class names", () => {
    render(
      <Drawer open modal placement="inline-end" title="Nav">
        Body
      </Drawer>
    );

    const panel = screen.getByRole("dialog");
    expect(panel).toHaveAttribute("data-placement", "inline-end");
    expect(panel).toHaveAttribute("data-modal", "");
    expect(panel).toHaveAttribute("data-vertical", "");
    expect(panel.className).not.toMatch(/inline-end/);
  });

  it("marks a block drawer as not vertical", () => {
    render(
      <Drawer open placement="block-end" title="Nav">
        Body
      </Drawer>
    );

    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-vertical");
  });

  it("merges a consumer className onto the panel", () => {
    render(
      <Drawer open className="consumer-class" title="Nav">
        Body
      </Drawer>
    );

    expect(screen.getByRole("dialog")).toHaveClass("uir-drawer", "consumer-class");
  });

  it("applies size as an inline size for an inline drawer", () => {
    render(
      <Drawer open size="30rem" title="Nav">
        Body
      </Drawer>
    );

    expect(screen.getByRole("dialog")).toHaveStyle({ inlineSize: "30rem" });
  });

  it("applies size as a block size for a block drawer", () => {
    render(
      <Drawer open placement="block-end" size="12rem" title="Nav">
        Body
      </Drawer>
    );

    expect(screen.getByRole("dialog")).toHaveStyle({ blockSize: "12rem" });
  });
});

describe("Drawer: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(
      <Drawer open title="التنقل">
        Body
      </Drawer>,
      { dir: "rtl" }
    );

    // `inline-start` rather than `left`: a drawer pinned to the physical left in an RTL page is on the
    // wrong side of the reading flow.
    expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "inline-start");
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Drawer open modal title="Nav">
          Body
        </Drawer>,
        { scheme }
      );

      expect(screen.getByRole("dialog"), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
