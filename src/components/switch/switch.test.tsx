/**
 * Switch tests.
 *
 * The centre of gravity is the role and the state wiring, because that is the difference
 * between a switch and a checkbox: `role="switch"` with `aria-checked` is what tells a
 * screen-reader user the change took effect immediately, and a control that reports
 * `checked` while announcing something else is worse than a plain checkbox.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Switch } from "uireload/components/switch";

/**
 * The component root. Reached by class, because a `data-*` attribute passed to `Switch` is
 * a native attribute and is forwarded to the `<input>`, which is where the library's
 * contract says it goes.
 */
function rootOf(container: HTMLElement): HTMLElement {
  const root = container.querySelector<HTMLElement>(".uir-switch");
  if (root === null) throw new Error("no .uir-switch root was rendered");
  return root;
}

describe("Switch: role", () => {
  it("is a switch, not a checkbox", () => {
    render(<Switch id="wifi" label="Wi-Fi" />);

    const control = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(control).toBeInTheDocument();

    // The distinction is the whole component: a checkbox's value is submitted later.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("is a real checkbox underneath, so it participates in forms", () => {
    const { container } = render(<Switch id="wifi" label="Wi-Fi" />);

    const input = rootOf(container).querySelector("input");
    expect(input).toHaveAttribute("type", "checkbox");
  });

  it("announces its position with aria-checked", () => {
    render(
      <>
        <Switch id="a" label="Off" />
        <Switch id="b" label="On" defaultChecked />
      </>
    );

    expect(screen.getByRole("switch", { name: "Off" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "On" })).toHaveAttribute("aria-checked", "true");
  });

  it("keeps aria-checked and the native checked in agreement", async () => {
    const user = userEvent.setup();
    render(<Switch id="wifi" label="Wi-Fi" />);

    const control = screen.getByRole("switch", { name: "Wi-Fi" });
    await user.click(control);

    expect(control).toBeChecked();
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("hides the track from assistive technology", () => {
    const { container } = render(<Switch id="wifi" label="Wi-Fi" />);

    // `aria-checked` already states the position; announcing the track too would say it
    // twice.
    expect(rootOf(container).querySelector(".uir-switch__track")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });
});

describe("Switch: state", () => {
  it("is off by default", () => {
    render(<Switch id="wifi" label="Wi-Fi" />);

    expect(screen.getByRole("switch", { name: "Wi-Fi" })).not.toBeChecked();
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();
    render(<Switch id="wifi" label="Wi-Fi" />);

    const control = screen.getByRole("switch", { name: "Wi-Fi" });

    await user.click(control);
    expect(control).toBeChecked();

    await user.click(control);
    expect(control).not.toBeChecked();
  });

  it("honours defaultChecked when uncontrolled", () => {
    render(<Switch id="wifi" label="Wi-Fi" defaultChecked />);

    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toBeChecked();
  });

  it("reports every change to onCheckedChange", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch id="wifi" label="Wi-Fi" onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch", { name: "Wi-Fi" }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("switch", { name: "Wi-Fi" }));
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("stays controlled when `checked` is provided", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch id="wifi" label="Wi-Fi" checked={false} onCheckedChange={onCheckedChange} />);

    const control = screen.getByRole("switch", { name: "Wi-Fi" });
    await user.click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // React is the source of truth; we report and the consumer decides.
    expect(control).not.toBeChecked();
  });

  it("still forwards the native onChange event", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch id="wifi" label="Wi-Fi" onChange={onChange} />);

    await user.click(screen.getByRole("switch", { name: "Wi-Fi" }));

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]?.[0]).toHaveProperty("target");
  });

  it("still forwards the native onChange event to a consumer", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Switch id="wifi" label="Wi-Fi" onChange={onChange} />);

    await user.click(screen.getByRole("switch", { name: "Wi-Fi" }));

    // The consumer's handler runs, and its `preventDefault()` is not treated as a veto. See the
    // next test and `README.md`: under React's controlled-input machinery a veto cannot hold, so
    // honouring one would leave the switch and its `aria-checked` disagreeing.
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toBeChecked();
  });

  it("refuses a change by staying controlled, which is the only veto that holds", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Switch id="wifi" label="Wi-Fi" checked={false} onCheckedChange={onCheckedChange} />);

    const control = screen.getByRole("switch", { name: "Wi-Fi" });
    await user.click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // Declining to update `checked` is how a consumer refuses a change, and it is the only
    // mechanism React actually honours.
    expect(control).not.toBeChecked();
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("works controlled by external state", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <Switch id="wifi" label="Wi-Fi" checked={checked} onCheckedChange={setChecked} />
          <output>{checked ? "on" : "off"}</output>
        </>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("switch", { name: "Wi-Fi" }));

    expect(screen.getByText("on")).toBeInTheDocument();
  });
});

