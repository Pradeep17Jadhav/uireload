/**
 * Popover stories.
 *
 * The interesting axes are not its visual states — there are few — but the three decisions
 * that change how it behaves: modality, what dismisses it, and which side it opens on. Those
 * are what the stories here are about.
 */

import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Popover } from "uireload/components/popover";
import { Textbox } from "uireload/components/textbox";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    placement: {
      control: "inline-radio",
      options: ["bottom", "top", "start", "end"],
      description:
        "Logical, so `start` is left in LTR and right in RTL. Flips to the opposite side when the requested one overflows.",
    },
    align: { control: "inline-radio", options: ["center", "stretch"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    modal: {
      control: "boolean",
      description:
        "Takes focus, traps Tab, blocks scroll and renders a backdrop. A non-modal popover does none of that, which is what a dropdown needs.",
    },
    arrow: { control: "boolean" },
    autoFocus: { control: "boolean" },
    restoreFocus: { control: "boolean" },
    closeOnEscape: { control: "boolean" },
    closeOnOutsidePress: { control: "boolean" },
    closeOnAnchorOutOfView: {
      control: "boolean",
      description:
        "Closes when the anchor scrolls out of view, so the surface never floats over unrelated content.",
    },
    open: { description: "Controlled state. Leave unset for uncontrolled." },
    defaultOpen: { description: "Initial state when uncontrolled." },
  },
  args: {
    placement: "bottom",
    align: "center",
    tone: "neutral",
    modal: false,
    arrow: false,
    autoFocus: true,
    restoreFocus: true,
    closeOnEscape: true,
    closeOnOutsidePress: true,
    closeOnAnchorOutOfView: true,
  },
} satisfies Meta<typeof Popover>;

export default meta;

/*
 * Untyped on purpose.
 *
 * `StoryObj<typeof meta>` would make every story supply `args`, because `anchor` is a required
 * prop — and it is a required prop for a good reason: a popover with no anchor has nothing to
 * position against, which is exactly the `data-unpositioned` state rather than the normal one.
 *
 * Every story here builds its own anchor inside `render`, since an anchor is a live DOM node
 * and not something a static args table can express. Declaring the story type loosely keeps that
 * honest instead of forcing `anchor: null` into twenty stories that never use it. The controls
 * are still typed and still come from `meta`, so the control panel is unaffected.
 */
type Story = StoryObj;

/**
 * The default: non-modal, anchored below the trigger.
 *
 * Non-modal is the default because that is what a popover nearly always is. It does not take
 * focus, does not trap `Tab` and does not lock scroll, because the user is still working in
 * the page around it. A dropdown that steals focus on open is unusable with a keyboard.
 */
export const Default: Story = {
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <div style={{ minBlockSize: "12rem", padding: "2rem" }}>
        <Button ref={trigger} variant="outline" onClick={() => setOpen(true)}>
          Show details
        </Button>
        <Popover {...args} open={open} onOpenChange={setOpen} anchor={trigger} title="Details">
          <p style={{ margin: 0 }}>
            Supplementary content, anchored to the button above it. Press Escape or click away to
            dismiss.
          </p>
        </Popover>
      </div>
    );
  },
};

/** Controlled: the consumer owns the state and decides when to open it. */
export const Controlled: Story = {
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(true);

    return (
      <div style={{ minBlockSize: "12rem", padding: "2rem" }}>
        <Button ref={trigger} variant="outline" onClick={() => setOpen((value) => !value)}>
          Toggle
        </Button>
        <Popover {...args} open={open} onOpenChange={setOpen} anchor={trigger} title="Details">
          <p style={{ margin: 0 }}>The button above toggles this surface.</p>
        </Popover>
      </div>
    );
  },
};

/**
 * Modal. Takes focus on open, traps `Tab`, blocks page scroll and renders a backdrop.
 *
 * The contrast with `Default` is the point: use it when the surface must be dealt with before
 * anything else, and not otherwise.
 */
export const Modal: Story = {
  args: { modal: true, arrow: true },
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <div style={{ minBlockSize: "14rem", padding: "2rem" }}>
        <Button ref={trigger} variant="solid" tone="accent" onClick={() => setOpen(true)}>
          Open modal
        </Button>
        <Popover {...args} open={open} onOpenChange={setOpen} anchor={trigger} title="Confirm">
          <p style={{ marginTop: 0 }}>
            Focus is inside this surface, `Tab` cannot leave it, and the page behind will not
            scroll.
          </p>
          <div style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" tone="accent" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </div>
        </Popover>
      </div>
    );
  },
};

/**
 * Every placement.
 *
 * `start` and `end` are logical, so these four stories cover eight positions once the RTL
 * toolbar is switched on. Each also flips to its opposite side if the requested one would
 * overflow the viewport.
 */
export const Placements: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "5rem",
        gridTemplateColumns: "repeat(3, max-content)",
        justifyContent: "center",
        padding: "4rem 2rem",
      }}
    >
      {(["bottom", "top", "start", "end"] as const).map((placement) => (
        <Anchored key={placement} {...args} placement={placement} />
      ))}
    </div>
  ),
};

