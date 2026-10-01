/**
 * ToggleButton stories.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { ToggleButton } from "uireload/components/toggle-button";

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const BOLD = "M7 5h5a3 3 0 0 1 0 6H7zM7 11h6a3 3 0 0 1 0 6H7z";

const meta = {
  title: "Components/ToggleButton",
  component: ToggleButton,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["ghost", "outline", "solid"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    defaultPressed: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Bold",
    variant: "outline",
    tone: "neutral",
    size: "md",
    defaultPressed: false,
    disabled: false,
  },
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The pressed state must be distinguishable without colour, and must survive
 * forced-colors mode, so the border weight changes too.
 */
export const Pressed: Story = {
  args: { defaultPressed: true },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-control-gap)" }}>
      <Button_pair {...args} />
    </div>
  ),
};

/** Small helper so the Variants story reads as a table rather than as JSX soup. */
function Button_pair(args: React.ComponentProps<typeof ToggleButton>) {
  return (
    <>
      <ToggleButton {...args} variant="ghost" startIcon={<Glyph d={BOLD} />}>
        Ghost
      </ToggleButton>
      <ToggleButton {...args} variant="outline" startIcon={<Glyph d={BOLD} />}>
        Outline
      </ToggleButton>
      <ToggleButton {...args} variant="solid" startIcon={<Glyph d={BOLD} />}>
        Solid
      </ToggleButton>
    </>
  );
}

/** An icon-only toggle still needs an accessible name. */
export const IconOnly: Story = {
  render: (args) => <ToggleButton {...args} aria-label="Bold" startIcon={<Glyph d={BOLD} />} />,
};

export const Disabled: Story = {
  args: { disabled: true },
};