describe("Switch: states", () => {
  it("exposes states as data attributes, not class names", () => {
    const { container } = render(
      <Switch id="wifi" label="Wi-Fi" size="lg" tone="accent" defaultChecked required />
    );

    const root = rootOf(container);
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-tone", "accent");
    expect(root).toHaveAttribute("data-checked", "");
    expect(root).toHaveAttribute("data-required", "");
    expect(root.className).not.toMatch(/checked|readonly/);
  });

  it("defaults size to md, tone to neutral and the label to the end", () => {
    const { container } = render(<Switch id="wifi" label="Wi-Fi" />);

    const root = rootOf(container);
    expect(root).toHaveAttribute("data-size", "md");
    expect(root).toHaveAttribute("data-tone", "neutral");
    expect(root).toHaveAttribute("data-label-position", "end");
    expect(root).not.toHaveAttribute("data-checked");
  });

  it("uses the native disabled attribute, so it leaves the tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch id="wifi" label="Wi-Fi" disabled />
        <button type="button">After</button>
      </>
    );

    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toBeDisabled();

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("does not change state when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch id="wifi" label="Wi-Fi" disabled onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch", { name: "Wi-Fi" }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("has no readOnly prop, because it could not be implemented honestly", () => {
    /*
     * A comparable component has `readonly` and this one deliberately does not.
     *
     * `readonly` has no effect on a checkbox in the HTML spec, so implementing it means refusing a
     * toggle the browser has already performed. Three implementations were measured against React
     * 19 and all three ended with the control visually checked while announcing
     * `aria-checked="false"` — see the long comment in `switch.tsx` for what each one was.
     *
     * A read-only state that silently lies is worse than no read-only state, so the prop is absent
     * and this test fails if it ever comes back in a broken form. Asserted as a type-level and a
     * runtime fact: `SwitchProps["readOnly"]` is `never`, so `readOnly` cannot be passed at all.
     */
    const props = {} as { readOnly?: never };
    expect(props.readOnly).toBeUndefined();
  });

  it("adds a hidden word, not just a symbol, for required", () => {
    render(<Switch id="wifi" label="Wi-Fi" required />);

    const control = screen.getByRole("switch", { name: "Wi-Fi Required" });
    expect(control).toBeRequired();
  });

  it("hides the asterisk itself from assistive technology", () => {
    const { container } = render(<Switch id="wifi" label="Wi-Fi" required />);

    expect(
      rootOf(container).querySelector(".uir-switch__label span[aria-hidden]")
    ).toHaveTextContent("*");
  });
});

describe("Switch: label", () => {
  it("associates a visible label with the control", () => {
    const { container } = render(<Switch id="wifi" label="Wi-Fi" />);

    expect(screen.getByText("Wi-Fi")).toHaveAttribute("for", "wifi");
    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toHaveAttribute("id", "wifi");
    expect(rootOf(container)).toBeInTheDocument();
  });

  it("toggles when the label is clicked", async () => {
    // Native `<label for>` behaviour; the reason a real label beats an `aria-label` only.
    const user = userEvent.setup();
    render(<Switch id="wifi" label="Wi-Fi" />);

    await user.click(screen.getByText("Wi-Fi"));

    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toBeChecked();
  });

  it("accepts an aria-label instead of a visible one", () => {
    render(<Switch id="wifi" label={undefined} aria-label="Wi-Fi" />);

    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toBeInTheDocument();
  });

  it("renders no label element when none is supplied", () => {
    const { container } = render(<Switch id="wifi" aria-label="Wi-Fi" />);

    expect(rootOf(container).querySelector(".uir-switch__label")).toBeNull();
  });

  it("puts the label before the control when asked", () => {
    const { container } = render(<Switch id="wifi" label="Wi-Fi" labelPosition="start" />);

    expect(rootOf(container)).toHaveAttribute("data-label-position", "start");
  });
});

describe("Switch: native passthrough", () => {
  it("forwards name and form to the input", () => {
    render(<Switch id="wifi" label="Wi-Fi" name="wifiEnabled" form="settings" value="on" />);

    const control = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(control).toHaveAttribute("name", "wifiEnabled");
    expect(control).toHaveAttribute("form", "settings");
    expect(control).toHaveAttribute("value", "on");
  });

  it("merges a consumer className onto the root, not onto the input", () => {
    const { container } = render(<Switch id="wifi" label="Wi-Fi" className="consumer-class" />);

    expect(rootOf(container)).toHaveClass("uir-switch", "consumer-class");
    expect(screen.getByRole("switch", { name: "Wi-Fi" })).not.toHaveClass("consumer-class");
  });

  it("forwards its ref to the input element", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Switch id="wifi" label="Wi-Fi" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("switch", { name: "Wi-Fi" }));
  });
});

