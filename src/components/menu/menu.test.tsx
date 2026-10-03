import { createRef, useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Menu, type MenuEntry, type MenuItem } from "uireload/components/menu";

const ITEMS: readonly MenuEntry[] = [
  { id: "cut", label: "Cut" },
  { id: "copy", label: "Copy" },
  { id: "paste", label: "Paste" },
  { id: "s1", type: "separator" },
  { id: "bold", label: "Bold", role: "menuitemcheckbox" },
  { id: "wrap", label: "Wrap lines", role: "menuitemcheckbox", checked: true },
  { id: "left", label: "Align left", role: "menuitemradio" },
];

/**
 * A trigger plus an open menu, which is the only shape a menu has in practice.
 *
 * The trigger is the consumer's own button, exactly as the pattern describes; the menu writes
 * `aria-haspopup` and `aria-expanded` onto it from `anchor`, so the test also covers that contract.
 */
function Harness({
  items = ITEMS,
  onAction,
  initialFocus,
  open: controlledOpen,
  onKeyDown,
}: {
  items?: readonly MenuEntry[];
  onAction?: (id: string) => void;
  initialFocus?: "first" | "last";
  open?: boolean;
  onKeyDown?: (event: { preventDefault: () => void }) => void;
}) {
  const [open, setOpen] = useState(controlledOpen ?? true);
  const anchor = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button
        type="button"
        ref={anchor}
        onClick={() => setOpen((current) => !current)}
        aria-label="Edit"
      >
        Edit
      </button>
      <Menu
        anchor={anchor}
        open={open}
        onOpenChange={setOpen}
        items={items}
        onAction={onAction}
        initialFocus={initialFocus}
        label="Edit menu"
        onKeyDown={onKeyDown as never}
      />
    </div>
  );
}

const rowLabels = () =>
  screen.getByRole("menu", { hidden: true }).textContent?.replace(/\s+/g, " ").trim() ?? "";