/** A trigger with a surface already open, used by the `Placements` and `Tones` stories. */
function Anchored({
  placement,
  label,
  ...args
}: Omit<React.ComponentProps<typeof Popover>, "anchor" | "placement"> & {
  placement?: "bottom" | "top" | "start" | "end" | undefined;
  label?: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const name = label ?? placement ?? "bottom";

  return (
    <>
      <Button ref={trigger} variant="outline">
        {name}
      </Button>
      <Popover {...args} defaultOpen anchor={trigger} placement={placement} arrow title={name}>
        <p style={{ margin: 0, minInlineSize: "8rem" }}>Opens {name} the trigger.</p>
      </Popover>
    </>
  );
}

/** Stretched to the trigger's width, which is what a dropdown list wants. */
export const Stretched: Story = {
  args: { align: "stretch", placement: "bottom" },
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <div style={{ minBlockSize: "12rem", padding: "2rem" }}>
        <Button ref={trigger} fullWidth variant="outline" onClick={() => setOpen(true)}>
          Choose an option
        </Button>
        <Popover
          {...args}
          open={open}
          onOpenChange={setOpen}
          anchor={trigger}
          align="stretch"
          placement="bottom"
        >
          <ul style={{ listStyle: "none", margin: 0, padding: "var(--uir-space)" }}>
            {["Draft", "In review", "Published"].map((item) => (
              <li key={item} style={{ padding: "calc(var(--uir-space) * 0.5) 0" }}>
                {item}
              </li>
            ))}
          </ul>
        </Popover>
      </div>
    );
  },
};

/**
 * A surface with a header and a footer, matching its `content` /
 * `footer` structure.
 */
export const WithHeaderAndFooter: Story = {
  args: { modal: true },
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <div style={{ minBlockSize: "16rem", padding: "2rem" }}>
        <Button ref={trigger} variant="outline" onClick={() => setOpen(true)}>
          Open
        </Button>
        <Popover
          {...args}
          open={open}
          onOpenChange={setOpen}
          anchor={trigger}
          title="Shipping address"
          footer={
            <div style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "flex-end" }}>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="solid" tone="accent" onClick={() => setOpen(false)}>
                Save
              </Button>
            </div>
          }
        >
          <Textbox id="street" label="Street" placeholder="1 Example Street" />
          <div style={{ blockSize: "var(--uir-space)" }} />
          <Textbox id="city" label="City" />
        </Popover>
      </div>
    );
  },
};

/** Every tone, for the surface border. A popover has no `variant`: it is not a command. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "3rem", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Anchored key={tone} {...args} tone={tone} label={`Tone ${tone}`} />
      ))}
    </div>
  ),
};

/**
 * Anchored to a virtual element rather than a node.
 *
 * Useful when the popover belongs to a caret, a chart point or a map pin rather than to a
 * control the user can point at.
 */
export const VirtualAnchor: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    /*
     * A bare `getBoundingClientRect` object, which is all the anchor contract requires. This is
     * what is often called a `virtual element`, and it is how a popover is anchored to
     * something that has no DOM node of its own.
     */
    const anchor = {
      getBoundingClientRect: () => new DOMRect(280, 200, 120, 24),
    };

    return (
      <div style={{ minBlockSize: "14rem", padding: "2rem" }}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Show the marker
        </Button>
        {/* The invisible target the popover points at. */}
        <span
          aria-hidden="true"
          style={{
            background: "var(--uir-accent)",
            borderRadius: "50%",
            display: "inline-block",
            blockSize: "0.5rem",
            inlineSize: "0.5rem",
            marginInlineStart: "var(--uir-space)",
          }}
        />
        <Popover {...args} open={open} onOpenChange={setOpen} anchor={anchor} arrow>
          <p style={{ margin: 0 }}>Anchored to a rectangle, not an element.</p>
        </Popover>
      </div>
    );
  },
};

/**
 * Not dismissible by Escape or an outside press.
 *
 * For a surface that must be dealt with — an unsaved-changes warning, or a step in a wizard.
 * `onClose` still reports what the consumer closed it with, so a consumer can veto the close
 * and show its own confirmation instead.
 */
export const RequiresAnExplicitDecision: Story = {
  args: { modal: true, closeOnEscape: false, closeOnOutsidePress: false },
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <div style={{ minBlockSize: "14rem", padding: "2rem" }}>
        <Button ref={trigger} variant="outline" onClick={() => setOpen(true)}>
          Start editing
        </Button>
        <Popover
          {...args}
          open={open}
          onOpenChange={setOpen}
          anchor={trigger}
          title="Unsaved changes"
        >
          <p style={{ marginTop: 0 }}>
            Escape and outside presses are disabled here, so the only way out is a decision.
          </p>
          <div style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep editing
            </Button>
            <Button variant="solid" tone="danger" onClick={() => setOpen(false)}>
              Discard
            </Button>
          </div>
        </Popover>
      </div>
    );
  },
};

/**
 * Force a high-contrast / RTL check. `start` and `end` swap sides, so this is also the check
 * that the placement vocabulary is genuinely logical rather than four hardcoded directions.
 */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <div style={{ minBlockSize: "12rem", padding: "2rem" }}>
        <Button ref={trigger} variant="outline" onClick={() => setOpen(true)}>
          التفاصيل
        </Button>
        <Popover
          {...args}
          open={open}
          onOpenChange={setOpen}
          anchor={trigger}
          placement="start"
          arrow
          title="تفاصيل إضافية"
        >
          <p style={{ margin: 0 }}>يبدأ من جهة البداية في الاتجاه من اليمين إلى اليسار.</p>
        </Popover>
      </div>
    );
  },
};
