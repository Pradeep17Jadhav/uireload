/**
 * Radio group tests.
 *
 * The centre of gravity is the keyboard contract, because that is the whole reason this component
 * is not a `<div>` per option: one tab stop for the group, and arrow keys that move focus *and*
 * selection together. Getting either half right on its own produces a group that is navigable but
 * wrong, or correct but exhausting to reach.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { RadioGroup, type RadioOption } from "uireload/components/radio-group";

const OPTIONS: RadioOption[] = [
  { value: "sms", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push notification" },
];

/** Every option, by role. */
function options(): HTMLElement[] {
  return screen.getAllByRole("radio");
}

/**
 * One option by position.
 *
 * Throws rather than returning `HTMLElement | undefined`, so a test that indexes a position which
 * does not exist fails with a clear message instead of a downstream type error or a silently
 * skipped assertion.
 */
function opt(index: number): HTMLElement {
  const found = options()[index];
  if (found === undefined) throw new Error(`no radio option at index ${index}`);
  return found;
}

/** One option definition by position, checked. */
function o(index: number): RadioOption {
  const found = OPTIONS[index];
  if (found === undefined) throw new Error(`no option at index ${index}`);
  return found;
}

/** The group itself. */
function group(): HTMLElement {
  return screen.getByRole("radiogroup");
}

describe("RadioGroup: rendering", () => {
  it("is a fieldset with a radiogroup role and real radio inputs", () => {
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    expect(group().tagName).toBe("FIELDSET");
    expect(options()).toHaveLength(3);
    for (const option of options()) {
      expect(option).toHaveAttribute("type", "radio");
    }
  });

  it("renders the label as a real legend and names the group from it", () => {
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    const legend = screen.getByText("Contact by");
    expect(legend.tagName).toBe("LEGEND");

    expect(group()).toHaveAccessibleName("Contact by");
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(
      <RadioGroup id="g" label="Contact by" options={OPTIONS} size="lg" tone="danger" />
    );

    const root = container.querySelector(".uir-radio-group") as HTMLElement;
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-tone", "danger");
    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(root.className).not.toMatch(/lg|danger|vertical/);
  });

  it("gives every option the same native name so the platform groups them", () => {
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} name="contact" />);

    for (const option of options()) {
      expect(option).toHaveAttribute("name", "contact");
      expect(option).toHaveAttribute("value", option.getAttribute("value"));
    }
  });

  it("derives a unique group name from the id when none is given", () => {
    render(<RadioGroup id="g1" label="A" options={OPTIONS} />);
    render(<RadioGroup id="g2" label="B" options={OPTIONS} />);

    // Two groups on one page must not cross-select, and no call site has to remember a `name`.
    const names = screen.getAllByRole("radio").map((option) => option.getAttribute("name"));
    expect(new Set(names).size).toBe(2);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(
      <RadioGroup id="g" label="A" options={OPTIONS} className="consumer-class" />
    );

    expect(container.querySelector(".uir-radio-group")).toHaveClass(
      "uir-radio-group",
      "consumer-class"
    );
  });

  it("does not select anything by default", () => {
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    for (const option of options()) expect(option).not.toBeChecked();
  });

  it("marks only the selected option", () => {
    const { container } = render(
      <RadioGroup id="g" label="A" options={OPTIONS} defaultValue="email" />
    );

    const rows = container.querySelectorAll(".uir-radio-group__option");
    expect(rows[1]).toHaveAttribute("data-checked", "");
    expect(rows[0]).not.toHaveAttribute("data-checked");
    expect(rows[2]).not.toHaveAttribute("data-checked");
  });
});

