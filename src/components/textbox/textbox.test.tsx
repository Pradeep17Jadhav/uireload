/**
 * Textbox tests.
 *
 * The centre of gravity is name and description wiring, because that is what a text
 * field most often gets wrong in a way no visual review catches: a visible label that is
 * not associated, a helper message that is never announced, an `aria-invalid` that
 * disagrees with what is on screen.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Textbox } from "uireload/components/textbox";

/**
 * The component root.
 *
 * Reached by class rather than by `data-testid` because a `data-*` attribute passed to
 * `Textbox` is a *native* attribute and is forwarded to the `<input>`, which is where the
 * library's contract says it goes. That is the right destination for `data-testid` and
 * `aria-*` — the element a consumer queries or labels is the field — but it does mean the
 * wrapper has to be selected by its own class, exactly as consumer CSS would select it.
 */
function rootOf(container: HTMLElement): HTMLElement {
  const root = container.querySelector<HTMLElement>(".uir-textbox");
  if (root === null) throw new Error("no .uir-textbox root was rendered");
  return root;
}

describe("Textbox: rendering and naming", () => {
  it("renders a real input, so it is a textbox to the accessibility tree", () => {
    render(<Textbox id="name" aria-label="Name" />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("associates a visible label with the field", () => {
    render(<Textbox id="name" label="Full name" />);

    // The whole point of the `id` requirement: the label's `for` resolves to the input.
    expect(screen.getByRole("textbox", { name: "Full name" })).toBeInTheDocument();
    expect(screen.getByText("Full name")).toHaveAttribute("for", "name");
  });

  it("announces helper text through aria-describedby", () => {
    render(<Textbox id="email" label="Email" helperText="We never share it" />);

    const field = screen.getByRole("textbox", { name: "Email" });
    expect(field).toHaveAccessibleDescription("We never share it");
  });

  it("renders the description with the id aria-describedby points at", () => {
    render(<Textbox id="email" label="Email" helperText="We never share it" />);

    const field = screen.getByRole("textbox", { name: "Email" });
    const describedBy = field.getAttribute("aria-describedby");

    expect(describedBy).toBe("email-helper");
    expect(document.getElementById(describedBy as string)).toHaveTextContent("We never share it");
  });

  it("keeps a consumer's own aria-describedby rather than merging", () => {
    render(
      <>
        <p id="external">Set by the server</p>
        <Textbox
          id="email"
          label="Email"
          helperText="We never share it"
          aria-describedby="external"
        />
      </>
    );

    const field = screen.getByRole("textbox", { name: "Email" });
    // One predictable rule beats guessing how to interleave two authored descriptions.
    expect(field).toHaveAttribute("aria-describedby", "external");
  });

  it("emits no aria-describedby when there is no description", () => {
    render(<Textbox id="name" label="Name" />);

    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAttribute("aria-describedby");
  });

  it("merges a consumer className onto the root, not onto the input", () => {
    const { container } = render(<Textbox id="name" label="Name" className="consumer-class" />);

    expect(rootOf(container)).toHaveClass("uir-textbox", "consumer-class");
    // The library's contract is that `className` always lands on the component root.
    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveClass("consumer-class");
  });

  it("forwards native input attributes to the input, not the root", () => {
    const { container } = render(
      <Textbox
        id="name"
        label="Name"
        name="fullName"
        form="profile"
        placeholder="Ada Lovelace"
        maxLength={40}
        autoComplete="name"
      />
    );

    const field = screen.getByRole("textbox", { name: "Name" });
    expect(field).toHaveAttribute("name", "fullName");
    expect(field).toHaveAttribute("form", "profile");
    expect(field).toHaveAttribute("placeholder", "Ada Lovelace");
    expect(field).toHaveAttribute("maxlength", "40");
    expect(field).toHaveAttribute("autocomplete", "name");

    // A consumer's `data-*` and test ids land here too, on the element that is the field.
    expect(rootOf(container)).not.toHaveAttribute("placeholder");
    expect(rootOf(container)).not.toHaveAttribute("maxlength");
  });

  it("forwards its ref to the input element", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Textbox id="name" label="Name" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Name" }));
  });

  it("forwards its ref to the textarea when multiline", () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textbox id="bio" label="Bio" multiline ref={ref as never} />);

    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Bio" }));
    expect(ref.current?.tagName).toBe("TEXTAREA");
  });
});

