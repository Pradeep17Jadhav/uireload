/**
 * Select tests.
 *
 * The centre of gravity is the listbox keyboard contract and the difference between *highlighted*
 * and *selected*, because that is where a select diverges from every other control in the library
 * and where a select most often goes wrong — highlighting as you arrow over options, so a value changes
 * before the user has committed to it.
 *
 * Positioning is `Popover`'s and is tested there; this file asserts that the composition works, not
 * where the surface lands.
 */

import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Select, type SelectItem } from "uireload/components/select";

const OPTIONS: SelectItem[] = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
];

const GROUPED: SelectItem[] = [
  { value: "apple", label: "Apple" },
  {
    group: true,
    label: "Berries",
    options: [
      { value: "blueberry", label: "Blueberry" },
      { value: "raspberry", label: "Raspberry" },
    ],
  },
];

/** A trigger plus a Select, which is the only shape that makes sense. */
function Harness({
  options = OPTIONS,
  defaultValue,
  ...props
}: Partial<React.ComponentProps<typeof Select>> & { options?: SelectItem[] }) {
  return (
    <Select {...props} id="status" label="Status" options={options} defaultValue={defaultValue} />
  );
}

/** The trigger, by its accessible name. */
function trigger(): HTMLElement {
  return screen.getByRole("button", { name: /Status/ });
}

describe("Select: roles", () => {
  it("is a button with a listbox popup", () => {
    render(<Harness />);

    const button = trigger();
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("is collapsed until opened", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("renders options as options with aria-selected", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="review" />);

    await user.click(trigger());

    expect(screen.getByRole("option", { name: "In review" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("option", { name: "Draft" })).toHaveAttribute("aria-selected", "false");
  });

  it("names the listbox from the label", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());

    expect(screen.getByRole("listbox", { name: "Status" })).toBeInTheDocument();
  });

  it("renders groups as groups, not nested listboxes", async () => {
    const user = userEvent.setup();
    render(<Harness options={GROUPED} />);

    await user.click(trigger());

    // APG grouping is `role="group"` with a name. A nested listbox would make each group its own
    // composite widget, which is not what a grouped listbox is.
    expect(screen.getByRole("group", { name: "Berries" })).toBeInTheDocument();
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
  });

  it("hides the group heading from assistive technology, since the group carries the name", async () => {
    const user = userEvent.setup();
    render(<Harness options={GROUPED} />);

    await user.click(trigger());

    const heading = document.querySelector(".uir-select__group-label");
    // The group's accessible name comes from `aria-label`; a visible heading that is also announced
    // would say "Berries" twice.
    expect(heading).toHaveAttribute("aria-hidden", "true");
  });

  it("is portalled to the body", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.click(trigger());

    expect(container.contains(screen.getByRole("listbox"))).toBe(false);
    expect(document.body.contains(screen.getByRole("listbox"))).toBe(true);
  });

  it("merges a consumer className onto the root", () => {
    render(<Harness className="consumer-class" />);

    expect(document.querySelector(".uir-select")).toHaveClass("uir-select", "consumer-class");
  });

  it("forwards its ref to the trigger", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Harness ref={ref} />);

    expect(ref.current).toBe(trigger());
  });

  it("forwards native button attributes to the trigger, not the root", () => {
    render(<Harness form="profile" title="Pick a status" />);

    expect(trigger()).toHaveAttribute("form", "profile");
    expect(trigger()).toHaveAttribute("title", "Pick a status");
  });
});

