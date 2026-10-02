/**
 * Tab bar tests.
 *
 * The centre of gravity is the manual-activation contract: arrows move focus, Enter or Space moves
 * selection. Getting that wrong is the failure that makes a tab strip feel broken — arrowing past four
 * tabs fires four requests, and on a non-router tab set it destroys the form data on the tab the user
 * left.
 */

import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { TabBar, type TabItem } from "uireload/components/tab-bar";

const ITEMS: TabItem[] = [
  { value: "overview", label: "Overview", panel: "Overview panel" },
  { value: "activity", label: "Activity", panel: "Activity panel" },
  { value: "settings", label: "Settings", panel: "Settings panel" },
];

/** One item definition by position, checked. */
function item(index: number): TabItem {
  const found = ITEMS[index];
  if (found === undefined) throw new Error("no item at index " + index);
  return found;
}

/** Every tab, by role. */
function tabs(): HTMLElement[] {
  return screen.getAllByRole("tab");
}

/** One tab by position. */
function tab(index: number): HTMLElement {
  const found = tabs()[index];
  if (found === undefined) throw new Error(`no tab at index ${index}`);
  return found;
}

describe("TabBar: rendering", () => {
  it("is a tablist of tabs", () => {
    render(<TabBar label="Sections" items={ITEMS} />);

    expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
    expect(tabs()).toHaveLength(3);
    expect(tab(0)).toHaveAttribute("aria-selected", "true");
  });

  it("selects the first item by default", () => {
    render(<TabBar label="Sections" items={ITEMS} />);

    expect(tab(0)).toHaveAttribute("aria-selected", "true");
    expect(tab(1)).toHaveAttribute("aria-selected", "false");
  });

  it("associates each panel with its tab, both ways", () => {
    render(<TabBar label="Sections" items={ITEMS} />);

    const panel = screen.getByRole("tabpanel");
    // The two directions of the association are the whole point of the pattern.
    expect(tab(0)).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab(0).id);
  });

  it("gives panels a tab stop, so their overflow is reachable", () => {
    render(<TabBar label="Sections" items={ITEMS} />);

    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
  });

  it("hides the unselected panels but keeps them mounted", () => {
    const { container } = render(<TabBar label="Sections" items={ITEMS} />);

    const panels = container.querySelectorAll(".uir-tab-bar__panel");
    expect(panels).toHaveLength(3);
    expect(panels[0]).not.toHaveAttribute("hidden");
    // Hidden rather than unmounted, so find-in-page still finds text in another tab.
    expect(panels[1]).toHaveAttribute("hidden");
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(3);
  });

  it("unmounts the unselected panels when lazy is set", () => {
    const { container } = render(<TabBar label="Sections" items={ITEMS} lazy />);

    // Cheaper, and it costs find-in-page — which is why it is opt-in.
    expect(container.querySelectorAll(".uir-tab-bar__panel")).toHaveLength(1);
    expect(screen.queryAllByRole("tabpanel", { hidden: true })).toHaveLength(1);
  });

  it("omits aria-orientation on a horizontal bar, the platform default", () => {
    render(<TabBar label="Sections" items={ITEMS} />);

    // Redundant markup for every reader on every horizontal tab bar.
    expect(screen.getByRole("tablist")).not.toHaveAttribute("aria-orientation");
  });

  it("states aria-orientation on a vertical bar", () => {
    render(<TabBar label="Sections" items={ITEMS} orientation="vertical" />);

    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("renders a badge inside the tab's name", () => {
    render(
      <TabBar
        label="Sections"
        items={[{ value: "errors", label: "Errors", badge: "3", panel: "p" }]}
      />
    );

    // A count inside a tab a screen reader cannot announce is a count only sighted users see.
    expect(tab(0)).toHaveAccessibleName("Errors 3");
  });

  it("uses textValue for a rich label", () => {
    render(
      <TabBar
        label="Sections"
        items={[{ value: "a", label: <strong>Bold</strong>, textValue: "Bold tab" }]}
      />
    );

    expect(tab(0)).toHaveAccessibleName("Bold tab");
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(<TabBar label="Sections" items={ITEMS} orientation="vertical" />);

    const root = container.querySelector(".uir-tab-bar") as HTMLElement;
    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(root).toHaveAttribute("data-scrollable", "");
    expect(root.className).not.toMatch(/vertical/);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(
      <TabBar label="Sections" items={ITEMS} className="consumer-class" />
    );

    expect(container.querySelector(".uir-tab-bar")).toHaveClass("uir-tab-bar", "consumer-class");
  });

  it("renders no panel for an item without one", () => {
    const { container } = render(<TabBar label="Sections" items={[{ value: "a", label: "A" }]} />);

    expect(container.querySelectorAll(".uir-tab-bar__panel")).toHaveLength(0);
    expect(tab(0)).toBeInTheDocument();
  });

  it("omits aria-controls on a tab with no panel", () => {
    render(
      <TabBar
        label="Sections"
        items={[
          { value: "a", label: "With", panel: "p" },
          { value: "b", label: "Without" },
        ]}
      />
    );

    /*
     * An `aria-controls` pointing at an id that does not exist is an invalid ARIA value and axe
     * reports it as critical — a reference that resolves to nothing tells a screen reader the tab is
     * broken.
     */
    expect(tab(0)).toHaveAttribute("aria-controls");
    expect(tab(1)).not.toHaveAttribute("aria-controls");
  });
});

describe("TabBar: keyboard", () => {
  it("is a single tab stop", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <TabBar label="Sections" items={ITEMS} />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Before");
    await user.tab();
    // Exactly one tab is tabbable. Every tab being tabbable would make a three-tab strip cost four
    // presses to cross.
    expect(document.activeElement).toBe(tab(0));

    await user.tab();
    // The panel is a tab stop of its own, per the APG: it has to be focusable or its overflow is
    // unreachable from the keyboard.
    expect(document.activeElement).toBe(screen.getByRole("tabpanel"));
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("moves focus with the arrows without selecting, under manual activation", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} />);

    tab(0).focus();
    await user.keyboard("{ArrowRight}");

    // The distinction the whole component exists for.
    expect(document.activeElement).toBe(tab(1));
    expect(tab(0)).toHaveAttribute("aria-selected", "true");
    expect(tab(1)).toHaveAttribute("aria-selected", "false");
  });

  it("selects the focused tab with Enter", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} />);

    tab(0).focus();
    await user.keyboard("{ArrowRight}{Enter}");

    expect(tab(1)).toHaveAttribute("aria-selected", "true");
  });

  it("selects the focused tab with Space, and does not scroll the page", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} />);

    tab(0).focus();
    await user.keyboard("{ArrowRight}{ }");

    expect(tab(1)).toHaveAttribute("aria-selected", "true");
  });

  it("wraps at both ends", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} />);

    tab(0).focus();
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tab(2));

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab(0));
  });

  it("jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} />);

    tab(0).focus();
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(tab(2));

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(tab(0));
  });

  it("moves from focus, not from the selection", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} defaultValue="settings" />);

    tab(0).focus();
    await user.keyboard("{ArrowRight}");

    /*
     * Stepping from the selection would compute `(-1 + 1) % 3 === 0` and land back on the tab the
     * user is already standing on, so the first arrow press would appear to do nothing.
     */
    expect(document.activeElement).toBe(tab(1));
  });

  it("skips disabled tabs", async () => {
    const user = userEvent.setup();
    render(
      <TabBar
        label="Sections"
        items={[item(0), { ...item(1), disabled: true }, item(2)]}
        defaultValue="overview"
      />
    );

    tab(0).focus();
    await user.keyboard("{ArrowRight}{Enter}");

    expect(tab(2)).toHaveAttribute("aria-selected", "true");
    expect(tab(1)).toHaveAttribute("aria-selected", "false");
  });

  it("keeps a disabled tab visible and rendered", () => {
    render(<TabBar label="Sections" items={[item(0), { ...item(1), disabled: true }]} />);

    // A strip with a tab missing entirely lies about what the section contains.
    expect(tabs()).toHaveLength(2);
    expect(tab(1)).toBeDisabled();
  });

  it("does not move focus when every tab is disabled", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS.map((item) => ({ ...item, disabled: true }))} />);

    tab(0).focus();
    await user.keyboard("{ArrowRight}{Home}{End}");

    expect(tab(0)).not.toHaveAttribute("aria-selected", "true");
  });

  it("selects on click", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} />);

    await user.click(tab(2));

    expect(tab(2)).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(tab(2));
  });

  it("is skipped by Tab entirely when disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TabBar label="Sections" items={ITEMS} disabled />
        <button type="button">After</button>
      </>
    );

    // Every tab is disabled, so the native `disabled` takes all three out of the tab order — which is
    // why the panel is the only stop left before `After`.
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("tabpanel"));
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });
});