describe("Textbox: value", () => {
  it("is uncontrolled by default and updates on typing", async () => {
    const user = userEvent.setup();
    render(<Textbox id="name" label="Name" />);

    const field = screen.getByRole("textbox", { name: "Name" });
    await user.type(field, "Ada");

    expect(field).toHaveValue("Ada");
  });

  it("reports every keystroke to onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Textbox id="name" label="Name" onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "ab");

    expect(onValueChange).toHaveBeenNthCalledWith(1, "a");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "ab");
  });

  it("honours defaultValue when uncontrolled", () => {
    render(<Textbox id="name" label="Name" defaultValue="Grace" />);

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Grace");
  });

  it("stays controlled when `value` is provided", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Textbox id="name" label="Name" value="Fixed" onValueChange={onValueChange} />);

    const field = screen.getByRole("textbox", { name: "Name" });
    await user.type(field, "x");

    expect(onValueChange).toHaveBeenCalledWith("Fixedx");
    // React is the source of truth; we report and the consumer decides.
    expect(field).toHaveValue("Fixed");
  });

  it("still forwards the native onChange event", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textbox id="name" label="Name" onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "z");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]?.[0]).toHaveProperty("target");
  });

  it("lets a consumer opt out of the internal value update", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => event.preventDefault());

    render(<Textbox id="name" label="Name" onChange={onChange} />);

    const field = screen.getByRole("textbox", { name: "Name" });
    await user.type(field, "q");

    expect(onChange).toHaveBeenCalled();
    // Consumer-first ordering is the only ordering where `preventDefault()` means anything.
    expect(field).toHaveValue("");
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState("");
      return (
        <>
          <Textbox id="name" label="Name" value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }

    render(<Harness />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "hi");

    expect(screen.getByText("hi")).toBeInTheDocument();
  });
});