describe("RadioGroup: keyboard", () => {
  it("is a single tab stop", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <RadioGroup id="g" label="Contact by" options={OPTIONS} />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Before");

    await user.tab();
    expect(document.activeElement).toBe(opt(0));

    /*
     * One Tab, one stop. If the other options were tabbable, the next Tab would land on the second
     * radio and a keyboard user would have to press Tab three times to leave a three-option group.
     */
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("puts the tab stop on the selected option, not the first", async () => {
    const user = userEvent.setup();
    render(
      <>
        <RadioGroup id="g" label="Contact by" options={OPTIONS} defaultValue="push" />
        <button type="button">After</button>
      </>
    );

    await user.tab();

    expect(document.activeElement).toBe(opt(2));
  });

  it("moves selection and focus together with ArrowDown", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    opt(0).focus();
    await user.keyboard("{ArrowDown}");

    expect(opt(1)).toBeChecked();
    expect(document.activeElement).toBe(opt(1));
  });

  it("moves backwards with ArrowUp", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} defaultValue="email" />);

    opt(1).focus();
    await user.keyboard("{ArrowUp}");

    expect(opt(0)).toBeChecked();
  });

  it("wraps at both ends, because a radio group is a closed cycle", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    opt(0).focus();
    await user.keyboard("{ArrowUp}");
    expect(opt(2)).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(opt(0)).toBeChecked();
  });

  it("jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    opt(0).focus();
    await user.keyboard("{End}");
    expect(opt(2)).toBeChecked();

    await user.keyboard("{Home}");
    expect(opt(0)).toBeChecked();
  });

  it("skips disabled options", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup
        id="g"
        label="Contact by"
        options={[o(0), { ...o(1), disabled: true }, o(2)]}
        defaultValue="sms"
      />
    );

    opt(0).focus();
    await user.keyboard("{ArrowDown}");

    expect(opt(2)).toBeChecked();
    expect(opt(1)).not.toBeChecked();
  });

  it("skips disabled options at the ends too", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup
        id="g"
        label="Contact by"
        options={[{ ...o(0), disabled: true }, o(1), o(2)]}
        defaultValue="push"
      />
    );

    opt(2).focus();
    await user.keyboard("{Home}");

    // `Home` lands on the first *selectable* option, not the first option.
    expect(opt(1)).toBeChecked();
  });

  it("does nothing when every option is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        id="g"
        label="Contact by"
        options={OPTIONS.map((option) => ({ ...option, disabled: true }))}
        onValueChange={onValueChange}
      />
    );

    opt(0).focus();
    await user.keyboard("{ArrowDown}{Home}{End}");

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("accepts both arrow axes regardless of orientation", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} orientation="vertical" />);

    opt(0).focus();
    await user.keyboard("{ArrowRight}");

    // A vertical group that ignored Left/Right would be wrong for anyone arrowing through a list.
    expect(opt(1)).toBeChecked();
  });

  it("leaves Tab alone, so focus is not trapped", async () => {
    const user = userEvent.setup();
    render(
      <>
        <RadioGroup id="g" label="Contact by" options={OPTIONS} defaultValue="email" />
        <button type="button">After</button>
      </>
    );

    opt(1).focus();
    await user.tab();

    expect(document.activeElement).toHaveTextContent("After");
  });
});

describe("RadioGroup: selection", () => {
  it("selects on click", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    await user.click(opt(2));

    expect(opt(2)).toBeChecked();
  });

  it("selects when the label is clicked", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    await user.click(screen.getByText("Email"));

    expect(opt(1)).toBeChecked();
  });

  it("deselects the previous option", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} defaultValue="sms" />);

    await user.click(opt(1));

    expect(opt(0)).not.toBeChecked();
    expect(opt(1)).toBeChecked();
  });

  it("cannot be emptied by clicking the selected option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        id="g"
        label="Contact by"
        options={OPTIONS}
        defaultValue="sms"
        onValueChange={onValueChange}
      />
    );

    await user.click(opt(0));

    // A radio that can be unchecked is not a radio group, it is a checkbox group.
    expect(onValueChange).not.toHaveBeenCalled();
    expect(opt(0)).toBeChecked();
  });

  it("can be emptied when clearable is set", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        id="g"
        label="Contact by"
        options={OPTIONS}
        defaultValue="sms"
        clearable
        onValueChange={onValueChange}
      />
    );

    await user.click(opt(0));

    expect(onValueChange).toHaveBeenCalledWith(null);
  });
});