describe("TabBar: automatic activation", () => {
  it("selects as focus moves on a vertical bar", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} orientation="vertical" />);

    // A vertical strip is a listbox, so the arrows do what Enter does on a horizontal one.
    tab(0).focus();
    await user.keyboard("{ArrowDown}");

    expect(tab(1)).toHaveAttribute("aria-selected", "true");
  });

  it("stays manual on a horizontal bar even when asked", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} activation="manual" orientation="vertical" />);

    tab(0).focus();
    await user.keyboard("{ArrowDown}");

    expect(tab(1)).not.toHaveAttribute("aria-selected", "true");
  });

  it("can be forced to automatic on a horizontal bar", async () => {
    const user = userEvent.setup();
    render(<TabBar label="Sections" items={ITEMS} activation="automatic-activation" />);

    tab(0).focus();
    await user.keyboard("{ArrowRight}");

    expect(tab(1)).toHaveAttribute("aria-selected", "true");
  });
});

describe("TabBar: controlled and uncontrolled", () => {
  it("reports each selection when uncontrolled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TabBar label="Sections" items={ITEMS} onValueChange={onValueChange} />);

    await user.click(tab(1));

    expect(onValueChange).toHaveBeenCalledWith("activity");
    expect(tab(1)).toHaveAttribute("aria-selected", "true");
  });

  it("stays controlled when value is provided", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TabBar label="Sections" items={ITEMS} value="overview" onValueChange={onValueChange} />
    );

    await user.click(tab(1));

    expect(onValueChange).toHaveBeenCalledWith("activity");
    // React is the source of truth; we report and the consumer decides.
    expect(tab(0)).toHaveAttribute("aria-selected", "true");
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState("overview");
      return (
        <>
          <TabBar label="Sections" items={ITEMS} value={value} onValueChange={setValue} />
          <output aria-label="Current">{value}</output>
        </>
      );
    }

    render(<Controlled />);
    await user.click(tab(1));

    expect(screen.getByLabelText("Current")).toHaveTextContent("activity");
  });

  it("reads defaultValue only at mount", () => {
    const { rerender } = render(<TabBar label="Sections" items={ITEMS} defaultValue="overview" />);
    rerender(<TabBar label="Sections" items={ITEMS} defaultValue="settings" />);

    expect(tab(0)).toHaveAttribute("aria-selected", "true");
  });

  it("moves the tab stop when a controlled selection changes from outside", () => {
    const { rerender } = render(<TabBar label="Sections" items={ITEMS} value="overview" />);
    expect(tab(0)).toHaveAttribute("tabindex", "0");

    rerender(<TabBar label="Sections" items={ITEMS} value="settings" />);

    // The tab stop follows the answer, so Tab re-enters where the user last was.
    expect(tab(2)).toHaveAttribute("tabindex", "0");
    expect(tab(0)).toHaveAttribute("tabindex", "-1");
  });

  it("shows the newly selected panel", async () => {
    const user = userEvent.setup();
    const { container } = render(<TabBar label="Sections" items={ITEMS} />);

    await user.click(tab(1));

    const panels = container.querySelectorAll(".uir-tab-bar__panel");
    expect(panels[0]).toHaveAttribute("hidden");
    expect(panels[1]).not.toHaveAttribute("hidden");
  });
});