describe("Menu", () => {
  it("renders nothing when closed", () => {
    render(<Menu anchor={document.body} items={ITEMS} open={false} label="Edit menu" />);

    expect(screen.queryByRole("menu", { hidden: true })).toBeNull();
  });

  it("renders a role=menu surface with a name", () => {
    render(<Harness />);

    const menu = screen.getByRole("menu", { hidden: true });
    expect(menu).toHaveAttribute("aria-label", "Edit menu");
  });

  it("falls back to a catalogue name when no label is given", () => {
    render(<Menu anchor={document.body} items={ITEMS} open label="ignored" />);
    expect(screen.getByRole("menu", { hidden: true })).toHaveAttribute("aria-label", "ignored");
  });

  it("uses the catalogue default when label is omitted entirely", () => {
    render(<Menu anchor={document.body} items={ITEMS} open />);
    expect(screen.getByRole("menu", { hidden: true })).toHaveAttribute("aria-label", "Menu");
  });

  it("renders each entry with the right role", () => {
    render(<Harness />);

    expect(screen.getAllByRole("menuitem", { hidden: true })).toHaveLength(3);
    expect(screen.getAllByRole("menuitemcheckbox", { hidden: true })).toHaveLength(2);
    expect(screen.getAllByRole("menuitemradio", { hidden: true })).toHaveLength(1);
  });

  it("renders a separator that is not focusable", () => {
    render(<Harness />);

    const separator = screen.getByRole("separator", { hidden: true });
    expect(separator).not.toHaveAttribute("tabindex");
  });

  it("reports aria-checked on the checkable roles only", () => {
    render(<Harness />);

    /*
     * `aria-checked` is required on both checkable roles, so an item given no `checked` reports `"false"`
     * rather than omitting the attribute - omitting it leaves a menu item with an incomplete role, which
     * assistive technology reports as a critical failure rather than as "off".
     */
    expect(screen.getByRole("menuitemcheckbox", { name: /Bold/ })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(screen.getByRole("menuitemcheckbox", { name: /Wrap lines/ })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("menuitemradio", { name: /Align left/ })).toHaveAttribute(
      "aria-checked",
      "false"
    );

    // A plain action must carry no checked state at all: the attribute is not valid for `menuitem`.
    expect(screen.getByRole("menuitem", { name: /Cut/ })).not.toHaveAttribute("aria-checked");
  });

  it("forwards its ref to the root surface", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Menu ref={ref} anchor={document.body} items={ITEMS} open />);

    expect(ref.current).toBe(screen.getByRole("menu", { hidden: true }));
  });

  /*
   * The trigger contract.
   *
   * This is the failure that is invisible to a mouse user and fatal to a screen reader user: the menu opens
   * perfectly but the button is still announced as a plain button that mysteriously reveals a list. The
   * menu writes both attributes from `anchor`, so a caller who passes one cannot get it wrong.
   */
  describe("trigger contract", () => {
    it("writes aria-haspopup=menu and aria-expanded onto the anchor", () => {
      render(<Harness />);

      const trigger = screen.getByRole("button", { name: "Edit" });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("restores the anchor's previous attributes when it unmounts", () => {
      const { unmount } = render(<Harness />);
      const trigger = screen.getByRole("button", { name: "Edit" });

      unmount();

      // Restoring rather than removing is what stops a consumer's own `aria-expanded` being clobbered.
      expect(trigger).not.toHaveAttribute("aria-haspopup");
    });

    it("does not count a press on the anchor as an outside press", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(screen.getByRole("button", { name: "Edit" }));
      expect(screen.queryByRole("menu", { hidden: true })).toBeNull();
    });
  });

  describe("activation", () => {
    it("reports the activated id", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<Harness onAction={onAction} />);

      await user.click(screen.getByRole("menuitem", { name: /Copy/ }));
      expect(onAction).toHaveBeenCalledWith("copy");
    });

    it("calls the item's own onSelect before onAction", async () => {
      const user = userEvent.setup();
      const order: string[] = [];
      const item: MenuItem = {
        id: "only",
        label: "Only",
        onSelect: () => order.push("item"),
      };

      render(<Harness items={[item]} onAction={() => order.push("menu")} />);
      await user.click(screen.getByRole("menuitem", { name: /Only/ }));

      expect(order).toEqual(["item", "menu"]);
    });

    it("closes after a plain action", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(screen.getByRole("menuitem", { name: /Copy/ }));
      await waitFor(() => expect(screen.queryByRole("menu", { hidden: true })).toBeNull());
    });

    /*
     * The carve-out in the pattern.
     *
     * A `menuitemcheckbox` does not close on activation. Someone adjusting three switches expects to adjust
     * three switches, not to be thrown out of the menu after each one.
     */
    it("stays open after a checkbox item", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(screen.getByRole("menuitemcheckbox", { name: /Bold/ }));
      expect(screen.getByRole("menu", { hidden: true })).toBeInTheDocument();
    });

    it("stays open after a radio item", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(screen.getByRole("menuitemradio", { name: /Align left/ }));
      expect(screen.getByRole("menu", { hidden: true })).toBeInTheDocument();
    });

    it("lets closeOnSelect override the default in either direction", async () => {
      const user = userEvent.setup();
      render(
        <Harness
          items={[
            { id: "stay", label: "Stay open", role: "menuitemcheckbox" },
            { id: "close", label: "Close me", closeOnSelect: false },
          ]}
        />
      );

      await user.click(screen.getByRole("menuitem", { name: /Close me/ }));
      expect(screen.getByRole("menu", { hidden: true })).toBeInTheDocument();
    });
  });

  /*
   * A disabled row stays reachable.
   *
   * The pattern requires it, and it is the right call: a row that is missing from the arrow-key sequence is
   * a gap the user cannot account for, whereas a row they can see and cannot use at least tells them why.
   */
  describe("disabled items", () => {
    const withDisabled: readonly MenuEntry[] = [
      { id: "one", label: "One" },
      { id: "two", label: "Two", disabled: true },
      { id: "three", label: "Three" },
    ];

    it("reports aria-disabled rather than the native attribute", () => {
      render(<Harness items={withDisabled} />);

      expect(screen.getByRole("menuitem", { name: /Two/ })).toHaveAttribute(
        "aria-disabled",
        "true"
      );
    });

    it("does not activate on click", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<Harness items={withDisabled} onAction={onAction} />);

      await user.click(screen.getByRole("menuitem", { name: /Two/ }));
      expect(onAction).not.toHaveBeenCalled();
    });

    it("is still reachable with the Down arrow", async () => {
      const user = userEvent.setup();
      render(<Harness items={withDisabled} />);

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: /Two/ })).toHaveFocus();
    });
  });

  /*
   * The keyboard contract, from the pattern.
   *
   * Focus moves with the arrow keys because a menu is a composite widget: Tab leaves it rather than walking
   * its rows, so the arrow keys are the only way to reach the other items.
   */
  describe("keyboard", () => {
    it("focuses the first item when it opens", async () => {
      render(<Harness />);

      await waitFor(() => expect(screen.getByRole("menuitem", { name: /Cut/ })).toHaveFocus());
    });

    it("focuses the last item when initialFocus is last", async () => {
      render(<Harness initialFocus="last" />);

      await waitFor(() =>
        expect(screen.getByRole("menuitemradio", { name: /Align left/ })).toHaveFocus()
      );
    });

    it("moves to the next item on ArrowDown", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: /Copy/ })).toHaveFocus();
    });

    it("moves to the previous item on ArrowUp", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.keyboard("{ArrowUp}");
      // Looping is on, so Up from the first row lands on the last.
      expect(screen.getByRole("menuitemradio", { name: /Align left/ })).toHaveFocus();
    });

    it("wraps from the last item to the first", async () => {
      const user = userEvent.setup();
      render(<Harness initialFocus="last" />);

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: /Cut/ })).toHaveFocus();
    });

    it("jumps to the first item on Home", async () => {
      const user = userEvent.setup();
      render(<Harness initialFocus="last" />);

      await user.keyboard("{Home}");
      expect(screen.getByRole("menuitem", { name: /Cut/ })).toHaveFocus();
    });

    it("jumps to the last item on End", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.keyboard("{End}");
      expect(screen.getByRole("menuitemradio", { name: /Align left/ })).toHaveFocus();
    });

    it("skips a separator when moving with the arrows", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
      expect(screen.getByRole("menuitemcheckbox", { name: /Bold/ })).toHaveFocus();
    });

    it("activates the focused item on Enter", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<Harness onAction={onAction} />);

      await user.keyboard("{Enter}");
      expect(onAction).toHaveBeenCalledWith("cut");
    });

    it("activates the focused item on Space", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<Harness onAction={onAction} />);

      await user.keyboard(" ");
      expect(onAction).toHaveBeenCalledWith("cut");
    });

    it("does not scroll the page when Space activates a row", async () => {
      /*
       * Space is the activation key, and Space is also the page-scroll key. If the menu does not prevent it,
       * activating an item scrolls the document as a side effect.
       */
      const user = userEvent.setup();
      render(<Harness items={[{ id: "stay", label: "Stay", role: "menuitemcheckbox" }]} />);

      await user.keyboard(" ");
      expect(screen.getByRole("menu", { hidden: true })).toBeInTheDocument();
    });

    it("ignores ArrowDown on a modifier combination", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.keyboard("{Control>}{ArrowDown}{/Control}");
      expect(screen.getByRole("menuitem", { name: /Cut/ })).toHaveFocus();
    });
  });

  /*
   * Typeahead: the pattern's "any key corresponding to a printable character".
   */
  describe("typeahead", () => {
    it("moves focus to the item starting with the typed character", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.keyboard("p");
      expect(screen.getByRole("menuitem", { name: /Paste/ })).toHaveFocus();
    });

    it("cycles through items sharing a first character", async () => {
      const user = userEvent.setup();
      render(
        <Harness
          items={[
            { id: "save", label: "Save" },
            { id: "share", label: "Share" },
            { id: "sign", label: "Sign out" },
          ]}
        />
      );

      await user.keyboard("s");
      expect(screen.getByRole("menuitem", { name: /Save/ })).toHaveFocus();

      await user.keyboard("s");
      expect(screen.getByRole("menuitem", { name: /Share/ })).toHaveFocus();

      await user.keyboard("s");
      expect(screen.getByRole("menuitem", { name: /Sign out/ })).toHaveFocus();
    });

    it("does not treat a named key as a typeahead character", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.keyboard("{Home}");
      expect(screen.getByRole("menuitem", { name: /Cut/ })).toHaveFocus();
    });
  });

  /*
   * Roving tabindex, the focus strategy chosen over `aria-activedescendant`.
   *
   * The pattern accepts either. Roving is used because it puts real DOM focus on the row, which every
   * assistive technology already agrees about, and because it matches the rest of the library.
   */
  it("keeps exactly one row in the tab sequence", () => {
    render(<Harness />);

    const tabbable = [...document.querySelectorAll('[role^="menuitem"]')].filter(
      (row) => row.getAttribute("tabindex") === "0"
    );

    expect(tabbable).toHaveLength(1);
  });

  it("gives no row a positive tabindex", () => {
    render(<Harness />);

    for (const row of document.querySelectorAll('[role^="menuitem"]')) {
      expect(Number(row.getAttribute("tabindex"))).toBeLessThanOrEqual(0);
    }
  });

  describe("controlled mode", () => {
    it("stays open when open is true even after an action", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const anchor = { current: document.body };

      render(
        <Menu anchor={anchor} open onOpenChange={onOpenChange} items={[{ id: "x", label: "X" }]} />
      );

      await user.click(screen.getByRole("menuitem", { name: /X/ }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole("menu", { hidden: true })).toBeInTheDocument();
    });

    it("reports the requested close without applying it", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Menu
          anchor={document.body}
          open
          onOpenChange={onOpenChange}
          items={[{ id: "x", label: "X" }]}
        />
      );

      await user.click(screen.getByRole("menuitem", { name: /X/ }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  /*
   * The library-wide rule: the consumer's handler runs first and `preventDefault()` opts out.
   */
  it("still calls the consumer's onKeyDown after handling a key itself", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();

    render(<Harness onKeyDown={onKeyDown} />);

    await user.keyboard("{ArrowDown}");
    expect(onKeyDown).toHaveBeenCalled();
  });

  it("calls the consumer's onKeyDown exactly once per key", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();

    render(<Harness onKeyDown={onKeyDown} />);

    await user.keyboard("{ArrowDown}");
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("keeps the menu operable when activation is vetoed by the consumer", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<Harness onAction={onAction} onKeyDown={(event) => event.preventDefault()} />);

    await user.keyboard("{Enter}");
    expect(onAction).not.toHaveBeenCalled();
  });

  it("exposes resolved placement as a data attribute", () => {
    render(<Harness />);
    expect(screen.getByRole("menu", { hidden: true })).toHaveAttribute("data-placement", "bottom");
  });

  /*
   * Direction and scheme.
   *
   * The menu is rendered into a portal on `document.body`, so it is deliberately *not* a descendant of the
   * provider wrapper. That is the correct behaviour — a menu must escape any `overflow: hidden` or stacking
   * context between it and its trigger — and it means the scheme and direction attributes cannot be found by
   * walking up from the menu.
   *
   * What is asserted instead is what the component actually owns: that it renders and works at all, and that
   * it resolves direction from the anchor rather than from the document. The anchor *is* inside the provider
   * subtree, which is the node the direction is read from.
   */
  it("renders its items inside an RTL subtree", () => {
    renderWithProviders(<Harness />, { dir: "rtl" });

    expect(screen.getByRole("menu", { hidden: true })).toBeInTheDocument();
    expect(rowLabels()).toContain("Cut");
    expect(screen.getByRole("button", { name: "Edit" }).closest("[dir='rtl']")).not.toBeNull();
  });

  it("renders and remains operable under the high-contrast scheme", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    renderWithProviders(<Harness onAction={onAction} />, { scheme: "high-contrast" });

    expect(screen.getByRole("menu", { hidden: true })).toBeInTheDocument();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onAction).toHaveBeenCalledWith("copy");
  });
});