describe("Textbox: states", () => {
  it("exposes states as data attributes, not class names", () => {
    const { container } = render(
      <Textbox id="name" label="Name" size="lg" variant="solid" tone="accent" invalid fullWidth />
    );

    const root = rootOf(container);
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-variant", "solid");
    expect(root).toHaveAttribute("data-tone", "accent");
    expect(root).toHaveAttribute("data-invalid", "");
    expect(root).toHaveAttribute("data-full-width", "");
    expect(root.className).not.toMatch(/invalid|full-?width/);
  });

  it("defaults size to md, variant to outline and tone to neutral", () => {
    const { container } = render(<Textbox id="name" label="Name" />);

    const root = rootOf(container);
    expect(root).toHaveAttribute("data-size", "md");
    expect(root).toHaveAttribute("data-variant", "outline");
    expect(root).toHaveAttribute("data-tone", "neutral");
    expect(root).not.toHaveAttribute("data-invalid");
  });

  it("uses the native disabled attribute, so it leaves the tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Textbox id="name" label="Name" disabled />
        <button type="button">After</button>
      </>
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
    await user.tab();
    // A native disabled input is skipped entirely rather than focused and refused.
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("marks itself disabled on the root for CSS", () => {
    const { container } = render(<Textbox id="name" label="Name" disabled />);

    expect(rootOf(container)).toHaveAttribute("data-disabled", "");
  });

  it("keeps a read-only field focusable and in the form", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Textbox id="name" label="Name" readOnly defaultValue="Ada" />
        <button type="button">After</button>
      </>
    );

    const field = screen.getByRole("textbox", { name: "Name" });
    expect(field).toHaveAttribute("readonly");
    expect(field).toHaveValue("Ada");

    // Read-only is not disabled: it is still a field the user can read and select.
    await user.tab();
    expect(document.activeElement).toBe(field);
  });

  it("marks itself read-only on the root for CSS", () => {
    const { container } = render(<Textbox id="name" label="Name" readOnly />);

    expect(rootOf(container)).toHaveAttribute("data-readonly", "");
  });

  it("adds a hidden word, not just a symbol, for required", () => {
    render(<Textbox id="name" label="Name" required />);

    const field = screen.getByRole("textbox", { name: "Name Required" });
    expect(field).toBeRequired();

    /*
     * A marker rendered as a CSS `*` from a `::after`, which a screen
     * reader cannot announce. The accessible name is where the difference is observable:
     * the hidden "Required" joins the label text and the `aria-hidden` asterisk does not,
     * so the name is "Name Required" rather than "Name * Required".
     */
    expect(field).toHaveAccessibleName("Name Required");
  });

  it("hides the asterisk itself from assistive technology", () => {
    const { container } = render(<Textbox id="name" label="Name" required />);

    const symbol = rootOf(container).querySelector(".uir-textbox__label span[aria-hidden]");
    expect(symbol).toHaveTextContent("*");
  });

  it("describes an invalid field for assistive technology", () => {
    render(<Textbox id="email" label="Email" invalid helperText="Enter a valid address" />);

    const field = screen.getByRole("textbox", { name: "Email" });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Enter a valid address");
  });

  it("omits aria-invalid until the field is invalid", () => {
    render(<Textbox id="email" label="Email" />);

    expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveAttribute("aria-invalid");
  });

  it("keeps a directly passed aria-invalid when `invalid` is false", () => {
    // Server-side validation is state this component cannot know about.
    render(<Textbox id="email" label="Email" aria-invalid />);

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Textbox: adornments", () => {
  it("hides adornments from assistive technology", () => {
    const { container } = render(
      <Textbox
        id="amount"
        label="Amount"
        startAdornment={<span data-testid="start">$</span>}
        endAdornment={<span data-testid="end">.00</span>}
      />
    );

    // An icon beside a field must not become part of the field's accessible name.
    expect(screen.getByRole("textbox", { name: "Amount" })).toBeInTheDocument();
    expect(screen.getByTestId("start").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("end").parentElement).toHaveAttribute("aria-hidden", "true");

    expect(container.querySelectorAll(".uir-textbox__adornment")).toHaveLength(2);
  });

  it("renders no adornment wrappers when none are given", () => {
    const { container } = render(<Textbox id="name" label="Name" />);

    expect(container.querySelector(".uir-textbox__adornment")).toBeNull();
  });
});

describe("Textbox: multiline", () => {
  it("renders a textarea when multiline", () => {
    render(<Textbox id="bio" label="Bio" multiline />);

    const field = screen.getByRole("textbox", { name: "Bio" });
    expect(field.tagName).toBe("TEXTAREA");
  });

  it("applies rows only to the textarea", () => {
    render(<Textbox id="bio" label="Bio" multiline rows={5} />);

    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute("rows", "5");
  });

  it("never emits a type attribute on the textarea", () => {
    render(<Textbox id="bio" label="Bio" multiline type="password" />);

    // `type` is not valid on a textarea; forwarding it would put a meaningless attribute
    // in the DOM.
    expect(screen.getByRole("textbox", { name: "Bio" })).not.toHaveAttribute("type");
  });

  it("marks itself multiline on the root for CSS", () => {
    const { container } = render(<Textbox id="bio" label="Bio" multiline />);

    expect(rootOf(container)).toHaveAttribute("data-multiline", "");
  });

  it("behaves like any other textbox", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Textbox id="bio" label="Bio" multiline onValueChange={onValueChange} />);

    const field = screen.getByRole("textbox", { name: "Bio" });
    await user.type(field, "Hello");

    expect(field).toHaveValue("Hello");
    expect(onValueChange).toHaveBeenLastCalledWith("Hello");
  });
});

describe("Textbox: type", () => {
  it("defaults to text", () => {
    render(<Textbox id="name" label="Name" />);

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("type", "text");
  });

  it("passes a narrowed native type through", () => {
    render(<Textbox id="email" label="Email" type="email" />);

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("type", "email");
  });

  it("renders a password field, which the platform keeps out of the accessibility tree", () => {
    const { container } = render(
      <Textbox id="pw" label="Password" type="password" defaultValue="hunter2" />
    );

    /*
     * `getByRole("textbox")` deliberately finds nothing: a password input has no
     * corresponding ARIA role, which is how assistive technology is kept from reading
     * back what was typed. Asserting the role is absent is the point, so the element is
     * reached by its type attribute.
     */
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    const field = rootOf(container).querySelector("input");
    expect(field).toHaveAttribute("type", "password");
    expect(field).toHaveValue("hunter2");
  });
});