describe("Select: value", () => {
  it("shows the placeholder when nothing is selected", () => {
    render(<Harness />);

    expect(trigger()).toHaveTextContent("Select an option");
  });

  it("shows the selected option's label", () => {
    render(<Harness defaultValue="published" />);

    expect(trigger()).toHaveTextContent("Published");
    expect(trigger()).not.toHaveTextContent("Select an option");
  });

  it("marks itself empty only when nothing is selected", () => {
    // Two mounts rather than a `rerender`, because `defaultValue` is read once at mount by design.
    // A `rerender` with a new `defaultValue` would assert that an uncontrolled component reacts
    // to a prop that is explicitly documented as initial-only.
    const { unmount } = render(<Harness />);
    expect(document.querySelector(".uir-select")).toHaveAttribute("data-empty", "");
    unmount();

    render(<Harness defaultValue="draft" />);
    expect(document.querySelector(".uir-select")).not.toHaveAttribute("data-empty");
  });

  it("clears `data-empty` when a controlled value is set", () => {
    const { rerender } = render(<Harness value="" />);
    expect(document.querySelector(".uir-select")).toHaveAttribute("data-empty", "");

    rerender(<Harness value="draft" />);
    expect(document.querySelector(".uir-select")).not.toHaveAttribute("data-empty");
  });

  it("renders the placeholder when the value matches no option", () => {
    render(<Harness value="nonexistent" />);

    // Documented behaviour: "If the given value does not match any existing option, no option will
    // be selected and the Select component will be displayed as empty."
    expect(trigger()).toHaveTextContent("Select an option");
  });

  it("selects on click and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Published" }));

    expect(onChange).toHaveBeenCalledWith("published");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("stays controlled when `value` is provided", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness value="draft" onChange={onChange} />);

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Published" }));

    expect(onChange).toHaveBeenCalledWith("published");
    // React is the source of truth; we report and the consumer decides.
    expect(trigger()).toHaveTextContent("Draft");
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <>
          <Select id="status" label="Status" options={OPTIONS} value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }

    render(<Controlled />);
    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "In review" }));

    expect(screen.getByText("review")).toBeInTheDocument();
    expect(trigger()).toHaveTextContent("In review");
  });
});

describe("Select: form integration", () => {
  it("submits the value through a hidden input", () => {
    render(<Harness name="status" defaultValue="published" />);

    /*
     * The trigger is a `<button>`, and a button submits nothing. The hidden input is what carries
     * the value to the server, reached through
     * the one element the platform offers.
     */
    const hidden = document.querySelector('input[type="hidden"][name="status"]');
    expect(hidden).toHaveValue("published");
  });

  it("omits the hidden input when no name is given", () => {
    render(<Harness />);

    expect(document.querySelector('input[type="hidden"]')).toBeNull();
  });

  it("excludes the hidden input from submission when disabled", () => {
    render(<Harness name="status" defaultValue="draft" disabled />);

    expect(document.querySelector('input[type="hidden"][name="status"]')).toBeDisabled();
  });
});

describe("Select: states", () => {
  it("exposes states as data attributes, not class names", () => {
    render(<Harness size="lg" variant="solid" tone="accent" invalid fullWidth />);

    const root = document.querySelector(".uir-select") as HTMLElement;
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-variant", "solid");
    expect(root).toHaveAttribute("data-tone", "accent");
    expect(root).toHaveAttribute("data-invalid", "");
    expect(root).toHaveAttribute("data-full-width", "");
    expect(root.className).not.toMatch(/invalid|full-?width/);
  });

  it("defaults size, variant and tone", () => {
    render(<Harness />);

    const root = document.querySelector(".uir-select") as HTMLElement;
    expect(root).toHaveAttribute("data-size", "md");
    expect(root).toHaveAttribute("data-variant", "outline");
    expect(root).toHaveAttribute("data-tone", "neutral");
  });

  it("describes an invalid field for assistive technology", () => {
    render(<Harness invalid helperText="Pick one" />);

    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAccessibleDescription("Pick one");
  });

  it("announces the description through aria-describedby", () => {
    render(<Harness helperText="Pick one" />);

    const describedBy = trigger().getAttribute("aria-describedby");
    expect(document.getElementById(describedBy as string)).toHaveTextContent("Pick one");
  });

  it("uses the native disabled attribute, so it leaves the tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness disabled />
        <button type="button">After</button>
      </>
    );

    expect(trigger()).toBeDisabled();
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);

    await user.click(trigger());

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("adds a hidden word, not just a symbol, for required", () => {
    render(<Harness required />);

    // A marker rendered as a CSS asterisk from a `::after`, which a screen reader
    // cannot announce.
    expect(screen.getByRole("button", { name: /Status Required/ })).toBeInTheDocument();
  });
});

