/**
 * Drawer stories.
 *
 * The states that matter are the two modes, because `modal` defaults to **false** and that is the
 * component's most consequential decision: a navigation drawer that traps focus is worse than one
 * that does not, because the user cannot reach the item they opened it to change.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Drawer } from "uireload/components/drawer";
import { Text } from "uireload/components/text";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: { layout: "fullWidth" },
  argTypes: {
    placement: {
      control: "inline-radio",
      options: ["inline-start", "inline-end", "block-start", "block-end"],
    },
    modal: { control: "boolean" },
    showClose: { control: "boolean" },
    dismissOnBackdropClick: { control: "boolean" },
  },
  args: {
    placement: "inline-start",
    modal: false,
    showClose: true,
    dismissOnBackdropClick: true,
    title: "Navigation",
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A non-modal navigation drawer.
 *
 * The page beside it stays usable and reachable, and focus is moved into the drawer so a keyboard
 * user can get in at all — then `Tab` moves out again rather than trapping.
 */
export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);

    return (
      <div style={{ padding: "2rem", minHeight: "60vh" }}>
        <Button onClick={() => setOpen(true)}>Open navigation</Button>

        <Drawer {...args} open={open} onClose={() => setOpen(false)}>
          <nav aria-label="Sections">
            <ul
              style={{ display: "grid", gap: "0.5rem", listStyle: "none", margin: 0, padding: 0 }}
            >
              {["Overview", "Projects", "Deployments", "Analytics", "Settings"].map((item) => (
                <li key={item}>
                  <a href="#section" style={{ color: "inherit" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Drawer>

        <p style={{ color: "var(--uir-text-muted)", maxWidth: "28rem" }}>
          Press <kbd>Escape</kbd> to close. Click the page beside the drawer, or tab past it — a
          non-modal drawer does not trap you here.
        </p>
      </div>
    );
  },
};

/**
 * Modal.
 *
 * `aria-modal="true"`, a focus trap and a scroll lock. The right choice for a confirmation or a filter
 * panel that must be finished with before anything else happens — and the wrong one for navigation.
 */
export const Modal: Story = {
  args: { modal: true, title: "Confirm" },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem", minHeight: "60vh" }}>
        <Button tone="danger" onClick={() => setOpen(true)}>
          Delete project
        </Button>

        <Drawer
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <div style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button tone="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </div>
          }
        >
          <Text>
            This removes the project, its builds, its domains and every environment variable it ever
            had. None of it can be recovered.
          </Text>
        </Drawer>
      </div>
    );
  },
};

/**
 * Every placement.
 *
 * Logical rather than physical: `inline-start` is the reading direction's leading edge, so the whole
 * set mirrors in RTL without a second prop. A drawer pinned to the physical left in an RTL page is
 * on the wrong side of the reading flow.
 */
export const Placements: Story = {
  render: function Render(args) {
    const [placement, setPlacement] = useState<(typeof args)["placement"]>("inline-start");

    return (
      <div style={{ padding: "2rem", minHeight: "70vh" }}>
        <div style={{ display: "flex", gap: "var(--uir-space)", flexWrap: "wrap" }}>
          {(["inline-start", "inline-end", "block-start", "block-end"] as const).map((value) => (
            <Button
              key={value}
              variant={value === placement ? "solid" : "outline"}
              onClick={() => setPlacement(value)}
            >
              {value}
            </Button>
          ))}
        </div>

        <Drawer
          {...args}
          placement={placement}
          title={placement}
          open
          size={placement === "inline-start" || placement === "inline-end" ? "18rem" : "12rem"}
        >
          <Text>Open all four to see the edge rules and the body scroll.</Text>
        </Drawer>
      </div>
    );
  },
};

/** A bottom drawer, which is `inline-size: 100%` rather than sizing to its content. */
export const BottomSheet: Story = {
  args: { placement: "block-end", title: "Filters", size: "16rem" },
  render: function Render(args) {
    const [open, setOpen] = useState(true);

    return (
      <div style={{ padding: "2rem", minHeight: "80vh" }}>
        <Button onClick={() => setOpen(true)}>Open filters</Button>

        <Drawer
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          modal
          footer={
            <Button fullWidth onClick={() => setOpen(false)}>
              Apply filters
            </Button>
          }
        >
          <Text>Filters go here. The body is the only scrolling part.</Text>
        </Drawer>
      </div>
    );
  },
};

/** No close control, for a drawer the user dismisses some other way — Escape, or a selection. */
export const NoCloseControl: Story = {
  args: { showClose: false, title: "Pick a workspace" },
  render: (args) => (
    <Drawer {...args} open>
      <ul style={{ display: "grid", gap: "0.5rem", listStyle: "none", margin: 0, padding: 0 }}>
        {["Acme Inc", "Acme Labs", "Personal"].map((item) => (
          <li key={item}>
            <Button fullWidth variant="ghost">
              {item}
            </Button>
          </li>
        ))}
      </ul>
    </Drawer>
  ),
};

/** A named drawer with no title, using `aria-label` on the root instead. */
export const LabelledWithoutTitle: Story = {
  args: { showClose: false, title: undefined },
  render: (args) => (
    <Drawer {...args} aria-label="Filters" open size="20rem">
      <Text>No title, so the name comes from the root props.</Text>
    </Drawer>
  ),
};

/** Header and footer, pinned above and below the scrolling body. */
export const WithHeaderAndFooter: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);

    return (
      <div style={{ padding: "2rem", minHeight: "70vh" }}>
        <Button onClick={() => setOpen(true)}>Open</Button>

        <Drawer
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          header={
            <Text overline tone="muted">
              Step 2 of 3
            </Text>
          }
          footer={
            <Button fullWidth onClick={() => setOpen(false)}>
              Continue
            </Button>
          }
          size="22rem"
        >
          {Array.from({ length: 24 }, (_, index) => (
            <Text key={index} style={{ paddingBlock: "0.25rem" }}>
              Row {index + 1}
            </Text>
          ))}
        </Drawer>
      </div>
    );
  },
};

/** The dismissal reasons, which a consumer cannot otherwise tell apart. */
export const DismissReasons: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const [last, setLast] = useState<string | null>(null);

    return (
      <div style={{ padding: "2rem", minHeight: "70vh" }}>
        <div style={{ display: "flex", gap: "var(--uir-space)", alignItems: "center" }}>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <Text tone="muted">
            Last dismissal: <code>{last ?? "none yet"}</code>
          </Text>
        </div>

        <Drawer
          {...args}
          modal
          open={open}
          onClose={(reason) => {
            setLast(`onClose: ${reason}`);
            setOpen(false);
          }}
          onDismiss={(reason) => setLast(`onDismiss: ${reason}`)}
        >
          <Text>
            Press <kbd>Escape</kbd>, click the backdrop, or press the close control. A consumer that
            navigates on <code>onDismiss</code> can tell each apart.
          </Text>
        </Drawer>
      </div>
    );
  },
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: function Render(args) {
    const [open, setOpen] = useState(true);

    return (
      <div style={{ padding: "2rem", minHeight: "70vh" }}>
        <Button onClick={() => setOpen(true)}>فتح</Button>

        <Drawer {...args} modal open={open} onClose={() => setOpen(false)} title="التنقل">
          <Text>الدرج على حافة القراءة، فينعكس تلقائياً.</Text>
        </Drawer>
      </div>
    );
  },
};