describe("Textbox: keyboard", () => {
  it("is reachable with Tab and editable with the keyboard alone", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Textbox id="name" label="Name" />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    const field = screen.getByRole("textbox", { name: "Name" });
    expect(document.activeElement).toBe(field);

    await user.keyboard("Ada");
    expect(field).toHaveValue("Ada");

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("moves the caret with the arrow and Home/End keys", async () => {
    const user = userEvent.setup();
    render(<Textbox id="name" label="Name" defaultValue="Ada" />);

    const field = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    await user.click(field);
    await user.keyboard("{Home}!");
    expect(field).toHaveValue("!Ada");

    await user.keyboard("{End}?");
    expect(field).toHaveValue("!Ada?");
  });
});

describe("Textbox: no DOM leakage", () => {
  /*
   * Every prop is destructured rather than read as `props.x`, so none of them can reach
   * the DOM. React lowercases an unrecognised camelCase attribute and passes it straight
   * through, so a leftover `onValueChange` would appear as `onvaluechange="…"` and
   * `helperText` as `helpertext`. jsdom does not warn, and no behavioural assertion looks
   * at these attributes, so the exact set is asserted instead.
   */
  it("renders no attribute the component does not own", () => {
    const { container } = render(
      <Textbox
        id="name"
        label="Name"
        helperText="Hint"
        invalid
        required
        readOnly
        multiline
        fullWidth
        variant="ghost"
        tone="positive"
        size="sm"
        value="Ada"
        onValueChange={() => undefined}
        startAdornment="$"
      />
    );

    const root = rootOf(container);
    const allowed = new Set([
      "class",
      "data-disabled",
      "data-full-width",
      "data-invalid",
      "data-multiline",
      "data-readonly",
      "data-size",
      "data-tone",
      "data-variant",
    ]);

    for (const name of root.getAttributeNames()) {
      expect(allowed.has(name), `unexpected attribute ${name}="${root.getAttribute(name)}"`).toBe(
        true
      );
    }
  });

  it("never emits prop names as attributes on the input", () => {
    render(
      <Textbox
        id="name"
        label="Name"
        defaultValue="Ada"
        onValueChange={() => undefined}
        invalid
        readOnly
      />
    );

    const field = screen.getByRole("textbox", { name: "Name" });
    const names = field.getAttributeNames();

    /*
     * Each of these is a *prop* name, not a native attribute: if any reached the element,
     * React would have lowercased it and passed it through, which is exactly the failure
     * mode `ToggleButtonGroup` had. `readonly` and `required` are the opposite case and
     * are asserted as present in the states suite.
     */
    for (const leaked of ["onvaluechange", "invalid", "defaultvalue", "size", "variant", "tone"]) {
      expect(names, `input leaked ${leaked}`).not.toContain(leaked);
    }
  });

  it("keeps the native readonly attribute, which is spelled without a dash", () => {
    render(<Textbox id="name" label="Name" readOnly />);

    // The distinction matters: `data-readonly` is ours, `readonly` is the platform's.
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("readonly");
  });
});

describe("Textbox: development warnings", () => {
  /*
   * A visible label that is not associated renders perfectly and announces nothing. The
   * only moment that can be caught is development, which is why this is a warning rather
   * than a throw: a consumer who associated the field themselves has satisfied a
   * requirement this check cannot see.
   */
  it("warns when a label has no id to bind to", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Textbox label="Name" />);

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("without an `id`"))).toBe(true);
    warn.mockRestore();
  });

  it("warns when helper text has no id to be announced by", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Textbox helperText="Hint" />);

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("aria-describedby"))).toBe(true);
    warn.mockRestore();
  });

  it("says nothing when an id is supplied", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Textbox id="name" label="Name" helperText="Hint" />);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("says nothing for a field with neither label nor description", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Textbox />);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Textbox: direction and scheme", () => {
  it("renders and types inside an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Textbox id="name" label="الاسم" />, { dir: "rtl" });

    const host = screen.getByRole("textbox", { name: "الاسم" }).closest("[dir]") as HTMLElement;
    expect(host).toHaveAttribute("dir", "rtl");

    await user.type(screen.getByRole("textbox", { name: "الاسم" }), "آدم");
    expect(screen.getByRole("textbox", { name: "الاسم" })).toHaveValue("آدم");
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Textbox id="name" label="Name" helperText="Hint" invalid />,
        { scheme }
      );

      expect(screen.getByRole("textbox", { name: "Name" }), scheme).toBeInTheDocument();
      unmount();
    }
  });

  it("renders at both densities", () => {
    for (const density of ["compact", "comfortable"] as const) {
      const { unmount } = renderWithProviders(<Textbox id="name" label="Name" />, { density });

      expect(screen.getByRole("textbox", { name: "Name" }), density).toBeInTheDocument();
      unmount();
    }
  });
});
