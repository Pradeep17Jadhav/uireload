/**
 * Dialog stories.
 *
 * A dialog's states are mostly about what the user has to decide and what happens if they press
 * the wrong thing, so the stories here are about those decisions rather than about prop
 * permutations. The toolbar covers RTL, dark, high-contrast and density.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Dialog } from "uireload/components/dialog";
import { Switch } from "uireload/components/switch";
import { Textbox } from "uireload/components/textbox";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    urgency: {
      control: "inline-radio",
      options: ["normal", "alert"],
      description:
        "`alert` takes role=alertdialog, which assistive technology announces as soon as it appears. Right for a destructive confirmation that must not be missed, wrong for anything routine.",
    },
    initialFocus: {
      control: "inline-radio",
      options: ["auto", "container"],
      description:
        "`container` focuses the dialog itself rather than its first control — for a destructive confirmation, where focusing the dangerous button is one keystroke away.",
    },
    closeOnEscape: { control: "boolean" },
    closeOnBackdropPress: {
      control: "boolean",
      description:
        "Turn off for a destructive confirmation: a stray click should not discard work.",
    },
    restoreFocus: { control: "boolean" },
    showCloseButton: { control: "boolean" },
    open: { description: "Controlled state. Leave unset for uncontrolled." },
    defaultOpen: { description: "Initial state when uncontrolled." },
  },
  args: {
    size: "md",
    tone: "neutral",
    urgency: "normal",
    initialFocus: "auto",
    closeOnEscape: true,
    closeOnBackdropPress: true,
    restoreFocus: true,
    showCloseButton: false,
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj;

/**
 * The default: a centred modal that takes focus, traps `Tab`, blocks page scroll, and returns
 * focus to the trigger on close.
 */
export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Dialog {...args} open={open} onOpenChange={setOpen} title="Delete this project?">
          <p style={{ marginTop: 0 }}>
            This cannot be undone. The project and all of its history will be removed.
          </p>
        </Dialog>
      </div>
    );
  },
};

/**
 * A destructive confirmation, done carefully.
 *
 * Three things at once, and each is a decision: `tone="danger"` says what it means, `urgency="alert"`
 * says the user must not miss it, and `initialFocus="container"` puts focus on the dialog rather
 * than one keystroke from the destructive button. Backdrop presses are off, so a stray click
 * cannot discard the user's work.
 */
export const DestructiveConfirmation: Story = {
  args: {
    tone: "danger",
    urgency: "alert",
    initialFocus: "container",
    closeOnBackdropPress: false,
    size: "sm",
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Button variant="outline" tone="danger" onClick={() => setOpen(true)}>
          Delete project
        </Button>
        <Dialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          title="Delete this project?"
          footer={
            <div style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="solid" tone="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </div>
          }
        >
          <p style={{ margin: 0 }}>
            <strong>acme-design-system</strong> and all of its history will be removed. This cannot
            be undone.
          </p>
        </Dialog>
      </div>
    );
  },
};

/**
 * A form. The footer stays put while the content scrolls, because action buttons that scroll away
 * are the reason users cannot complete a dialog.
 */
export const WithAForm: Story = {
  args: { size: "lg", showCloseButton: true },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Add a member
        </Button>
        <Dialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          title="Add a member"
          footer={
            <div style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="solid" tone="accent" onClick={() => setOpen(false)}>
                Add member
              </Button>
            </div>
          }
        >
          <div style={{ display: "grid", gap: "var(--uir-space)" }}>
            <Textbox id="email" label="Email address" type="email" required />
            <Textbox id="role" label="Role" defaultValue="Editor" />
            <Switch id="notify" label="Send an invitation email" defaultChecked />
          </div>
        </Dialog>
      </div>
    );
  },
};

/** Every size. Size is a `data-*` attribute, so CSS owns the actual width. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <ControlledDialog key={size} {...args} size={size} title={`Size ${size}`}>
          <p style={{ margin: 0 }}>
            A dialog&apos;s size is a content decision, so it changes the maximum width and nothing
            else — the padding, type scale and control sizes stay identical.
          </p>
        </ControlledDialog>
      ))}
    </div>
  ),
};

/** A dialog with its own trigger, used by the `Sizes` and `Tones` stories. */
function ControlledDialog({ children, ...props }: Partial<React.ComponentProps<typeof Dialog>>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open
      </Button>
      <Dialog {...props} open={open} onOpenChange={setOpen} title={props.title}>
        {children}
      </Dialog>
    </>
  );
}

/**
 * Every tone.
 *
 * Note what a `positive` dialog is *not*: it is not an `alertdialog`. Urgency and intent are
 * separate decisions here, which is the one deliberate divergence from the obvious design —
 * see `README.md`.
 */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <ControlledDialog key={tone} {...args} tone={tone} title={`Tone ${tone}`}>
          <p style={{ margin: 0 }}>
            Intent says what it means; urgency says whether it interrupts.
          </p>
        </ControlledDialog>
      ))}
    </div>
  ),
};

/**
 * Requires an explicit decision.
 *
 * Escape and backdrop presses are both off, so the only way out is one of the two buttons. For a
 * step in a wizard, or anything where a stray dismissal loses state.
 */
export const RequiresAnExplicitDecision: Story = {
  args: {
    closeOnEscape: false,
    closeOnBackdropPress: false,
    size: "sm",
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Start the migration
        </Button>
        <Dialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          title="Step 1 of 3"
          footer={
            <div
              style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "space-between" }}
            >
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="solid" tone="accent" onClick={() => setOpen(false)}>
                Next
              </Button>
            </div>
          }
        >
          <p style={{ margin: 0 }}>
            Neither Escape nor a click outside will close this. Use the buttons.
          </p>
        </Dialog>
      </div>
    );
  },
};

/**
 * A notification that does not interrupt.
 *
 * `urgency="normal"` is the default, and it is right here: the user can read this whenever they
 * next look. Making it `alert` would announce it over whatever they were doing.
 */
export const NonUrgentNotice: Story = {
  args: { size: "sm", tone: "positive", showCloseButton: true },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          What changed?
        </Button>
        <Dialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          title="What changed"
          footer={
            <Button variant="solid" onClick={() => setOpen(false)}>
              Got it
            </Button>
          }
        >
          <p style={{ margin: 0 }}>Version 2.0 removes the deprecated `color` prop.</p>
        </Dialog>
      </div>
    );
  },
};

/**
 * Force a high-contrast / RTL check. The toolbar already covers both, but a dedicated story means
 * a screenshot review can include them without depending on toolbar state.
 */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: { tone: "danger", urgency: "alert", closeOnBackdropPress: false },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Button variant="outline" tone="danger" onClick={() => setOpen(true)}>
          حذف المشروع
        </Button>
        <Dialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          title="حذف هذا المشروع؟"
          initialFocus="container"
          footer={
            <div style={{ display: "flex", gap: "var(--uir-space)", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button variant="solid" tone="danger" onClick={() => setOpen(false)}>
                حذف
              </Button>
            </div>
          }
        >
          <p style={{ margin: 0 }}>لا يمكن التراجع عن هذا الإجراء.</p>
        </Dialog>
      </div>
    );
  },
};
