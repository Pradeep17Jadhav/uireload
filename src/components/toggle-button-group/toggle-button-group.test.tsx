/**
 * ToggleButtonGroup tests.
 *
 * The centre of gravity here is the role and keyboard contract, because that is what
 * the component exists to get right and where MUI's ToggleButtonGroup has none. See
 * `toggle-button-group.tsx` for the reasoning.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { ToggleButton } from "uireload/components/toggle-button";
import { ToggleButtonGroup } from "uireload/components/toggle-button-group";

const ITEMS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "map", label: "Map" },
];

describe("ToggleButtonGroup: roles", () => {
  it("is a radiogroup in single mode", () => {
    render(
      <ToggleButtonGroup label="View">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    // "Choose exactly one" is the APG radio-group pattern.
    expect(screen.getByRole("radiogroup", { name: "View" })).toBeInTheDocument();
  });

  it("renders members as radios with aria-checked in single mode", () => {
    render(
      <ToggleButtonGroup label="View" defaultValue="list">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "false");
  });

  it("never emits aria-pressed alongside aria-checked in single mode", () => {
    render(
      <ToggleButtonGroup label="View" defaultValue="grid">
        <ToggleButton value="grid">Grid</ToggleButton>
      </ToggleButtonGroup>
    );

    const radio = screen.getByRole("radio");
    expect(radio).toHaveAttribute("aria-checked", "true");
    // Both attributes at once is an ARIA conflict.
    expect(radio).not.toHaveAttribute("aria-pressed");
  });

  it("is a group of pressed buttons in multiple mode", () => {
    render(
      <ToggleButtonGroup label="Filters" selectionMode="multiple">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Grid" })).toHaveAttribute("aria-pressed", "false");
  });

  it("exposes aria-orientation on a vertical radiogroup", () => {
    render(
      <ToggleButtonGroup label="View" orientation="vertical">
        <ToggleButton value="a">A</ToggleButton>
      </ToggleButtonGroup>
    );

    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("omits aria-orientation while horizontal, since that is the default", () => {
    render(
      <ToggleButtonGroup label="View">
        <ToggleButton value="a">A</ToggleButton>
      </ToggleButtonGroup>
    );

    expect(screen.getByRole("radiogroup")).not.toHaveAttribute("aria-orientation");
  });

  it("omits aria-orientation on a group, which does not allow it", () => {
    // `aria-allowed-attr` (critical). `role="group"` does not support
    // `aria-orientation`, and there is no correct alternative to express it, so it is
    // simply not emitted. Caught by `tests/accessibility.test.tsx`.
    render(
      <ToggleButtonGroup label="Filters" selectionMode="multiple" orientation="vertical">
        <ToggleButton value="a">A</ToggleButton>
      </ToggleButtonGroup>
    );

    expect(screen.getByRole("group")).not.toHaveAttribute("aria-orientation");
  });
});

describe("ToggleButtonGroup: selection", () => {
  it("selects a member on click", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="View">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
  });

  it("does not clear a single selection by re-pressing it", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="View" defaultValue="grid">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.click(screen.getByRole("radio", { name: "Grid" }));
    // Radio-group behaviour: a radio cannot be unchecked by pressing it.
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
  });

  it("toggles members in and out in multiple mode", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="Filters" selectionMode="multiple">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    const grid = screen.getByRole("button", { name: "Grid" });
    const list = screen.getByRole("button", { name: "List" });

    await user.click(grid);
    await user.click(list);
    expect(grid).toHaveAttribute("aria-pressed", "true");
    expect(list).toHaveAttribute("aria-pressed", "true");

    await user.click(grid);
    expect(grid).toHaveAttribute("aria-pressed", "false");
    expect(list).toHaveAttribute("aria-pressed", "true");
  });

  it("stays controlled when `value` is provided", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <ToggleButtonGroup label="View" value="grid" onValueChange={onValueChange}>
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.click(screen.getByRole("radio", { name: "List" }));

    expect(onValueChange).toHaveBeenCalledWith("list");
    // React is the source of truth; the group reports and waits.
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "false");
  });

  it("passes the full array to onValueChange in multiple mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <ToggleButtonGroup label="Filters" selectionMode="multiple" onValueChange={onValueChange}>
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.click(screen.getByRole("button", { name: "Grid" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["grid"]);

    await user.click(screen.getByRole("button", { name: "List" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["grid", "list"]);
  });

  it("lets a consumer opt out of selection with preventDefault", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());

    render(
      <ToggleButtonGroup label="View">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value} onClick={onClick}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.click(screen.getByRole("radio", { name: "List" }));

    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "false");
  });
});

describe("ToggleButtonGroup: keyboard", () => {
  it("has exactly one tab stop, on the selected member", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ToggleButtonGroup label="View" defaultValue="list">
          {ITEMS.map((item) => (
            <ToggleButton key={item.value} value={item.value}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    // Tab lands on the selected member, skipping the other two entirely.
    expect(document.activeElement).toHaveTextContent("List");

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("puts the tab stop on the first member when nothing is selected", () => {
    render(
      <ToggleButtonGroup label="View">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus and selection with arrow keys in single mode", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="View" defaultValue="grid">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Grid");

    await user.keyboard("{ArrowRight}");
    // APG radio-group: selection follows focus.
    expect(document.activeElement).toHaveTextContent("List");
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Map" })).toHaveAttribute("aria-checked", "true");
  });

  it("wraps at the ends", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="View" defaultValue="map">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
  });

  it("uses the block axis for a vertical group", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="View" orientation="vertical" defaultValue="grid">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveTextContent("List");

    // The inline axis is inert on a vertical group.
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveTextContent("List");
  });

  it("jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="View" defaultValue="grid">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.tab();
    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Map" })).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
  });

  it("activates with Space, like any button", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="View" defaultValue="grid">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
  });

  it("gives every member its own tab stop in multiple mode", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ToggleButtonGroup label="Filters" selectionMode="multiple">
          {ITEMS.map((item) => (
            <ToggleButton key={item.value} value={item.value}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Grid");

    // No roving tabindex: each toggle is independently reachable, which is what a set
    // of independent toggles means.
    await user.tab();
    expect(document.activeElement).toHaveTextContent("List");

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Map");
  });

  it("does not select on arrow keys in multiple mode", async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup label="Filters" selectionMode="multiple">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    // Arrow keys are inert here; only Space or Enter toggles.
    expect(screen.getByRole("button", { name: "Grid" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("ToggleButtonGroup: propagation", () => {
  it("applies its size, variant and tone to every member", () => {
    render(
      <ToggleButtonGroup label="View" size="lg" variant="solid" tone="danger">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    for (const button of screen.getAllByRole("radio")) {
      expect(button).toHaveAttribute("data-size", "lg");
      expect(button).toHaveAttribute("data-variant", "solid");
      expect(button).toHaveAttribute("data-tone", "danger");
    }
  });

  it("disables every member when the group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <ToggleButtonGroup label="View" disabled onValueChange={onValueChange}>
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    expect(screen.getByRole("radio", { name: "Grid" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Grid" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("marks members as grouped so CSS can collapse the seams", () => {
    render(
      <ToggleButtonGroup label="View">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );

    for (const button of screen.getAllByRole("radio")) {
      expect(button).toHaveAttribute("data-grouped", "");
    }
  });
});

describe("ToggleButtonGroup: composition", () => {
  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState<string | null>("grid");
      return (
        <>
          <ToggleButtonGroup label="View" value={value} onValueChange={setValue}>
            {ITEMS.map((item) => (
              <ToggleButton key={item.value} value={item.value}>
                {item.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <output>{value ?? "none"}</output>
        </>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("radio", { name: "Map" }));

    expect(screen.getByText("map")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Map" })).toHaveAttribute("aria-checked", "true");
  });
});

describe("ToggleButtonGroup: no DOM leakage", () => {
  /*
   * The group read `selectionMode`, `value`, `defaultValue` and `onValueChange` as
   * `props.x` instead of destructuring them, so they stayed in `...rest` and reached the
   * DOM: React lowercases an unrecognised camelCase attribute and passes it straight
   * through, so the rendered element carried `selectionmode="single"`.
   *
   * Nothing caught it. jsdom does not warn about unknown attributes, and no assertion
   * looked at the group's own attributes. Asserting the exact set catches the class.
   */
  it("renders no attribute the group does not own", () => {
    render(
      <ToggleButtonGroup label="View" defaultValue="grid" data-testid="group">
        <ToggleButton value="grid">Grid</ToggleButton>
      </ToggleButtonGroup>
    );

    const group = screen.getByTestId("group");
    const allowed = new Set([
      "aria-label",
      "aria-orientation",
      "class",
      "data-orientation",
      "data-selection-mode",
      "data-testid",
      "role",
    ]);

    for (const name of group.getAttributeNames()) {
      expect(allowed.has(name), `unexpected attribute ${name}="${group.getAttribute(name)}"`).toBe(
        true
      );
    }
  });

  it("never emits value, selectionMode or defaultValue on the group element", () => {
    render(
      <ToggleButtonGroup
        label="View"
        value="grid"
        onValueChange={() => undefined}
        data-testid="group"
      >
        <ToggleButton value="grid">Grid</ToggleButton>
      </ToggleButtonGroup>
    );

    const names = screen.getByTestId("group").getAttributeNames();
    expect(names).not.toContain("value");
    expect(names).not.toContain("selectionmode");
    expect(names).not.toContain("defaultvalue");
  });
});