describe("TabBar: per-tab tone", () => {
  it("states a tone per tab, so a strip can mix states", () => {
    render(
      <TabBar
        label="Sections"
        items={[
          { value: "a", label: "Errors", tone: "danger" },
          { value: "b", label: "Overview", tone: "neutral" },
        ]}
      />
    );

    expect(tab(0)).toHaveAttribute("data-tone", "danger");
    expect(tab(1)).toHaveAttribute("data-tone", "neutral");
  });

  it("reports the selected tab's tone on the root", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TabBar
        label="Sections"
        items={[
          { value: "a", label: "Errors", tone: "danger" },
          { value: "b", label: "Fine", tone: "positive" },
        ]}
      />
    );

    const root = container.querySelector(".uir-tab-bar") as HTMLElement;
    expect(root).toHaveAttribute("data-tone", "danger");

    await user.click(tab(1));
    expect(root).toHaveAttribute("data-tone", "positive");
  });
});

describe("TabBar: direction and scheme", () => {
  it("works in an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TabBar label="الأقسام" items={ITEMS.map((i) => ({ ...i, label: i.label }))} />,
      { dir: "rtl" }
    );

    tab(0).focus();
    await user.keyboard("{ArrowRight}{Enter}");

    // A tab strip is a cycle, not a document: the keys move through it and the writing direction does
    // not reverse it.
    expect(tab(1)).toHaveAttribute("aria-selected", "true");
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <TabBar
          label="Sections"
          items={[
            { ...item(0), tone: "danger" },
            { value: "b", label: "Fine", badge: "2", tone: "positive", panel: "p" },
          ]}
        />,
        { scheme }
      );

      expect(within(screen.getByRole("tablist")).getAllByRole("tab"), scheme).toHaveLength(2);
      unmount();
    }
  });
});