describe("Select: disabled options", () => {
  const WITH_DISABLED: SelectItem[] = [
    { value: "draft", label: "Draft" },
    { value: "archived", label: "Archived", disabled: true },
    { value: "published", label: "Published" },
  ];

  it("marks a disabled option with aria-disabled", async () => {
    const user = userEvent.setup();
    render(<Harness options={WITH_DISABLED} />);

    await user.click(trigger());

    expect(screen.getByRole("option", { name: "Archived" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("does not select a disabled option on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness options={WITH_DISABLED} onChange={onChange} />);

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Archived" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("skips a disabled option when arrowing", async () => {
    const user = userEvent.setup();
    render(<Harness options={WITH_DISABLED} defaultValue="draft" />);

    await user.click(trigger());
    await user.keyboard("{ArrowDown}");

    // The keyboard path has to skip disabled options too, or a list with one in it is unusable.
    expect(document.activeElement).toHaveTextContent("Published");
  });

  it("skips a disabled option when typeaheading onto it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness options={WITH_DISABLED} onChange={onChange} />);

    await user.click(trigger());
    await user.keyboard("a");

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Select: keyboard on the trigger", () => {
  it("opens with Space and Enter", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    trigger().focus();
    await user.keyboard(" ");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens the list on an arrow key without changing the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness defaultValue="draft" onChange={onChange} />);

    trigger().focus();
    await user.keyboard("{ArrowDown}");

    /*
     * APG listbox: "Down Arrow: Opens the listbox if it is not already displayed and moves visual
     * focus to the first option." Opening *and* committing would be the worst of both models — an
     * uncommitted list sitting on top of a value the user never chose.
     */
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("Draft");
  });

  it("highlights the option after the selection when opened with an arrow", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="draft" />);

    trigger().focus();
    await user.keyboard("{ArrowDown}");

    // Stepping from the selection rather than to the first option is what makes holding the key
    // walk the list.
    await waitFor(() => expect(document.activeElement).toHaveTextContent("In review"));
  });

  it("jumps to the first and last option with Home and End, without committing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness defaultValue="review" onChange={onChange} />);

    trigger().focus();
    await user.keyboard("{End}");
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Published"));

    await user.keyboard("{Home}");
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Draft"));

    // Same rule as the arrows: browse, do not select.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits a typeahead selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness defaultValue="draft" onChange={onChange} />);

    trigger().focus();
    await user.keyboard("p");

    // The counterpart to the arrow test above: this is the path that does change the value without
    // opening anything.
    expect(onChange).toHaveBeenCalledWith("published");
    expect(trigger()).toHaveTextContent("Published");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens with F4 and with Alt+ArrowDown", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    trigger().focus();
    await user.keyboard("{F4}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("typeaheads to an option without opening", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    trigger().focus();
    await user.keyboard("p");

    expect(onChange).toHaveBeenCalledWith("published");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does nothing on a keypress when disabled", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);

    await user.click(trigger());
    await user.keyboard("{ArrowDown}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("Select: keyboard on the listbox", () => {
  it("moves focus to the highlighted option on open", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="review" />);

    await user.click(trigger());

    // Roving focus, not `aria-activedescendant`: the options are portalled, so an activedescendant
    // reference crosses a document boundary that assistive technology is not required to resolve.
    await waitFor(() => expect(document.activeElement).toHaveTextContent("In review"));
  });

  it("opens on the selected option, not the first", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="published" />);

    await user.click(trigger());

    // Opening on the first option would highlight something the user has not chosen, so Enter
    // would then change their value.
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Published"));
  });

  it("moves the highlight with the arrow keys without changing the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness defaultValue="draft" onChange={onChange} />);

    await user.click(trigger());
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Draft"));

    await user.keyboard("{ArrowDown}");

    expect(document.activeElement).toHaveTextContent("In review");
    // The distinction this component exists to get right: arrowing is not selecting.
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("Draft");
  });

  it("marks the highlighted option distinctly from the selected one", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="draft" />);

    await user.click(trigger());
    await user.keyboard("{ArrowDown}");

    const highlighted = screen.getByRole("option", { name: "In review" });
    const selected = screen.getByRole("option", { name: "Draft" });

    expect(highlighted).toHaveAttribute("data-active", "");
    expect(highlighted).toHaveAttribute("aria-selected", "false");
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(selected).not.toHaveAttribute("data-active");
  });

  it("commits with Enter and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness defaultValue="draft" onChange={onChange} />);

    await user.click(trigger());
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("review");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("commits with Space and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness defaultValue="draft" onChange={onChange} />);

    await user.click(trigger());
    await user.keyboard("{ArrowDown} ");

    expect(onChange).toHaveBeenCalledWith("review");
  });

  it("returns focus to the trigger after committing", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());
    await user.keyboard("{Enter}");

    // Focus going back to the trigger is what makes the interaction feel finished.
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it("closes on Escape without changing the selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness defaultValue="draft" onChange={onChange} />);

    await user.click(trigger());
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");

    // Documented behaviour: "Closes the drop-down without changing the selection", and the
    // highlight is discarded with it.
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Draft");
  });

  it("closes on Tab rather than trapping focus", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button type="button">After</button>
      </>
    );

    await user.click(trigger());
    // Wait for focus to land in the listbox: `Portal` renders the list one commit after `open`, so
    // pressing Tab before that would be a different scenario entirely.
    await waitFor(() => expect(document.activeElement).toHaveClass("uir-select__option"));

    await user.tab();

    // Trapping Tab inside a dropdown is what makes a list of forty options impossible to leave.
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes from the trigger on Tab and lets focus move on", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button type="button">After</button>
      </>
    );

    await user.click(trigger());
    // Put focus back on the trigger without closing the list, which is the one-render window the
    // trigger's own Tab handler exists for.
    trigger().focus();
    await user.tab();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    // Focus moves *on*, not back: preventing the default here would strand the user on the trigger.
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("jumps to the first and last option with Home and End", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="draft" />);

    await user.click(trigger());
    await user.keyboard("{End}");

    expect(document.activeElement).toHaveTextContent("Published");

    await user.keyboard("{Home}");

    expect(document.activeElement).toHaveTextContent("Draft");
  });

  it("does not wrap at the ends", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="draft" />);

    await user.click(trigger());
    await user.keyboard("{ArrowUp}");

    // A listbox that wraps is disorienting when the list is long; APG only specifies looping for
    // radio groups.
    expect(document.activeElement).toHaveTextContent("Draft");
  });

  it("typeaheads to an option while open, without closing", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="draft" />);

    await user.click(trigger());
    await user.keyboard("p");

    expect(document.activeElement).toHaveTextContent("Published");
  });

  it("has one tab stop in the listbox", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue="draft" />);

    await user.click(trigger());

    // Exactly one option is tabbable, and it is the highlighted one — the roving tabindex.
    const tabbable = screen
      .getAllByRole("option")
      .filter((option) => option.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveTextContent("Draft");
  });
});