describe("ToggleButtonGroup: child validation", () => {
  /*
   * The group rebuilds each child so it can attach selection, which requires each child's
   * `value` prop. A child that is a component or a fragment wraps the real buttons one
   * level deeper, and the group collapses them into one valueless, label-less button.
   *
   * That was silent, and it is what this repository's own story did. A development error
   * is the difference between a usage mistake and a puzzling render.
   */
  it("logs an error when a child is not a ToggleButton", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    function Members() {
      return (
        <>
          <ToggleButton value="grid">Grid</ToggleButton>
          <ToggleButton value="list">List</ToggleButton>
        </>
      );
    }

    render(
      <ToggleButtonGroup label="View">
        <Members />
      </ToggleButtonGroup>
    );

    const messages = error.mock.calls.map((call) => String(call[0]));
    expect(
      messages.some((message) => message.includes("every child must be a <ToggleButton>")),
      `expected a child-type error, got: ${JSON.stringify(messages)}`
    ).toBe(true);

    error.mockRestore();
  });

  it("says nothing when every child is a ToggleButton", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ToggleButtonGroup label="View">
        <ToggleButton value="grid">Grid</ToggleButton>
        <ToggleButton value="list">List</ToggleButton>
      </ToggleButtonGroup>
    );

    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("ToggleButtonGroup: direction and scheme", () => {
  it("renders and operates inside an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ToggleButtonGroup label="عرض" defaultValue="grid">
        {ITEMS.map((item) => (
          <ToggleButton key={item.value} value={item.value}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>,
      { dir: "rtl" }
    );

    const group = screen.getByRole("radiogroup", { name: "عرض" });
    expect(group.parentElement).toHaveAttribute("dir", "rtl");

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <ToggleButtonGroup label="View" defaultValue="grid">
          <ToggleButton value="grid">Grid</ToggleButton>
        </ToggleButtonGroup>,
        { scheme }
      );

      expect(screen.getByRole("radiogroup", { name: "View" }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