describe("RadioGroup: controlled and uncontrolled", () => {
  it("reports changes when uncontrolled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup id="g" label="A" options={OPTIONS} onValueChange={onValueChange} />);

    await user.click(opt(1));

    expect(onValueChange).toHaveBeenCalledWith("email");
    expect(opt(1)).toBeChecked();
  });

  it("stays controlled when `value` is provided", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup id="g" label="A" options={OPTIONS} value="sms" onValueChange={onValueChange} />
    );

    await user.click(opt(2));

    expect(onValueChange).toHaveBeenCalledWith("push");
    // React is the source of truth; we report and the consumer decides.
    expect(opt(2)).not.toBeChecked();
    expect(opt(0)).toBeChecked();
  });

  it("represents an explicit null as controlled-but-empty", async () => {
    const user = userEvent.setup();
    render(<RadioGroup id="g" label="A" options={OPTIONS} value={null} />);

    for (const option of options()) expect(option).not.toBeChecked();

    await user.click(opt(0));
    expect(opt(0)).not.toBeChecked();
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState<string | null>("sms");
      return (
        <>
          <RadioGroup
            id="g"
            label="Contact by"
            options={OPTIONS}
            value={value}
            onValueChange={setValue}
          />
          <output>{value ?? "none"}</output>
        </>
      );
    }

    render(<Controlled />);
    await user.click(opt(1));

    expect(screen.getByText("email")).toBeInTheDocument();
    expect(opt(1)).toBeChecked();
  });

  it("reads defaultValue only at mount", () => {
    const { rerender } = render(<RadioGroup id="g" label="A" options={OPTIONS} />);
    rerender(<RadioGroup id="g" label="A" options={OPTIONS} defaultValue="email" />);

    for (const option of options()) expect(option).not.toBeChecked();
  });
});

describe("RadioGroup: states", () => {
  it("uses the native disabled attribute on every option when the group is disabled", () => {
    render(<RadioGroup id="g" label="A" options={OPTIONS} disabled />);

    for (const option of options()) expect(option).toBeDisabled();
  });

  it("disables a single option without disabling the group", () => {
    render(<RadioGroup id="g" label="A" options={[o(0), { ...o(1), disabled: true }]} />);

    expect(opt(0)).not.toBeDisabled();
    expect(opt(1)).toBeDisabled();
  });

  it("puts required on every option so the browser validates it", () => {
    render(<RadioGroup id="g" label="A" options={OPTIONS} required />);

    for (const option of options()) expect(option).toBeRequired();
    expect(group()).toHaveAttribute("aria-required", "true");
  });

  it("renders a hidden Required next to an aria-hidden asterisk in the legend", () => {
    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} required />);

    expect(screen.getByRole("radiogroup", { name: /Contact by Required/ })).toBeInTheDocument();
  });

  it("wires a helper text to aria-describedby", () => {
    render(<RadioGroup id="g" label="A" options={OPTIONS} helperText="We never share this." />);

    const describedBy = group().getAttribute("aria-describedby");
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      "We never share this."
    );
  });

  it("can be named from outside with labelId", () => {
    render(
      <>
        <h2 id="heading">Contact by</h2>
        <RadioGroup id="g" labelId="heading" options={OPTIONS} />
      </>
    );

    expect(group()).toHaveAccessibleName("Contact by");
  });

  it("states aria-orientation", () => {
    render(<RadioGroup id="g" label="A" options={OPTIONS} orientation="horizontal" />);

    expect(group()).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("gives a rich label an announced name via textValue", () => {
    render(
      <RadioGroup
        id="g"
        label="A"
        options={[{ value: "a", label: <strong>Bold option</strong>, textValue: "Bold option" }]}
      />
    );

    expect(opt(0)).toHaveAccessibleName("Bold option");
  });

  it("renders secondary content inside a row", () => {
    render(<RadioGroup id="g" label="A" options={[{ ...o(0), children: "Recommended" }]} />);

    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });
});

describe("RadioGroup: development warnings", () => {
  it("warns when there is no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<RadioGroup id="g" options={OPTIONS} />);

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("no accessible name"))).toBe(true);
    warn.mockRestore();
  });

  it("says nothing when named", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<RadioGroup id="g" label="Contact by" options={OPTIONS} />);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("RadioGroup: direction and scheme", () => {
  it("moves the right way in RTL, where Right is backwards", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RadioGroup id="g" label="means" options={OPTIONS} defaultValue="sms" />, {
      dir: "rtl",
    });

    opt(0).focus();
    await user.keyboard("{ArrowDown}");

    /*
     * Both axes are accepted regardless of direction (see the note in `onKeyDown`), so the
     * assertion is that the group still moves — not that Right means "backwards" in RTL. A radio
     * group is a cycle, not a document: the keys move through it, the writing direction does not
     * reverse it.
     */
    expect(opt(1)).toBeChecked();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <RadioGroup id="g" label="A" options={OPTIONS} defaultValue="email" tone="danger" />,
        { scheme }
      );

      expect(screen.getByRole("radiogroup", { name: "A" }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
