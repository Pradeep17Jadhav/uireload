/**
 * Tooltip stories.
 *
 * The states that matter are the timing ones, which no screenshot can show: a delay before it opens,
 * and a grace period before it closes. Both exist so the tooltip is readable.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Tooltip } from "uireload/components/tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  argTypes: {
    placement: {
      control: "inline-radio",
      options: ["top", "bottom", "inline-start", "inline-end"],
    },
    describe: { control: "inline-radio", options: ["tooltip", "label"] },
    delay: { control: { type: "number", min: 0, max: 1000 } },
    hideDelay: { control: { type: "number", min: 0, max: 1000 } },
    offset: { control: { type: "number", min: 0, max: 32 } },
  },
  args: {
    label: "Delete this project",
    placement: "top",
    describe: "tooltip",
    delay: 400,
    hideDelay: 200,
    offset: 8,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * Hover waits 400ms before it appears; focus shows it immediately. That difference is the whole
 * focus-versus-hover design — a keyboard user has arrived deliberately and there is no
 * "passed over the element by accident" case to guard against.
 */
export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button tone="danger">Delete</Button>
    </Tooltip>
  ),
};

/**
 * Keyboard reachable.
 *
 * The trigger wrapper carries `tabIndex={0}`, which is why a tooltip on a *non*-focusable element
 * still works. Tab to it and the tooltip appears with no delay.
 */
export const OnNonFocusable: Story = {
  args: { label: "This text has an explanation only hover can reach" },
  render: (args) => (
    <p style={{ maxWidth: "22rem" }}>
      Some <Tooltip {...args}>underlined phrase</Tooltip> in a sentence.
    </p>
  ),
};

/**
 * `describe="label"`.
 *
 * For the case where the tooltip **is** the accessible name — an icon button with no other text. A
 * `aria-describedby` supplements a name and cannot replace a missing one, so a button announced as
 * "button" and nothing else is the failure this avoids.
 */
export const AsLabel: Story = {
  args: { describe: "label", label: "Delete project" },
  render: (args) => (
    <Tooltip {...args}>
      <button
        type="button"
        aria-hidden="true"
        style={{
          background: "none",
          border: 0,
          color: "var(--uir-danger)",
          cursor: "pointer",
          font: "inherit",
          fontSize: "1.25rem",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </Tooltip>
  ),
};

/**
 * Controlled and forced open.
 *
 * `open` plus `onOpenChange` is the escape hatch for a tooltip whose text depends on data not yet
 * fetched, or one that should not appear on touch at all.
 */
export const AlwaysOpen: Story = {
  args: { open: true },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Always described</Button>
    </Tooltip>
  ),
};

/** Every placement. `inline-start` / `inline-end` mirror in RTL without a second prop. */
export const Placements: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "5rem",
        gridTemplateColumns: "repeat(2, auto)",
        justifyContent: "center",
        padding: "4rem",
      }}
    >
      {(["top", "bottom", "inline-start", "inline-end"] as const).map((placement) => (
        <Tooltip key={placement} {...args} placement={placement} label={`placement: ${placement}`}>
          <Button variant="outline">{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

/**
 * A zero-delay tooltip on a toolbar, which is the thing this component is protecting against.
 *
 * Try it: sweep the pointer across the row and count how many times the tooltip fires. At 400ms it
 * fires once, on the one you stop on.
 */
export const ZeroDelay: Story = {
  args: { delay: 0 },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-space)", padding: "2rem" }}>
      {["Bold", "Italic", "Underline", "Code"].map((label) => (
        <Tooltip key={label} {...args} label={`${label} the selection`}>
          <Button variant="outline">{label}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

/**
 * Controlled by state, driven by a button.
 *
 * Here the consumer decides when the tooltip opens, which is what a tooltip on a control that also
 * triggers work needs — hover is not the only way the explanation arrives.
 */
export const ControlledByState: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Tooltip
          label="This will sign you out everywhere"
          open={open}
          onOpenChange={setOpen}
          describe="label"
        >
          <Button tone="danger">Sign out</Button>
        </Tooltip>
      </div>
    );
  },
};

/** A long tooltip, which wraps and stays narrow. `max-inline-size: 20ch`. */
export const LongText: Story = {
  args: {
    open: true,
    label:
      "Deleting a project removes its builds, its domains, and every environment variable it ever had, and none of it can be recovered afterwards.",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button tone="danger">Delete</Button>
    </Tooltip>
  ),
};

/**
 * No label.
 *
 * Renders the wrapper and nothing else. A tooltip with no text is a focus stop that goes nowhere.
 */
export const NoLabel: Story = {
  args: { label: undefined },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Nothing to say</Button>
    </Tooltip>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-space)", padding: "3rem" }}>
      {(["top", "bottom", "inline-start", "inline-end"] as const).map((placement) => (
        <Tooltip key={placement} {...args} placement={placement} label={placement} open>
          <Button variant="outline">زر</Button>
        </Tooltip>
      ))}
    </div>
  ),
};