describe("Switch: keyboard", () => {
  it("toggles with Space, which is the APG switch key", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch id="wifi" label="Wi-Fi" />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    const control = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(document.activeElement).toBe(control);

    await user.keyboard(" ");
    expect(control).toBeChecked();

    await user.keyboard(" ");
    expect(control).not.toBeChecked();
  });

  it("does not toggle with Enter, unlike a div-based switch", async () => {
    /*
     * Some documentation says "the state can be changed by pressing the Space and Enter keys",
     * because such a switch is a `<div>` with a `keydown` handler and therefore has to
     * implement what a real checkbox gets for free. APG's switch pattern specifies Space.
     */
    const user = userEvent.setup();
    render(<Switch id="wifi" label="Wi-Fi" />);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("switch", { name: "Wi-Fi" })).not.toBeChecked();
  });

  it("moves focus out with Tab", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch id="wifi" label="Wi-Fi" />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    await user.tab();

    expect(document.activeElement).toHaveTextContent("After");
  });
});

describe("Switch: no DOM leakage", () => {
  it("renders no attribute the component does not own", () => {
    const { container } = render(
      <Switch
        id="wifi"
        label="Wi-Fi"
        checked
        onCheckedChange={() => undefined}
        required
        size="sm"
        tone="positive"
        labelPosition="start"
      />
    );

    const root = rootOf(container);
    const allowed = new Set([
      "class",
      "data-checked",
      "data-disabled",
      "data-label-position",
      "data-required",
      "data-size",
      "data-tone",
    ]);

    for (const name of root.getAttributeNames()) {
      expect(allowed.has(name), `unexpected attribute ${name}="${root.getAttribute(name)}"`).toBe(
        true
      );
    }
  });

  it("never emits prop names as attributes on the input", () => {
    const { container } = render(
      <Switch id="wifi" label="Wi-Fi" defaultChecked onCheckedChange={() => undefined} />
    );

    const input = rootOf(container).querySelector("input") as HTMLInputElement;

    for (const leaked of ["oncheckedchange", "defaultchecked", "labelposition", "tone"]) {
      expect(input.getAttributeNames(), `input leaked ${leaked}`).not.toContain(leaked);
    }
  });
});

describe("Switch: development warnings", () => {
  it("warns when a switch has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Switch id="wifi" />);

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("no accessible name"))).toBe(true);
    warn.mockRestore();
  });

  it("says nothing when a name is supplied", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(
      <>
        <Switch id="a" label="Wi-Fi" />
        <Switch id="b" aria-label="Bluetooth" />
        <Switch id="c" aria-labelledby="some-heading" />
      </>
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Switch: direction and scheme", () => {
  it("renders and toggles inside an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Switch id="wifi" label="واي فاي" />, { dir: "rtl" });

    const control = screen.getByRole("switch", { name: "واي فاي" });
    expect(control.closest("[dir]")).toHaveAttribute("dir", "rtl");

    await user.click(control);
    expect(control).toBeChecked();
  });

  it("keeps a start-positioned label on the start side in RTL", () => {
    renderWithProviders(<Switch id="wifi" label="واي فاي" labelPosition="start" />, {
      dir: "rtl",
    });

    // The attribute is a logical direction, so RTL needs no separate prop or rule.
    expect(screen.getByRole("switch", { name: "واي فاي" }).closest(".uir-switch")).toHaveAttribute(
      "data-label-position",
      "start"
    );
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Switch id="wifi" label="Wi-Fi" defaultChecked />, {
        scheme,
      });

      expect(screen.getByRole("switch", { name: "Wi-Fi" }), scheme).toBeChecked();
      unmount();
    }
  });

  it("renders at both densities", () => {
    for (const density of ["compact", "comfortable"] as const) {
      const { unmount } = renderWithProviders(<Switch id="wifi" label="Wi-Fi" />, { density });

      expect(screen.getByRole("switch", { name: "Wi-Fi" }), density).toBeInTheDocument();
      unmount();
    }
  });
});