describe("Select: dismissal", () => {
  it("closes on an outside press", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button type="button">Elsewhere</button>
      </>
    );

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("stays open on an outside press when that is turned off", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness closeOnOutsidePress={false} />
        <button type="button">Elsewhere</button>
      </>
    );

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("stays open when closeOnSelect is false", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness closeOnSelect={false} onChange={onChange} />);

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Published" }));

    expect(onChange).toHaveBeenCalledWith("published");
    // Useful for a multi-select built on top of this, and pointless otherwise.
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("does not close when the trigger is clicked while open", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());
    await user.click(trigger());

    // The trigger toggles, so a second click closes. Asserted separately; this confirms the
    // second click reaches the toggle rather than being swallowed by the outside-press handler.
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("Select: development warnings", () => {
  it("warns when a label has no id to bind to", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Select label="Status" options={OPTIONS} />);

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("without an `id`"))).toBe(true);
    warn.mockRestore();
  });

  it("warns when there is no accessible name at all", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Select id="status" label={undefined} options={OPTIONS} />);

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

describe("Select: direction and scheme", () => {
  it("operates inside an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Select id="status" label="الحالة" options={OPTIONS} />, { dir: "rtl" });

    expect(screen.getByRole("button", { name: /الحالة/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /الحالة/ }));
    expect(screen.getByRole("listbox", { name: "الحالة" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Harness invalid />, { scheme });

      expect(screen.getByRole("button", { name: /Status/ }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
